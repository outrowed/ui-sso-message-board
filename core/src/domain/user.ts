export interface User {
  username: string;
  fullname: string;
  interests: string | null;
  likes: string | null;
  dislikes: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  updatedAt: string | null;
}

export type UserUpdate = Pick<User,
  "fullname" | "interests" | "likes" | "dislikes" | "instagram" | "twitter" | "youtube"
>;
