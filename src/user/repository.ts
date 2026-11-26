import { pool } from "../utils/db";
import { HashedSignUpInput, ListUsersQuery } from "./schema";

export type User = {
  id: string;
  email: string;
  createdAt: Date;
};

export type UserWithAuth = User & {
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

const PUBLIC_COLUMNS = `id, email, created_at AS "createdAt"`;
const AUTH_COLUMNS = `${PUBLIC_COLUMNS}, password_hash AS "passwordHash", failed_login_attempts AS "failedLoginAttempts", locked_until AS "lockedUntil"`;

export async function create(input: HashedSignUpInput): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING ${PUBLIC_COLUMNS}`,
    [input.email, input.passwordHash],
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Failed to create user: no row returned");
  }

  return user;
}

export async function findByEmail(
  email: string,
): Promise<UserWithAuth | undefined> {
  const { rows } = await pool.query<UserWithAuth>(
    `SELECT ${AUTH_COLUMNS} FROM users
        WHERE email = $1`,
    [email],
  );

  return rows[0];
}

export async function recordFailedLogin(
  id: string,
  maxAttempts: number,
  lockoutMinutes: number,
): Promise<void> {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = CASE
           WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
           ELSE failed_login_attempts + 1
         END,
         locked_until = CASE
           WHEN (CASE
                   WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
                   ELSE failed_login_attempts + 1
                 END) >= $2
             THEN now() + ($3 * interval '1 minute')
           ELSE NULL
         END
     WHERE id = $1`,
    [id, maxAttempts, lockoutMinutes],
  );
}

export async function resetFailedLogins(id: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = 0,
         locked_until = NULL
     WHERE id = $1
       AND (failed_login_attempts > 0 OR locked_until IS NOT NULL)`,
    [id],
  );
}

export async function list(query: ListUsersQuery): Promise<User[]> {
  const { rows } = await pool.query<User>(
    `SELECT ${PUBLIC_COLUMNS} FROM users
    ORDER BY created_at, id
    LIMIT $1 OFFSET $2`,
    [query.limit, query.offset],
  );

  return rows;
}

export async function revokeToken(
  tokenId: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `INSERT INTO revoked_tokens (token_id, expires_at)
     VALUES ($1, $2)
     ON CONFLICT (token_id) DO NOTHING`,
    [tokenId, expiresAt],
  );
}

export async function isTokenRevoked(tokenId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM revoked_tokens WHERE token_id = $1`,
    [tokenId],
  );

  return (rowCount ?? 0) > 0;
}

export async function pruneExpiredRevokedTokens(): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM revoked_tokens WHERE expires_at < now()`,
  );

  return rowCount ?? 0;
}
