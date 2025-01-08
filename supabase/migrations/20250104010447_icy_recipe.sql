/*
  # Add phone and location fields

  1. Changes
    - Add phone field to clients table
    - Add location field to services table
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add phone column to clients table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN phone text;
  END IF;
END $$;

-- Add location column to services table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'location'
  ) THEN
    ALTER TABLE services ADD COLUMN location text;
  END IF;
END $$;