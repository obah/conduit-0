import { Response, Request } from "express";
import * as customers from "./repository";
import * as schemas from "./schema";
import { ValidatedRequest } from "../middleware/validate";
import { NotFoundError } from "../utils/error";

// in-file validation
// export async function createCustomer(req: Request, res: Response) {
//   const parsed = createCustomerSchema.body.safeParse(req.body);

//   if (!parsed.success) {
//     res.status(400).json({
//       error: parsed.error.flatten().fieldErrors,
//     });

//     return;
//   }

//   const customer = await customers.create(parsed.data);
//   res.status(201).json(customer);
// }

// middleware validation
export async function createCustomer(
  req: ValidatedRequest<typeof schemas.createCustomerSchema>,
  res: Response,
) {
  const customer = await customers.create(req.body);
  res.status(201).json(customer);
}

export async function listCustomers(
  req: ValidatedRequest<typeof schemas.listCustomers>,
  res: Response,
) {
  const allCustomers = await customers.list(req.query);

  res.status(200).json({
    data: allCustomers,
    limit: req.query.limit,
    offset: req.query.offset,
  });
}

export async function getCustomerById(
  req: ValidatedRequest<typeof schemas.getCustomer>,
  res: Response,
) {
  const customer = await customers.findById(req.params.id);

  if (!customer) throw new NotFoundError("customer not found");

  res.json(customer);
}

export async function updateCustomer(
  req: ValidatedRequest<typeof schemas.updateCustomer>,
  res: Response,
) {
  const customer = await customers.update(req.params.id, req.body);

  if (!customer) throw new NotFoundError("customer not found");

  res.json(customer);
}

export async function deleteCustomer(
  req: ValidatedRequest<typeof schemas.deleteCustomer>,
  res: Response,
) {
  const customer = await customers.deleteById(req.params.id);

  if (!customer) throw new NotFoundError("customer not found");

  res.json(customer);
}
