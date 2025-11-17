-- Create admin user with password: admin123
-- Run this directly in your database

INSERT INTO users (username, password_hash, email, name) 
VALUES (
  'admin', 
  '$2b$10$xwm8RHoO.DIgOdDrlZQmHuYFdPWDb9/MVALFsw4lN.Nm6A0K.Vlja',
  'admin@example.com',
  'Admin User'
) ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;

-- Verify the user was created
SELECT id, username, email, name, created_at FROM users WHERE username = 'admin';

