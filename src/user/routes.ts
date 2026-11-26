import { Router } from "express";
import { authenticateToken } from "../middleware/require-auth";
import { validate } from "../middleware/validate";
import * as handlers from "./handlers";
import * as schemas from "./schema";

export const userRouter = Router();

userRouter.post(
  "/signup",
  validate(schemas.rawSignUpSchema),
  handlers.signUp,
);
userRouter.post("/login", validate(schemas.rawSignUpSchema), handlers.login);

userRouter.use(authenticateToken);

userRouter.post("/logout", handlers.logout);
userRouter.get("/", validate(schemas.listUsers), handlers.listUsers);
