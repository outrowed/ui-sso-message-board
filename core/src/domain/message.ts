export interface Message {
  id: number;
  content: string;
  createdAt: string;
  authorUsername: string;
}

export interface MessageWithAuthor extends Message {
  authorFullname: string;
}
