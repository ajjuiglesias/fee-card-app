-- Migration: Create batches table and modify students table
-- Run this SQL in your PostgreSQL database

-- 1. Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    standard_fee DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add batch_id column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_tutor_id ON batches(tutor_id);

-- Rollback (if needed):
-- ALTER TABLE students DROP COLUMN IF EXISTS batch_id;
-- DROP TABLE IF EXISTS batches;
