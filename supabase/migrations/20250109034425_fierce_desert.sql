/*
  # Add notes column to services table

  1. Changes
    - Add `notes` column to `services` table for storing service comments
    - Column is nullable to maintain compatibility with existing records
    - Text type to allow for longer notes

  2. Security
    - No additional security changes needed as existing RLS policies will cover the new column
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'notes'
  ) THEN
    ALTER TABLE services ADD COLUMN notes text;
  END IF;
END $$;