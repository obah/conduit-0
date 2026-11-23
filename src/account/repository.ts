import { pool } from "../utils/db";
import {
  CreateAccountInput,
  ListAccountQuery,
  UpdateAccountInput,
} from "./schema";

type Status = "active" | "frozen" | "closed";

type Account = {
  id: string;
  customerId: string;
  currency: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
};

type CloseResult =
  | { kind: "closed"; account: Account }
  | { kind: "not_found" }
  | { kind: "already_closed" };

const COLUMNS = `id, customer_id AS "customerId", currency, status, created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function create(
  id: string,
  input: CreateAccountInput,
): Promise<Account> {
  const { rows } = await pool.query<Account>(
    `INSERT INTO accounts (customer_id, currency)
        VALUES ($1, $2)
        RETURNING ${COLUMNS}`,
    [id, input.currency],
  );

  const account = rows[0];

  if (!account) {
    throw new Error("Failed to create account");
  }

  return account;
}

export async function list(query: ListAccountQuery): Promise<Account[]> {
  const { rows } = await pool.query<Account>(
    // WHERE status IS NOT "active"  // ? Do I need to filter this by status?
    `SELECT ${COLUMNS} FROM accounts
        ORDER BY created_at, id
        LIMIT $1 OFFSET $2`,
    [query.limit, query.offset],
  );

  return rows;
}

export async function findById(id: string): Promise<Account | undefined> {
  const { rows } = await pool.query<Account>(
    `SELECT ${COLUMNS} FROM accounts 
        WHERE id = $1`,
    [id],
  );

  return rows[0];
}

export async function update(
  id: string,
  changes: UpdateAccountInput,
): Promise<Account | undefined> {
  const { rows } = await pool.query<Account>(
    `UPDATE accounts
         SET currency = COALESCE($2, name),
             updated_at = now()
         WHERE id = $1
         RETURNING ${COLUMNS}`,
    [id, changes.currency ?? null],
  );

  return rows[0];
}

// ? revisit the rules to allow freezing, unfreezing and closing of accounts
// on both DB layer and app layer
export async function freeze(id: string): Promise<Account | undefined> {
  const { rows } = await pool.query<Account>(
    `UPDATE accounts
         SET status = 'frozen',
         updated_at = now(),
         WHERE id = $1
         RETURNING ${COLUMNS}`,
    [id],
  );

  return rows[0];
}

export async function close(id: string): Promise<CloseResult> {
  const { rows } = await pool.query<Account>(
    `UPDATE accounts
        SET status = 'closed', updated_at = now()
      WHERE id = $1 AND status <> 'closed'
      RETURNING ${COLUMNS}`,
    [id],
  );
  if (rows[0]) return { kind: "closed", account: rows[0] };

  const { rowCount } = await pool.query(
    "SELECT 1 FROM accounts WHERE id = $1",
    [id],
  );
  return rowCount ? { kind: "already_closed" } : { kind: "not_found" };
}
