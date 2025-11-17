import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { parseLogFile } from '../utils/logParser.js';
import { detectAnomalies } from '../utils/anomalyDetection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads (memory storage - no file saving)
const upload = multer({ 
  storage: multer.memoryStorage(), // Store file in memory instead of disk
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.log', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .log and .txt files are allowed'));
    }
  }
});

// POST /logs/upload
router.post('/upload', upload.single('logfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request header or body
    const userId = req.headers['x-user-id'] || req.body.userId || null;

    // Read file from memory buffer (no file system access needed)
    const fileContent = req.file.buffer.toString('utf-8');

    // Parse the log file
    const parsedLogs = parseLogFile(fileContent);

    if (parsedLogs.length === 0) {
      return res.status(400).json({ error: 'No valid log entries found in file' });
    }

    // Process logs and detect anomalies
    const processedLogs = [];
    for (let i = 0; i < parsedLogs.length; i++) {
      const log = parsedLogs[i];
      const anomaly = detectAnomalies(parsedLogs.slice(0, i + 1), log, i);
      
      const logWithAnomaly = {
        ...log,
        anomaly_score: anomaly.anomaly_score,
        anomaly_reason: anomaly.anomaly_reason
      };

      // Insert into database
      const result = await pool.query(
        `INSERT INTO web_logs 
         (timestamp, src_ip, "user", url, action, status_code, bytes_sent, bytes_received, category, threat_classification, anomaly_score, anomaly_reason, uploaded_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          logWithAnomaly.timestamp,
          logWithAnomaly.src_ip,
          logWithAnomaly.user,
          logWithAnomaly.url,
          logWithAnomaly.action,
          logWithAnomaly.status_code,
          logWithAnomaly.bytes_sent,
          logWithAnomaly.bytes_received,
          logWithAnomaly.category,
          logWithAnomaly.threat_classification,
          logWithAnomaly.anomaly_score,
          logWithAnomaly.anomaly_reason,
          userId ? parseInt(userId) : null
        ]
      );

      logWithAnomaly.id = result.rows[0].id;
      processedLogs.push(logWithAnomaly);
    }

    res.json({
      success: true,
      message: `Processed ${processedLogs.length} log entries`,
      total: processedLogs.length,
      anomalies: processedLogs.filter(log => log.anomaly_score > 0).length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing log file: ' + error.message });
  }
});

// GET /logs/events
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    console.log('GET /logs/events - Query params:', req.query);
    console.log('User ID from header:', req.headers['x-user-id']);

    // Get user ID from header
    const userId = req.headers['x-user-id'] || req.query.userId;

    // Build query with filters
    let query = 'SELECT * FROM web_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Filter by user who uploaded (if user ID is provided)
    if (userId) {
      query += ` AND uploaded_by_user_id = $${paramCount}`;
      params.push(parseInt(userId));
      paramCount++;
      console.log('Filtering by user ID:', userId);
    }

    // General search across multiple fields
    if (req.query.search) {
      console.log('Search term:', req.query.search);
      query += ` AND (
        src_ip ILIKE $${paramCount} OR
        "user" ILIKE $${paramCount} OR
        url ILIKE $${paramCount} OR
        action ILIKE $${paramCount} OR
        category ILIKE $${paramCount} OR
        threat_classification ILIKE $${paramCount}
      )`;
      params.push(`%${req.query.search}%`);
      paramCount++;
    }

    // Specific filters with partial matching
    if (req.query.src_ip) {
      query += ` AND src_ip ILIKE $${paramCount}`;
      params.push(`%${req.query.src_ip}%`);
      paramCount++;
    }

    if (req.query.user) {
      query += ` AND "user" ILIKE $${paramCount}`;
      params.push(`%${req.query.user}%`);
      paramCount++;
    }

    if (req.query.action) {
      query += ` AND action = $${paramCount}`;
      params.push(req.query.action);
      paramCount++;
    }

    if (req.query.status_code) {
      query += ` AND status_code = $${paramCount}`;
      params.push(parseInt(req.query.status_code));
      paramCount++;
    }

    if (req.query.domain) {
      query += ` AND url ILIKE $${paramCount}`;
      params.push(`%${req.query.domain}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      logs: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Error fetching logs: ' + error.message });
  }
});


// GET /logs/anomalies
router.get('/anomalies', async (req, res) => {
  try {
    // Get user ID from header (logged-in user)
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    let query = 'SELECT * FROM web_logs WHERE anomaly_score > 0';
    const params = [];
    
    // Filter by user who uploaded (if user ID is provided)
    if (userId) {
      query += ' AND uploaded_by_user_id = $1';
      params.push(parseInt(userId));
    }
    
    query += ' ORDER BY anomaly_score DESC, timestamp DESC';

    const result = await pool.query(query, params);

    res.json({
      anomalies: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ error: 'Error fetching anomalies: ' + error.message });
  }
});

// GET /logs/search - Optimized prefix search for individual columns
router.get('/search', async (req, res) => {
  try {
    const { field, q } = req.query;

    // Validate field parameter to prevent SQL injection
    const validFields = ['src_ip', 'user', 'url', 'action', 'status_code', 'category', 'threat_classification'];
    if (!field || !validFields.includes(field)) {
      return res.status(400).json({ 
        error: 'Invalid field parameter. Must be one of: ' + validFields.join(', ')
      });
    }

    // If query is empty, return empty array
    if (!q || q.trim() === '') {
      return res.json({ data: [] });
    }

    // Get user ID from header (logged-in user)
    const userId = req.headers['x-user-id'] || req.query.userId;

    // Build parameterized query with prefix search
    // Use ILIKE for case-insensitive prefix matching
    // Note: PostgreSQL will use the text_pattern_ops index for prefix searches
    // Handle reserved keywords by quoting them
    const fieldName = field === 'user' ? '"user"' : field;
    let query = `SELECT * FROM web_logs WHERE ${fieldName} ILIKE $1`;
    const params = [`${q.trim()}%`];
    let paramCount = 2;

    // Filter by user who uploaded (if user ID is provided)
    if (userId) {
      query += ` AND uploaded_by_user_id = $${paramCount}`;
      params.push(parseInt(userId));
      paramCount++;
    }

    // Order by timestamp DESC and limit to 50 for performance
    query += ` ORDER BY timestamp DESC LIMIT 50`;

    const startTime = Date.now();
    const result = await pool.query(query, params);
    const queryTime = Date.now() - startTime;

    console.log(`Search query executed in ${queryTime}ms: field=${field}, q=${q}`);

    res.json({ 
      data: result.rows,
      queryTime: `${queryTime}ms`
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error performing search: ' + error.message });
  }
});

// GET /logs/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get user ID from header (logged-in user)
    const userId = req.headers['x-user-id'] || req.query.userId;

    // Build WHERE clause
    const whereClause = userId ? 'WHERE uploaded_by_user_id = $1' : 'WHERE 1=1';
    const params = userId ? [parseInt(userId)] : [];
    let paramCount = params.length + 1;

    // Get total logs count
    const totalLogsResult = await pool.query(
      `SELECT COUNT(*) as count FROM web_logs ${whereClause}`,
      params
    );
    const totalLogs = parseInt(totalLogsResult.rows[0].count);

    // Get anomalies count
    const anomaliesWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND anomaly_score > 0`
      : `WHERE anomaly_score > 0`;
    const anomaliesResult = await pool.query(
      `SELECT COUNT(*) as count FROM web_logs ${anomaliesWhere}`,
      params
    );
    const totalAnomalies = parseInt(anomaliesResult.rows[0].count);

    // Get high threats (anomaly_score >= 0.8)
    const highThreatsWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND anomaly_score >= 0.8`
      : `WHERE anomaly_score >= 0.8`;
    const highThreatsResult = await pool.query(
      `SELECT COUNT(*) as count FROM web_logs ${highThreatsWhere}`,
      params
    );
    const highThreats = parseInt(highThreatsResult.rows[0].count);

    // Get blocked requests
    const blockedWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND action = $2`
      : `WHERE action = $1`;
    const blockedParams = userId ? [parseInt(userId), 'BLOCK'] : ['BLOCK'];
    const blockedResult = await pool.query(
      `SELECT COUNT(*) as count FROM web_logs ${blockedWhere}`,
      blockedParams
    );
    const blockedRequests = parseInt(blockedResult.rows[0].count);

    // Get allowed requests
    const allowedWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND action = $2`
      : `WHERE action = $1`;
    const allowedParams = userId ? [parseInt(userId), 'ALLOW'] : ['ALLOW'];
    const allowedResult = await pool.query(
      `SELECT COUNT(*) as count FROM web_logs ${allowedWhere}`,
      allowedParams
    );
    const allowedRequests = parseInt(allowedResult.rows[0].count);

    // Get top threat types (exclude None, empty, and values containing "None")
    const threatTypesWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND threat_classification IS NOT NULL AND threat_classification != 'None' AND threat_classification != '' AND threat_classification NOT LIKE '%None%'`
      : `WHERE threat_classification IS NOT NULL AND threat_classification != 'None' AND threat_classification != '' AND threat_classification NOT LIKE '%None%'`;
    const threatTypesResult = await pool.query(
      `SELECT threat_classification, COUNT(*) as count 
       FROM web_logs 
       ${threatTypesWhere}
       GROUP BY threat_classification 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topThreatTypes = threatTypesResult.rows.map(row => ({
      type: row.threat_classification,
      count: parseInt(row.count)
    }));

    // Get top categories
    const topCategoriesWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND category IS NOT NULL AND category != ''`
      : `WHERE category IS NOT NULL AND category != ''`;
    const topCategoriesResult = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM web_logs 
       ${topCategoriesWhere}
       GROUP BY category 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topCategories = topCategoriesResult.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    }));

    // Get top source IPs
    const topIPsResult = await pool.query(
      `SELECT src_ip, COUNT(*) as count 
       FROM web_logs 
       ${whereClause}
       GROUP BY src_ip 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topSourceIPs = topIPsResult.rows.map(row => ({
      ip: row.src_ip,
      count: parseInt(row.count)
    }));

    // Get top users
    const topUsersWhere = userId 
      ? `WHERE uploaded_by_user_id = $1 AND "user" IS NOT NULL`
      : `WHERE "user" IS NOT NULL`;
    const topUsersResult = await pool.query(
      `SELECT "user", COUNT(*) as count 
       FROM web_logs 
       ${topUsersWhere}
       GROUP BY "user" 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topUsers = topUsersResult.rows.map(row => ({
      user: row.user,
      count: parseInt(row.count)
    }));

    res.json({
      totalLogs,
      totalAnomalies,
      blockedRequests,
      allowedRequests,
      highThreats,
      topThreatTypes,
      topCategories,
      topSourceIPs,
      topUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error fetching statistics: ' + error.message });
  }
});

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    const match = url.match(/https?:\/\/([^\/]+)/);
    return match ? match[1] : url;
  }
}

export default router;



