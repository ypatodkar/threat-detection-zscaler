-- Create access_logs table for Apache/Nginx Common Log Format
CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  src_ip VARCHAR(45) NOT NULL,
  "user" VARCHAR(255),
  http_method VARCHAR(10),
  url_path TEXT NOT NULL,
  http_version VARCHAR(10),
  status_code INT,
  response_size BIGINT,
  referer TEXT,
  user_agent TEXT,
  anomaly_score FLOAT DEFAULT 0,
  anomaly_reason TEXT,
  uploaded_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_src_ip ON access_logs(src_ip);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs("user");
CREATE INDEX IF NOT EXISTS idx_access_logs_status_code ON access_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_anomaly_score ON access_logs(anomaly_score);
CREATE INDEX IF NOT EXISTS idx_access_logs_uploaded_by ON access_logs(uploaded_by_user_id);

-- Create text_pattern_ops indexes for prefix search
CREATE INDEX IF NOT EXISTS idx_access_logs_src_ip_prefix 
ON access_logs (src_ip text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_prefix 
ON access_logs ("user" text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_access_logs_url_path_prefix 
ON access_logs (url_path text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_access_logs_http_method_prefix 
ON access_logs (http_method text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_agent_prefix 
ON access_logs (user_agent text_pattern_ops);

