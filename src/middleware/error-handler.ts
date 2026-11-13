import type { ErrorRequestHandler } from "express";
import { DatabaseError } from "pg";
import { z } from "zod";
import { AppError, BadRequestError, ConflictError } from "../utils/error";

const PG_UNIQUE_VIOLATION = "23505";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const appError = toAppError(err);

  res.err = err;

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: req.id,
    },
  });
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof z.ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return new BadRequestError("Request validation failed", details);
  }

  if (err instanceof DatabaseError && err.code === PG_UNIQUE_VIOLATION) {
    return new ConflictError("A record with these details already exists");
  }

  if (isExposableHttpError(err)) {
    return new AppError(err.status, "INVALID_BODY", err.message);
  }

  return new AppError(500, "INTERNAL_ERROR", "Something went wrong");
}

function isExposableHttpError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    (err as { expose?: unknown }).expose === true &&
    typeof (err as { status?: unknown }).status === "number"
  );
}
