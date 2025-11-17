import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../config/database.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.headers['x-user-id'] || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query user from database
    const result = await pool.query(
      'SELECT id, username, password_hash, email, name, profile_picture FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info for frontend to store
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || null,
        name: user.name || null,
        profilePicture: user.profile_picture || null
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Basic email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email, name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, name, profile_picture',
      [username, passwordHash, email || null, null]
    );

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        name: result.rows[0].name,
        profilePicture: result.rows[0].profile_picture
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const result = await pool.query(
      'SELECT id, username, email, name, profile_picture, created_at FROM users WHERE id = $1',
      [parseInt(userId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user statistics
    const statsResult = await pool.query(
      'SELECT COUNT(*) as total_logs FROM web_logs WHERE uploaded_by_user_id = $1',
      [parseInt(userId)]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        createdAt: user.created_at,
        totalLogs: parseInt(statsResult.rows[0].total_logs)
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /auth/profile - Update user profile
router.put('/profile', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { name, email } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Update name if provided
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim() || null);
      paramCount++;
    }

    // Update email if provided
    if (email !== undefined) {
      // Validate email format
      if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken by another user
      if (email && email.trim()) {
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.trim(), parseInt(userId)]
        );
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Email already registered' });
        }
      }

      updates.push(`email = $${paramCount}`);
      values.push(email.trim() || null);
      paramCount++;
    }

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      const oldUser = await pool.query(
        'SELECT profile_picture FROM users WHERE id = $1',
        [parseInt(userId)]
      );
      
      if (oldUser.rows[0]?.profile_picture) {
        const oldPath = path.join(__dirname, '../uploads/profiles', path.basename(oldUser.rows[0].profile_picture));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Store relative path for profile picture
      const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
      updates.push(`profile_picture = $${paramCount}`);
      values.push(profilePicturePath);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(parseInt(userId));
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, name, profile_picture`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        name: result.rows[0].name,
        profilePicture: result.rows[0].profile_picture
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

export default router;



