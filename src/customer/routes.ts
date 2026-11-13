import { Router } from "express";
import * as handlers from "./handlers";
import * as schemas from "./schema";
import { validate } from "../middleware/validate";

export const customersRouter = Router();

customersRouter.post(
  "/",
  validate(schemas.createCustomerSchema),
  handlers.createCustomer,
);

customersRouter.get(
  "/",
  validate(schemas.listCustomers),
  handlers.listCustomers,
);

customersRouter.get(
  "/:id",
  validate(schemas.getCustomer),
  handlers.getCustomerById,
);

customersRouter.patch(
  "/:id",
  validate(schemas.updateCustomer),
  handlers.updateCustomer,
);

customersRouter.delete(
  "/:id",
  validate(schemas.deleteCustomer),
  handlers.deleteCustomer,
);
