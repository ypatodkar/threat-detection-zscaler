-- Add email column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN email VARCHAR(255);
        
        RAISE NOTICE 'Column email added successfully';
    ELSE
        RAISE NOTICE 'Column email already exists';
    END IF;
END $$;

