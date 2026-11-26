import { Request, Response } from "express";
import { ValidatedRequest } from "../middleware/validate";
import * as schemas from "./schema";
import * as users from "./repository";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../utils/password";
import { TooManyRequestsError, UnauthorizedError } from "../utils/error";
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from "../utils/jwt";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function signUp(
  req: ValidatedRequest<typeof schemas.rawSignUpSchema>,
  res: Response,
) {
  const hashedPayload = await hashPassword({
    email: req.body.email,
    password: req.body.password,
  });

  const user = await users.create(hashedPayload);
  const accessToken = await signAccessToken(user.id);

  res.status(201).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user,
  });
}

export async function login(
  req: ValidatedRequest<typeof schemas.rawSignUpSchema>,
  res: Response,
) {
  const user = await users.findByEmail(req.body.email);

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw new TooManyRequestsError(
      "Too many failed attempts. Try again later.",
    );
  }

  const valid = await verifyPassword(
    req.body.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !valid) {
    if (user) {
      await users.recordFailedLogin(
        user.id,
        MAX_LOGIN_ATTEMPTS,
        LOCKOUT_MINUTES,
      );
    }
    throw new UnauthorizedError("Invalid email or password");
  }

  await users.resetFailedLogins(user.id);

  const accessToken = await signAccessToken(user.id);

  res.status(200).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  });
}

export async function logout(req: Request, res: Response) {
  if (!req.auth) {
    throw new UnauthorizedError("Missing bearer token");
  }

  await users.revokeToken(req.auth.tokenId, req.auth.expiresAt);
  res.status(204).send();
}

export async function listUsers(
  req: ValidatedRequest<typeof schemas.listUsers>,
  res: Response,
) {
  const allUsers = await users.list(req.query);

  res.status(200).json({
    data: allUsers,
    limit: req.query.limit,
    offset: req.query.offset,
  });
}
