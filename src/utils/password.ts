import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { RawSignUpInput, HashedSignUpInput } from "../user/schema";

const argon2Async = promisify(argon2);

const MEMORY = 65536;
const PASSES = 3;
const PARALLELISM = 4;
const TAG_LENGTH = 32;

const ZERO_32_B64 = Buffer.alloc(32).toString("base64").replace(/=+$/, "");
export const DUMMY_PASSWORD_HASH = `$argon2id$v=19$m=${MEMORY},t=${PASSES},p=${PARALLELISM}$${ZERO_32_B64}$${ZERO_32_B64}`;

export async function hashPassword(
  authBody: RawSignUpInput,
): Promise<HashedSignUpInput> {
  const salt = randomBytes(32);

  const hashBytes = await argon2Async("argon2id", {
    message: authBody.password,
    nonce: salt,
    parallelism: PARALLELISM,
    passes: PASSES,
    memory: MEMORY,
    tagLength: TAG_LENGTH,
  });

  const saltB64 = salt.toString("base64").replace(/=+$/, "");
  const hashB64 = hashBytes.toString("base64").replace(/=+$/, "");
  const passwordHash = `$argon2id$v=19$m=${MEMORY},t=${PASSES},p=${PARALLELISM}$${saltB64}$${hashB64}`;

  return {
    email: authBody.email,
    passwordHash,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  // Expected: ["", "argon2id", "v=19", "m=...,t=...,p=...", "<salt>", "<hash>"]
  if (parts.length !== 6 || parts[1] !== "argon2id" || parts[2] !== "v=19") {
    return false;
  }

  const paramsPart = parts[3];
  const saltB64 = parts[4];
  const hashB64 = parts[5];
  if (!paramsPart || !saltB64 || !hashB64) {
    return false;
  }

  const params = Object.fromEntries(
    paramsPart.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, Number(v)];
    }),
  ) as Record<string, number>;

  const memory = params.m;
  const passes = params.t;
  const parallelism = params.p;
  if (
    !memory ||
    !passes ||
    !parallelism ||
    !Number.isInteger(memory) ||
    !Number.isInteger(passes) ||
    !Number.isInteger(parallelism)
  ) {
    return false;
  }

  const salt = Buffer.from(saltB64, "base64");
  const expectedHash = Buffer.from(hashB64, "base64");
  if (salt.length === 0 || expectedHash.length === 0) {
    return false;
  }

  const computedHash = await argon2Async("argon2id", {
    message: password,
    nonce: salt,
    memory,
    passes,
    parallelism,
    tagLength: expectedHash.length,
  });

  if (computedHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(computedHash, expectedHash);
}
