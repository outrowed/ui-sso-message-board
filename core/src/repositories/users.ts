import type { User, UserUpdate } from "../domain/user.js";

export interface UserRepository {
  create(username: string, fullname: string): Promise<User>;
  findByUsername(username: string): Promise<User | null>;
  search(query: string, limit?: number): Promise<User[]>;
  update(username: string, values: UserUpdate): Promise<User | null>;
}
