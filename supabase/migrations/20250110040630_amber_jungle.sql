/*
  # Add payment status to services table

  1. Changes
    - Add `is_paid` boolean column to services table with default value of false
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE services ADD COLUMN is_paid boolean DEFAULT false;
  END IF;
END $$;