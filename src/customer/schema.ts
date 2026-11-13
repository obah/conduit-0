import { z } from "zod";

export const createCustomerSchema = {
  body: z.strictObject({ name: z.string().min(1).max(30), email: z.email() }),
};

export type CreateCustomerInput = z.infer<typeof createCustomerSchema.body>;
