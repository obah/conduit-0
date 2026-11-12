import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  // JWT_SECRET: z.string().min(32),
  BODY_LIMIT: z.string().default("100kb"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid config:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = Object.freeze(parsed.data);
