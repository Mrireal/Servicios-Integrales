/*
  # Add delete policies for clients and services

  1. Changes
    - Add DELETE policy for clients table
    - Add DELETE policy for services table
    
  2. Security
    - Users can only delete their own clients and services
    - Services must be deleted before clients can be deleted
*/

-- Add delete policy for clients
CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Add delete policy for services
CREATE POLICY "Users can delete their own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);