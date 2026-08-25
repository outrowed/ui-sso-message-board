import { eq, like, or } from "drizzle-orm";
import type { User, UserUpdate } from "../../domain/user.js";
import type { UserRepository } from "../../repositories/users.js";
import { db } from "./client.js";
import { users } from "./schema.js";

export class SQLiteUserRepository implements UserRepository {
  async create(username: string, fullname: string): Promise<User> {
    const [user] = await db.insert(users).values({ username, fullname }).returning();
    return user as User;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return (user as User | undefined) ?? null;
  }

  async search(query: string, limit = 50): Promise<User[]> {
    if (!query) return await db.select().from(users).limit(limit) as User[];

    const pattern = `%${query}%`;
    return await db.select().from(users).where(or(
      like(users.username, pattern),
      like(users.fullname, pattern),
      like(users.interests, pattern),
    )).limit(limit) as User[];
  }

  async update(username: string, values: UserUpdate): Promise<User | null> {
    const [user] = await db.update(users).set(values).where(eq(users.username, username)).returning();
    return (user as User | undefined) ?? null;
  }
}
