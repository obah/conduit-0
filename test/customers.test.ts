import request from "supertest";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { pool } from "../src/utils/db";

const app = createApp();

beforeEach(async () => {
  await pool.query("TRUNCATE accounts, customers RESTART IDENTITY CASCADE");
});
afterAll(() => pool.end());

describe("customers", () => {
  it("creates then fetches a customer", async () => {
    const created = await request(app)
      .post("/api/customers")
      .send({ name: "Ada", email: "ada@example.com" })
      .expect(201);

    const got = await request(app)
      .get(`/api/customers/${created.body.id}`)
      .expect(200);
    expect(got.body.email).toBe("ada@example.com");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app)
      .post("/api/customers")
      .send({ name: "A", email: "a@x.com" });

    await request(app)
      .post("/api/customers")
      .send({ name: "B", email: "a@x.com" })
      .expect(409);
  });

  it("blocks deleting a customer with open accounts", async () => {
    const c = await request(app)
      .post("/api/customers")
      .send({ name: "C", email: "c@x.com" });

    await request(app)
      .post(`/api/accounts/${c.body.id}`)
      .send({ currency: "CAD" });

    await request(app).delete(`/api/customers/${c.body.id}`).expect(409);
  });
});
