import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("profiles", {
  username: text("username").primaryKey(),
  fullname: text("fullname").notNull(),
  interests: text("interests"),
  likes: text("likes"),
  dislikes: text("dislikes"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  youtube: text("youtube"),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorUsername: text("author_username").notNull().references(() => users.username),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
