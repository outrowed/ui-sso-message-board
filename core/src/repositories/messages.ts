import type { Message, MessageWithAuthor } from "../domain/message.js";

export interface MessageRepository {
  create(authorUsername: string, content: string): Promise<Message>;
  list(limit?: number): Promise<MessageWithAuthor[]>;
}
