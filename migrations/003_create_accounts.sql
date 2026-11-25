CREATE TABLE accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  currency    char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),   -- ISO 4217: CAD, USD, NGN
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'frozen', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX accounts_customer_id_idx ON accounts (customer_id);