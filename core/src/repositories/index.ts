import { SQLiteMessageRepository } from "../db/sqlite/messages.js";
import { SQLiteUserRepository } from "../db/sqlite/users.js";
import type { MessageRepository } from "./messages.js";
import type { UserRepository } from "./users.js";

export interface Repositories {
  messages: MessageRepository;
  users: UserRepository;
}

export const repositories: Repositories = {
  messages: new SQLiteMessageRepository(),
  users: new SQLiteUserRepository(),
};
