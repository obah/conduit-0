import { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

type RequestSchemas = {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
};

type Output<S, Part extends string, Fallback> =
  S extends Record<Part, z.ZodType> ? z.output<S[Part]> : Fallback;

export type ValidatedRequest<S extends RequestSchemas> = Request<
  Output<S, "params", Request["params"]>,
  unknown,
  Output<S, "body", unknown>,
  Output<S, "query", Request["query"]>
>;

export function validate(schemas: RequestSchemas): RequestHandler {
  const schema = z.object({
    params: schemas.params ?? z.strictObject({}),
    query: schemas.query ?? z.strictObject({}),
    body: schemas.body ?? z.undefined(),
  });

  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    req.params = parsed.params as Request["params"];
    req.body = parsed.body;

    Object.defineProperty(req, "query", {
      value: parsed.query,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };
}
