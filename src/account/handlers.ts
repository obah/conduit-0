import { Response } from "express";
import * as schemas from "./schema";
import * as accounts from "./repository";
import { ValidatedRequest } from "../middleware/validate";
import { ConflictError, NotFoundError } from "../utils/error";

export async function createAccount(
  req: ValidatedRequest<typeof schemas.createAccountSchema>,
  res: Response,
) {
  const account = await accounts.create(req.params.id, req.body);
  res.status(201).json(account);
}

export async function lisAccounts(
  req: ValidatedRequest<typeof schemas.listAccounts>,
  res: Response,
) {
  const allAccounts = await accounts.list(req.query);

  res.status(200).json({
    data: allAccounts,
    limit: req.query.limit,
    offset: req.query.offset,
  });
}

export async function getAccountById(
  req: ValidatedRequest<typeof schemas.getAccount>,
  res: Response,
) {
  const account = await accounts.findById(req.params.id);

  if (!account) throw new NotFoundError("account not found");

  res.json(account);
}

export async function freezeAccount(
  req: ValidatedRequest<typeof schemas.updateStatus>,
  res: Response,
) {
  const account = await accounts.freeze(req.params.id);

  if (!account) throw new NotFoundError("account not found");

  res.json(account);
}

export async function closeAccount(
  req: ValidatedRequest<typeof schemas.updateStatus>,
  res: Response,
) {
  const result = await accounts.close(req.params.id);

  if (result.kind === "not_found") throw new NotFoundError("account not found");

  if (result.kind === "already_closed")
    throw new ConflictError("account is already closed");
  res.json(result.account);
}

export async function updateAccount(
  req: ValidatedRequest<typeof schemas.updateAccount>,
  res: Response,
) {
  const account = await accounts.update(req.params.id, req.body);

  if (!account) throw new NotFoundError("account not found");

  res.json(account);
}

/**
 * 
 * const client = await pool.connect();
try {
  await client.query("BEGIN");
  const cust = await client.query(
    "SELECT id FROM customers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id]);
  if (!cust.rowCount) { await client.query("ROLLBACK"); return res.sendStatus(404); }

  const open = await client.query(
    "SELECT 1 FROM accounts WHERE customer_id = $1 AND status <> 'closed' LIMIT 1", [id]);
  if (open.rowCount) {
    await client.query("ROLLBACK");
    return res.status(409).json({ error: "customer has open accounts; close them first" });
  }

  await client.query("UPDATE customers SET deleted_at = now() WHERE id = $1", [id]);
  await client.query("COMMIT");
  res.sendStatus(204);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
 */
