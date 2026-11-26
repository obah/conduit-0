import request from "supertest";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { pool } from "../src/utils/db";

const app = createApp();

beforeEach(async () => {
  await pool.query(
    "TRUNCATE revoked_tokens, accounts, customers, users RESTART IDENTITY CASCADE",
  );
});

afterAll(() => pool.end());

describe("auth", () => {
  it("signs up a user and returns an access token without exposing passwordHash", async () => {
    const res = await request(app)
      .post("/api/user/signup")
      .send({ email: "ada@example.com", password: "password123" })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.tokenType).toBe("Bearer");
    expect(res.body.expiresIn).toBe(900);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate signup email with 409", async () => {
    await request(app)
      .post("/api/user/signup")
      .send({ email: "dup@example.com", password: "password123" })
      .expect(201);

    await request(app)
      .post("/api/user/signup")
      .send({ email: "dup@example.com", password: "password456" })
      .expect(409);
  });

  it("logs in with valid credentials and returns an access token", async () => {
    await request(app)
      .post("/api/user/signup")
      .send({ email: "login@example.com", password: "password123" })
      .expect(201);

    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "login@example.com", password: "password123" })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("login@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects wrong passwords with 401 and locks out with 429 after 5 failed attempts", async () => {
    await request(app)
      .post("/api/user/signup")
      .send({ email: "lock@example.com", password: "password123" })
      .expect(201);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/user/login")
        .send({ email: "lock@example.com", password: "wrongpassword" })
        .expect(401);
    }

    await request(app)
      .post("/api/user/login")
      .send({ email: "lock@example.com", password: "password123" })
      .expect(429);
  });

  it("rejects protected routes without a valid bearer token", async () => {
    const missing = await request(app).get("/api/customers").expect(401);
    expect(missing.headers["www-authenticate"]).toBe("Bearer");

    const invalid = await request(app)
      .get("/api/customers")
      .set("Authorization", "Bearer not-a-real-jwt")
      .expect(401);
    expect(invalid.headers["www-authenticate"]).toBe("Bearer");
  });

  it("revokes the access token on logout", async () => {
    const signup = await request(app)
      .post("/api/user/signup")
      .send({ email: "logout@example.com", password: "password123" })
      .expect(201);

    const token: string = signup.body.accessToken;

    await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .post("/api/user/logout")
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });
});
