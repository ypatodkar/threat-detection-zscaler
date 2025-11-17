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
-- Note: For numeric fields, prefix search isn't as relevant, but we'll keep it for consistency
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

-- Note: text_pattern_ops indexes are optimized for:
-- - ILIKE 'pattern%' (prefix searches)
-- - LIKE 'pattern%' (case-sensitive prefix searches)
-- They are NOT optimized for:
-- - ILIKE '%pattern%' (contains searches)
-- - ILIKE '%pattern' (suffix searches)

