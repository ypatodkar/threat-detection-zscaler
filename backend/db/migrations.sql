-- Create web_logs table
CREATE TABLE IF NOT EXISTS web_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  src_ip VARCHAR(45) NOT NULL,
  "user" VARCHAR(255),
  url TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  status_code INT,
  bytes_sent BIGINT,
  bytes_received BIGINT,
  category VARCHAR(255),
  threat_classification VARCHAR(255),
  anomaly_score FLOAT DEFAULT 0,
  anomaly_reason TEXT,
  uploaded_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_web_logs_timestamp ON web_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_logs_src_ip ON web_logs(src_ip);
CREATE INDEX IF NOT EXISTS idx_web_logs_user ON web_logs("user");
CREATE INDEX IF NOT EXISTS idx_web_logs_anomaly_score ON web_logs(anomaly_score);
CREATE INDEX IF NOT EXISTS idx_web_logs_uploaded_by ON web_logs(uploaded_by_user_id);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user will be created by init-db.js script
-- This ensures proper password hashing

