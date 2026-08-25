import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import * as schema from "./schema.js";

const dataDirectory = resolve(import.meta.dirname, "../../../../db");
mkdirSync(dataDirectory, { recursive: true });

const sqlite = new DatabaseSync(process.env.SQLITE_PATH || resolve(dataDirectory, "profiles.sqlite"));
const hasLegacyPosts = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'posts'").get();
const hasMessages = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'messages'").get();
if (hasLegacyPosts && !hasMessages) sqlite.exec("ALTER TABLE posts RENAME TO messages");

sqlite.exec("PRAGMA foreign_keys = ON");

export const db = drizzle({ client: sqlite, schema } as any);
migrate(db, { migrationsFolder: resolve(import.meta.dirname, "../../../drizzle") });
