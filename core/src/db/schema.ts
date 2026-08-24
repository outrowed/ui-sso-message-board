import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
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
