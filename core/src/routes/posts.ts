import { Router, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { posts, profiles } from "../db/schema.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const results = await db.select({
    id: posts.id,
    content: posts.content,
    createdAt: posts.createdAt,
    authorUsername: posts.authorUsername,
    authorFullname: profiles.fullname,
  }).from(posts)
    .innerJoin(profiles, eq(posts.authorUsername, profiles.username))
    .orderBy(desc(posts.id))
    .limit(100);

  res.json({ posts: results });
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length > 1000) {
    return res.status(400).json({ error: "Post content must be between 1 and 1000 characters." });
  }

  const [post] = await db.insert(posts).values({
    authorUsername: req.user!.username,
    content,
  }).returning();

  res.status(201).json({ post });
});

export default router;
