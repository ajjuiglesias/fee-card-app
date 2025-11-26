-- Migration: Create payment_reminders table for tracking
-- Run this SQL in your PostgreSQL database

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month_name VARCHAR(50) NOT NULL,
    reminder_date DATE NOT NULL,
    reminder_day INTEGER NOT NULL, -- 1, 5, or 10
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    message_id VARCHAR(255), -- WhatsApp message ID
    error_message TEXT,
    UNIQUE(student_id, month_name, reminder_day)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reminders_student_month ON payment_reminders(student_id, month_name);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON payment_reminders(reminder_date);

-- Rollback (if needed):
-- DROP TABLE IF EXISTS payment_reminders;
