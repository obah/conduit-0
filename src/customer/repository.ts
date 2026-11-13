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

export async function deleteById(id: string): Promise<Customer | undefined> {
  const { rows } = await pool.query<Customer>(
    `UPDATE customers
     SET deleted_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${COLUMNS}`,
    [id],
  );

  return rows[0];
}
