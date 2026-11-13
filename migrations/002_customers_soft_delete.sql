ALTER TABLE customers ADD COLUMN deleted_at timestamptz;

ALTER TABLE customers DROP CONSTRAINT customers_email_key;

CREATE UNIQUE INDEX customers_email_active ON customers (lower(email)) WHERE deleted_at IS NULL;