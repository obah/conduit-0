import { RequestHandler } from "express";
import { NotFoundError } from "../utils/error";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.path}`));
};
