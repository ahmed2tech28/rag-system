import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDatabase(): Promise<void> {
  const schema = await readFile(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
}
