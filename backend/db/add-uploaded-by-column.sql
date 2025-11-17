-- Migration script to add uploaded_by_user_id column to existing web_logs table
-- Run this if you already have a database with web_logs table

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'web_logs' 
        AND column_name = 'uploaded_by_user_id'
    ) THEN
        ALTER TABLE web_logs 
        ADD COLUMN uploaded_by_user_id INT REFERENCES users(id);
        
        CREATE INDEX IF NOT EXISTS idx_web_logs_uploaded_by ON web_logs(uploaded_by_user_id);
        
        RAISE NOTICE 'Column uploaded_by_user_id added successfully';
    ELSE
        RAISE NOTICE 'Column uploaded_by_user_id already exists';
    END IF;
END $$;


