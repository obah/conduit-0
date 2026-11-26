import request from "supertest";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { pool } from "../src/utils/db";

const app = createApp();
let token: string;

beforeEach(async () => {
  await pool.query(
    "TRUNCATE revoked_tokens, accounts, customers, users RESTART IDENTITY CASCADE",
  );
  const res = await request(app)
    .post("/api/user/signup")
    .send({ email: "owner@example.com", password: "password123" })
    .expect(201);
  token = res.body.accessToken;
});

afterAll(() => pool.end());

describe("customers", () => {
  it("creates then fetches a customer", async () => {
    const created = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ada", email: "ada@example.com" })
      .expect(201);

    const got = await request(app)
      .get(`/api/customers/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(got.body.email).toBe("ada@example.com");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A", email: "a@x.com" })
      .expect(201);

    await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "B", email: "a@x.com" })
      .expect(409);
  });

  it("blocks deleting a customer with open accounts", async () => {
    const c = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "C", email: "c@x.com" })
      .expect(201);

    await request(app)
      .post(`/api/accounts/${c.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currency: "CAD" })
      .expect(201);

    await request(app)
      .delete(`/api/customers/${c.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
  });
});
