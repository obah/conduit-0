import { Router } from "express";
import { validate } from "../middleware/validate";
import * as handlers from "./handlers";
import * as schemas from "./schema";

export const accountsRouter = Router();

accountsRouter.post(
  "/:id",
  validate(schemas.createAccountSchema),
  handlers.createAccount,
);

accountsRouter.get("/", validate(schemas.listAccounts), handlers.lisAccounts);

accountsRouter.get(
  "/:id",
  validate(schemas.getAccount),
  handlers.getAccountById,
);

accountsRouter.patch(
  "/:id",
  validate(schemas.updateAccount),
  handlers.updateAccount,
);

accountsRouter.post(
  "/:id/close",
  validate(schemas.updateStatus),
  handlers.closeAccount,
);

accountsRouter.post(
  "/:id/freeze",
  validate(schemas.updateStatus),
  handlers.freezeAccount,
);
