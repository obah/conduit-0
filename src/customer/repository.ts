import { pool } from "../utils/db";
import {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "./schema";

type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type DeleteCustomerResult =
  | { kind: "deleted"; customer: Customer }
  | { kind: "not_found" }
  | { kind: "has_open_accounts" };

const COLUMNS = `id, name, email, created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"`;

export async function create(input: CreateCustomerInput): Promise<Customer> {
  const { rows } = await pool.query<Customer>(
    `INSERT INTO customers (name, email)
         VALUES ($1, $2)
         RETURNING ${COLUMNS}`,
    [input.name, input.email],
  );

  const customer = rows[0];
  if (!customer) {
    throw new Error("Failed to create customer: no row returned");
  }

  return customer;
}

export async function list(query: ListCustomersQuery): Promise<Customer[]> {
  const { rows } = await pool.query<Customer>(
    `SELECT ${COLUMNS} FROM customers
    WHERE deleted_at IS NULL
    ORDER BY created_at, id
    LIMIT $1 OFFSET $2`,
    [query.limit, query.offset],
  );

  return rows;
}

export async function findById(id: string): Promise<Customer | undefined> {
  const { rows } = await pool.query<Customer>(
    `SELECT ${COLUMNS} FROM customers 
    WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );

  return rows[0];
}

export async function update(
  id: string,
  changes: UpdateCustomerInput,
): Promise<Customer | undefined> {
  const { rows } = await pool.query<Customer>(
    `UPDATE customers
     SET name = COALESCE($2, name),
         email = COALESCE($3, email),
         updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${COLUMNS}`,
    [id, changes.name ?? null, changes.email ?? null],
  );

  return rows[0];
}

export async function deleteById(id: string): Promise<DeleteCustomerResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT 1 FROM customers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );

    if (!found.rowCount) {
      await client.query("ROLLBACK");
      return { kind: "not_found" };
    }

    const open = await client.query(
      `SELECT 1 FROM accounts WHERE customer_id = $1 AND status <> 'closed' LIMIT 1`,
      [id],
    );

    if (open.rowCount) {
      await client.query("ROLLBACK");
      return { kind: "has_open_accounts" };
    }

    const { rows } = await client.query<Customer>(
      `UPDATE customers SET deleted_at = now(), updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id],
    );
    const customer = rows[0];
    if (!customer) {
      throw new Error("Failed to delete customer: no row returned");
    }

    await client.query("COMMIT");
    return { kind: "deleted", customer };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
