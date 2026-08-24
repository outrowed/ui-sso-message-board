import { drizzle } from "drizzle-orm/node-sqlite";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import * as schema from "./schema.js";

const dataDirectory = resolve(import.meta.dirname, "../../../db");
mkdirSync(dataDirectory, { recursive: true });

const sqlite = new DatabaseSync(resolve(dataDirectory, "profiles.sqlite"));
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY,
    fullname TEXT NOT NULL,
    interests TEXT,
    likes TEXT,
    dislikes TEXT,
    instagram TEXT,
    twitter TEXT,
    youtube TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export const db = drizzle({ client: sqlite, schema } as any);
