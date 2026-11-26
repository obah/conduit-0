import { randomUUID } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { config } from "./config";

const SECRET_KEY = new TextEncoder().encode(config.JWT_SECRET);
const JWT_ISSUER = "conduit-0";
const JWT_AUDIENCE = "conduit-api";

export const ACCESS_TOKEN_TTL_SECONDS = 900;

export type AccessTokenClaims = {
  userId: string;
  tokenId: string;
  expiresAt: Date;
};

const INVALID_TOKEN_ERRORS = [
  errors.JWTExpired,
  errors.JWTClaimValidationFailed,
  errors.JWTInvalid,
  errors.JWSInvalid,
  errors.JWSSignatureVerificationFailed,
  errors.JOSEAlgNotAllowed,
  errors.JOSENotSupported,
];

export function isInvalidTokenError(err: unknown): boolean {
  return INVALID_TOKEN_ERRORS.some((type) => err instanceof type);
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(SECRET_KEY);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"],
    requiredClaims: ["sub", "jti", "exp"],
  });

  return {
    userId: String(payload.sub),
    tokenId: String(payload.jti),
    expiresAt: new Date(Number(payload.exp) * 1000),
  };
}
