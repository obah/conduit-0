import request from "supertest";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { pool } from "../src/utils/db";

const app = createApp();

beforeEach(async () => {
  await pool.query("TRUNCATE accounts, customers RESTART IDENTITY CASCADE");
});

afterAll(() => pool.end());

describe("accounts", () => {
  it("creates then fetches an account", async () => {
    const customer = await request(app)
      .post("/api/customers")
      .send({ name: "Ada", email: "ada@example.com" })
      .expect(201);

    const created = await request(app)
      .post(`/api/accounts/${customer.body.id}`)
      .send({ currency: "CAD" })
      .expect(201);

    expect(created.body.customerId).toBe(customer.body.id);
    expect(created.body.currency).toBe("CAD");
    expect(created.body.status).toBe("active");

    const got = await request(app)
      .get(`/api/accounts/${created.body.id}`)
      .expect(200);

    expect(got.body.id).toBe(created.body.id);
    expect(got.body.currency).toBe("CAD");
  });

  it("returns 404 when fetching a non-existent account", async () => {
    await request(app)
      .get("/api/accounts/00000000-0000-0000-0000-000000000000")
      .expect(404);
  });

  it("closes an account and rejects closing it twice with 409", async () => {
    const customer = await request(app)
      .post("/api/customers")
      .send({ name: "Ada", email: "ada@example.com" })
      .expect(201);

    const account = await request(app)
      .post(`/api/accounts/${customer.body.id}`)
      .send({ currency: "USD" })
      .expect(201);

    const closed = await request(app)
      .post(`/api/accounts/${account.body.id}/close`)
      .expect(200);

    expect(closed.body.status).toBe("closed");

    await request(app)
      .post(`/api/accounts/${account.body.id}/close`)
      .expect(409);
  });

  it("returns 404 when closing a non-existent account", async () => {
    await request(app)
      .post("/api/accounts/00000000-0000-0000-0000-000000000000/close")
      .expect(404);
  });
});
