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
