CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

TRUNCATE accounts, customers;

ALTER TABLE customers ADD COLUMN owner_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
CREATE INDEX customers_owner_idx ON customers (owner_user_id);