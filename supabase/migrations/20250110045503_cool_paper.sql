/*
  # Add expenses tracking

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `type` (text) - tipo de egreso (viático, consumo, maquinaria, reparaciones)
      - `amount` (numeric) - valor del egreso
      - `details` (text) - detalles del egreso
      - `expense_date` (date) - fecha del egreso
      - `user_id` (uuid) - referencia al usuario
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on expenses table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('viatico', 'consumo', 'maquinaria', 'reparaciones')),
  amount numeric NOT NULL CHECK (amount >= 0),
  details text,
  expense_date date NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);