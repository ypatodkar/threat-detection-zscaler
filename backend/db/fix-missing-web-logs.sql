-- Create web_logs table (users table already exists)
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

-- Create optimized indexes for prefix search performance
-- These indexes use text_pattern_ops for efficient ILIKE prefix queries

-- Index for src_ip prefix searches
CREATE INDEX IF NOT EXISTS idx_web_logs_src_ip_prefix 
ON web_logs (src_ip text_pattern_ops);

-- Index for user prefix searches (note: "user" is a reserved keyword, so it's quoted)
CREATE INDEX IF NOT EXISTS idx_web_logs_user_prefix 
ON web_logs ("user" text_pattern_ops);

-- Index for url prefix searches
CREATE INDEX IF NOT EXISTS idx_web_logs_url_prefix 
ON web_logs (url text_pattern_ops);

-- Index for action prefix searches
CREATE INDEX IF NOT EXISTS idx_web_logs_action_prefix 
ON web_logs (action text_pattern_ops);

-- Index for status_code (though this is numeric, we'll create a standard index)
CREATE INDEX IF NOT EXISTS idx_web_logs_status_code 
ON web_logs (status_code);

-- Index for category prefix searches
CREATE INDEX IF NOT EXISTS idx_web_logs_category_prefix 
ON web_logs (category text_pattern_ops);

-- Index for threat_classification prefix searches
CREATE INDEX IF NOT EXISTS idx_web_logs_threat_classification_prefix 
ON web_logs (threat_classification text_pattern_ops);

-- Composite index for user filtering + timestamp sorting (common query pattern)
CREATE INDEX IF NOT EXISTS idx_web_logs_user_timestamp 
ON web_logs (uploaded_by_user_id, timestamp DESC);

