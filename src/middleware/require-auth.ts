import type { RequestHandler, Response } from "express";
import { UnauthorizedError } from "../utils/error";
import {
  type AccessTokenClaims,
  isInvalidTokenError,
  verifyAccessToken,
} from "../utils/jwt";
import * as users from "../user/repository";

export const authenticateToken: RequestHandler = async (req, res, next) => {
  const token = req.get("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) {
    throw unauthorized(res, "Missing or malformed bearer token");
  }

  let claims: AccessTokenClaims;
  try {
    claims = await verifyAccessToken(token);
  } catch (err) {
    if (isInvalidTokenError(err)) {
      throw unauthorized(res, "Invalid or expired access token", err);
    }
    throw err;
  }

  if (await users.isTokenRevoked(claims.tokenId)) {
    throw unauthorized(res, "Token has been revoked");
  }

  req.auth = claims;
  next();
};

function unauthorized(res: Response, message: string, cause?: unknown) {
  res.set("WWW-Authenticate", "Bearer");
  return new UnauthorizedError(message, { cause });
}
