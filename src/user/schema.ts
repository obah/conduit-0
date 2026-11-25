import { z } from "zod";
import { pagination } from "../utils/schemas";

export const rawSignUpSchema = {
  body: z.strictObject({
    email: z.email(),
    password: z.string().min(8),
  }),
};

export const hashedSignUpSchema = {
  body: z.strictObject({
    email: z.email(),
    passwordHash: z.string(),
  }),
};

export const listUsers = {
  query: pagination,
};

export type RawSignUpInput = z.infer<typeof rawSignUpSchema.body>;
export type HashedSignUpInput = z.infer<typeof hashedSignUpSchema.body>;
export type ListUsersQuery = z.infer<typeof listUsers.query>;
