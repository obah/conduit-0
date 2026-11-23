import { z } from "zod";
import { pagination, idParams } from "../utils/schemas";

export const createAccountSchema = {
  params: idParams, // ? this id here is customerId, hope it wont be confusing?
  // or is there a better way to handle/name it?
  body: z.strictObject({ currency: z.currencyCode() }),
};

export const listAccounts = {
  query: pagination,
};

export const getAccount = {
  params: idParams,
};

export const updateStatus = {
  params: idParams,
};

export const updateAccount = {
  params: idParams,
  body: z
    .strictObject({
      currency: z.currencyCode(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update",
    ),
};

export type CreateAccountInput = z.infer<typeof createAccountSchema.body>;
export type ListAccountQuery = z.infer<typeof listAccounts.query>;
export type UpdateAccountInput = z.infer<typeof updateAccount.body>;
