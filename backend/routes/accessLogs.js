import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { parseAccessLogFile } from '../utils/accessLogParser.js';
import { detectAccessLogAnomalies } from '../utils/accessLogAnomalyDetection.js';

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

// POST /access-logs/upload
router.post('/upload', upload.single('logfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request header or body
    const userId = req.headers['x-user-id'] || req.body.userId || null;

    // Read file from memory buffer (no file system access needed)
    const fileContent = req.file.buffer.toString('utf-8');

    // Parse the access log file
    const parsedLogs = parseAccessLogFile(fileContent);

    if (parsedLogs.length === 0) {
      return res.status(400).json({ error: 'No valid log entries found in file' });
    }

    // Process logs and detect anomalies
    const processedLogs = [];
    let anomalyCount = 0;

    for (let i = 0; i < parsedLogs.length; i++) {
      const log = parsedLogs[i];
      const anomaly = detectAccessLogAnomalies(parsedLogs.slice(0, i + 1), log, i);
      
      if (anomaly.anomaly_score > 0) {
        anomalyCount++;
      }

      const logWithAnomaly = {
        ...log,
        anomaly_score: anomaly.anomaly_score,
        anomaly_reason: anomaly.anomaly_reason
      };

      // Insert into database
      const result = await pool.query(
        `INSERT INTO access_logs 
         (timestamp, src_ip, "user", http_method, url_path, http_version, status_code, response_size, referer, user_agent, anomaly_score, anomaly_reason, uploaded_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          logWithAnomaly.timestamp,
          logWithAnomaly.src_ip,
          logWithAnomaly.user,
          logWithAnomaly.http_method,
          logWithAnomaly.url_path,
          logWithAnomaly.http_version,
          logWithAnomaly.status_code,
          logWithAnomaly.response_size,
          logWithAnomaly.referer,
          logWithAnomaly.user_agent,
          logWithAnomaly.anomaly_score,
          logWithAnomaly.anomaly_reason,
          userId ? parseInt(userId) : null
        ]
      );

      logWithAnomaly.id = result.rows[0].id;
      processedLogs.push(logWithAnomaly);
    }

    // No file cleanup needed - file is in memory only

    res.json({
      success: true,
      message: `Successfully processed ${processedLogs.length} access log entries`,
      total: processedLogs.length,
      anomalies: anomalyCount
    });
  } catch (error) {
    console.error('Error processing access log file:', error);
    res.status(500).json({ error: 'Error processing access log file: ' + error.message });
  }
});

// GET /access-logs/events
router.get('/events', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM access_logs';
    const params = [];
    let paramCount = 1;

    if (userId) {
      query += ` WHERE uploaded_by_user_id = $${paramCount}`;
      params.push(parseInt(userId));
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM access_logs';
    const countParams = [];
    if (userId) {
      countQuery += ' WHERE uploaded_by_user_id = $1';
      countParams.push(parseInt(userId));
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

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
    console.error('Get access log events error:', error);
    res.status(500).json({ error: 'Error fetching access logs: ' + error.message });
  }
});

// GET /access-logs/search
router.get('/search', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const { field, q } = req.query;

    if (!field || !q) {
      return res.status(400).json({ error: 'Field and query parameters are required' });
    }

    const validFields = ['src_ip', 'user', 'url_path', 'http_method', 'status_code', 'user_agent'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        error: `Invalid field parameter. Must be one of: ${validFields.join(', ')}` 
      });
    }

    const fieldName = field === 'user' ? '"user"' : field;
    
    // Handle status_code prefix search (e.g., "2" for 2xx, "4" for 4xx)
    let searchPattern = `${q}%`;
    if (field === 'status_code' && q.length === 1) {
      // For single digit, search for status codes starting with that digit
      searchPattern = `${q}%`;
    }
    
    let query = `SELECT * FROM access_logs WHERE ${fieldName}::text ILIKE $1`;
    const params = [searchPattern];
    let paramCount = 2;

    if (userId) {
      query += ` AND uploaded_by_user_id = $${paramCount}`;
      params.push(parseInt(userId));
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Search access logs error:', error);
    res.status(500).json({ error: 'Error searching access logs: ' + error.message });
  }
});

// GET /access-logs/anomalies
router.get('/anomalies', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    let query = 'SELECT * FROM access_logs WHERE anomaly_score > 0';
    const params = [];

    if (userId) {
      query += ' AND uploaded_by_user_id = $1';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY anomaly_score DESC, timestamp DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json({ anomalies: result.rows });
  } catch (error) {
    console.error('Get access log anomalies error:', error);
    res.status(500).json({ error: 'Error fetching access log anomalies: ' + error.message });
  }
});

// GET /access-logs/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const params = userId ? [parseInt(userId)] : [];

    // Total logs
    const totalWhere = userId ? 'WHERE uploaded_by_user_id = $1' : '';
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${totalWhere}`,
      params
    );
    const totalLogs = parseInt(totalResult.rows[0].count);

    // Total anomalies
    const anomaliesWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND anomaly_score > 0'
      : 'WHERE anomaly_score > 0';
    const anomaliesResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${anomaliesWhere}`,
      params
    );
    const totalAnomalies = parseInt(anomaliesResult.rows[0].count);

    // High threats (anomaly_score >= 0.8)
    const highThreatsWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND anomaly_score >= 0.8'
      : 'WHERE anomaly_score >= 0.8';
    const highThreatsResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${highThreatsWhere}`,
      params
    );
    const highThreats = parseInt(highThreatsResult.rows[0].count);

    // Status code breakdown
    const status200Where = userId ? 'WHERE uploaded_by_user_id = $1 AND status_code = 200' : 'WHERE status_code = 200';
    const status200Result = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${status200Where}`,
      params
    );
    const status200Requests = parseInt(status200Result.rows[0].count);

    const status4xxWhere = userId ? 'WHERE uploaded_by_user_id = $1 AND status_code >= 400 AND status_code < 500' : 'WHERE status_code >= 400 AND status_code < 500';
    const status4xxResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${status4xxWhere}`,
      params
    );
    const status4xxRequests = parseInt(status4xxResult.rows[0].count);

    const status5xxWhere = userId ? 'WHERE uploaded_by_user_id = $1 AND status_code >= 500' : 'WHERE status_code >= 500';
    const status5xxResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${status5xxWhere}`,
      params
    );
    const status5xxRequests = parseInt(status5xxResult.rows[0].count);

    // Top source IPs
    const topIPsWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1'
      : '';
    const topIPsResult = await pool.query(
      `SELECT src_ip, COUNT(*) as count 
       FROM access_logs 
       ${topIPsWhere}
       GROUP BY src_ip 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topSourceIPs = topIPsResult.rows.map(row => ({
      ip: row.src_ip,
      count: parseInt(row.count)
    }));

    // Top HTTP methods
    const topMethodsWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND http_method IS NOT NULL'
      : 'WHERE http_method IS NOT NULL';
    const topMethodsResult = await pool.query(
      `SELECT http_method, COUNT(*) as count 
       FROM access_logs 
       ${topMethodsWhere}
       GROUP BY http_method 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topHttpMethods = topMethodsResult.rows.map(row => ({
      method: row.http_method,
      count: parseInt(row.count)
    }));

    // Top URL paths/endpoints
    const topPathsWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND url_path IS NOT NULL'
      : 'WHERE url_path IS NOT NULL';
    const topPathsResult = await pool.query(
      `SELECT url_path, COUNT(*) as count 
       FROM access_logs 
       ${topPathsWhere}
       GROUP BY url_path 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topPaths = topPathsResult.rows.map(row => ({
      path: row.url_path,
      count: parseInt(row.count)
    }));

    // Top user agents
    const topUserAgentsWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND user_agent IS NOT NULL AND user_agent != \'-\''
      : 'WHERE user_agent IS NOT NULL AND user_agent != \'-\'';
    const topUserAgentsResult = await pool.query(
      `SELECT user_agent, COUNT(*) as count 
       FROM access_logs 
       ${topUserAgentsWhere}
       GROUP BY user_agent 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topUserAgents = topUserAgentsResult.rows.map(row => ({
      userAgent: row.user_agent.length > 50 ? row.user_agent.substring(0, 50) + '...' : row.user_agent,
      fullUserAgent: row.user_agent,
      count: parseInt(row.count)
    }));

    // Top status codes
    const topStatusCodesWhere = userId 
      ? 'WHERE uploaded_by_user_id = $1 AND status_code IS NOT NULL'
      : 'WHERE status_code IS NOT NULL';
    const topStatusCodesResult = await pool.query(
      `SELECT status_code, COUNT(*) as count 
       FROM access_logs 
       ${topStatusCodesWhere}
       GROUP BY status_code 
       ORDER BY count DESC 
       LIMIT 3`,
      params
    );
    const topStatusCodes = topStatusCodesResult.rows.map(row => ({
      statusCode: row.status_code,
      count: parseInt(row.count)
    }));

    // Calculate 2xx requests (success)
    const status2xxWhere = userId ? 'WHERE uploaded_by_user_id = $1 AND status_code >= 200 AND status_code < 300' : 'WHERE status_code >= 200 AND status_code < 300';
    const status2xxResult = await pool.query(
      `SELECT COUNT(*) as count FROM access_logs ${status2xxWhere}`,
      params
    );
    const status2xxRequests = parseInt(status2xxResult.rows[0].count);

    res.json({
      totalLogs,
      totalAnomalies,
      highThreats,
      status2xxRequests,
      status200Requests,
      status4xxRequests,
      status5xxRequests,
      topSourceIPs,
      topHttpMethods,
      topPaths,
      topUserAgents,
      topStatusCodes
    });
  } catch (error) {
    console.error('Get access log stats error:', error);
    res.status(500).json({ error: 'Error fetching access log stats: ' + error.message });
  }
});

export default router;

