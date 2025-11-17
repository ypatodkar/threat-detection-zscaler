import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../db/migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migrations
    await pool.query(migrationSQL);

    // Create default admin user with hashed password
    const defaultPassword = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    // Check if admin user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (userCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        ['admin', passwordHash]
      );
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    } else {
      // Update password hash
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [passwordHash, 'admin']
      );
      console.log('✓ Default admin user password updated (username: admin, password: admin123)');
    }

    console.log('✓ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();




