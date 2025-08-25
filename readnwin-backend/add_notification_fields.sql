-- Migration to add missing fields to notifications table
-- Run this SQL script on your database

ALTER TABLE notifications 
ADD COLUMN is_global BOOLEAN DEFAULT FALSE,
ADD COLUMN priority VARCHAR DEFAULT 'normal',
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Update existing notifications to have default values
UPDATE notifications SET is_global = FALSE WHERE is_global IS NULL;
UPDATE notifications SET priority = 'normal' WHERE priority IS NULL;