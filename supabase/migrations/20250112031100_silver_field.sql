/*
  # Add UPDATE policy for services table

  1. Changes
    - Add policy to allow users to update their own services
    
  2. Security
    - Only authenticated users can update their own services
    - Users can only update services where they are the owner (user_id matches)
*/

CREATE POLICY "Users can update their own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);