-- Add name and profile_picture columns to users table
DO $$ 
BEGIN
    -- Add name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN name VARCHAR(255);
        
        RAISE NOTICE 'Column name added successfully';
    ELSE
        RAISE NOTICE 'Column name already exists';
    END IF;

    -- Add profile_picture column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN profile_picture VARCHAR(500);
        
        RAISE NOTICE 'Column profile_picture added successfully';
    ELSE
        RAISE NOTICE 'Column profile_picture already exists';
    END IF;
END $$;

