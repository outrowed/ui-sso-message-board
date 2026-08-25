import { desc, eq } from "drizzle-orm";
import type { Message, MessageWithAuthor } from "../../domain/message.js";
import type { MessageRepository } from "../../repositories/messages.js";
import { db } from "./client.js";
import { messages, users } from "./schema.js";

export class SQLiteMessageRepository implements MessageRepository {
  async create(authorUsername: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ authorUsername, content }).returning();
    return message as Message;
  }

  async list(limit = 100): Promise<MessageWithAuthor[]> {
    return await db.select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      authorUsername: messages.authorUsername,
      authorFullname: users.fullname,
    }).from(messages)
      .innerJoin(users, eq(messages.authorUsername, users.username))
      .orderBy(desc(messages.id))
      .limit(limit) as MessageWithAuthor[];
  }
}
