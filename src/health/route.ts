import { Request, Response } from "express";
import { pool } from "../utils/db";
import { Router } from "express";

export const healthRouter = Router();

const checkHealth = async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      database: "OK",
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime().toFixed(2)}s`,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res
      .status(503)
      .json({ status: "error", database: "unreachable", error: errorMsg });
  }
};

healthRouter.get("/", checkHealth);
