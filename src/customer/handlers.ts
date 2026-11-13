import { Response } from "express";
import * as customers from "./repository";
import * as schemas from "./schema";
import { ValidatedRequest } from "../middleware/validate";

//createCustomer
//getCustomerById
//listCustomers
//updateCustomer
//deleteCustomer

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
