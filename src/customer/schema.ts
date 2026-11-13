import { z } from "zod";
import { pagination, idParams } from "../utils/schemas";

export const createCustomerSchema = {
  body: z.strictObject({ name: z.string().min(1).max(30), email: z.email() }),
};

export const listCustomers = {
  query: pagination,
};

export const getCustomer = {
  params: idParams,
};

export const updateCustomer = {
  params: idParams,
  body: z
    .strictObject({
      name: z.string().min(1).max(30).optional(),
      email: z.email().optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update",
    ),
};

export const deleteCustomer = {
  params: idParams,
};

export type CreateCustomerInput = z.infer<typeof createCustomerSchema.body>;
export type ListCustomersQuery = z.infer<typeof listCustomers.query>;
// export type GetCustomer = z.infer<typeof getCustomer.params>;
export type UpdateCustomerInput = z.infer<typeof updateCustomer.body>;
// export type DeleteCustomer = z.infer<typeof deleteCustomer.params>;
