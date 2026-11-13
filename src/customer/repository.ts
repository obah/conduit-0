import { pool } from "../utils/db";
import { CreateCustomerInput } from "./schema";

type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

const COLUMNS = `id, name, email, created_at AS "createdAt", updated_at AS "updatedAt"`;

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
