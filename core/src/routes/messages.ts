import { Router, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { messages, profiles } from "../db/schema.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const results = await db.select({
    id: messages.id,
    content: messages.content,
    createdAt: messages.createdAt,
    authorUsername: messages.authorUsername,
    authorFullname: profiles.fullname,
  }).from(messages)
    .innerJoin(profiles, eq(messages.authorUsername, profiles.username))
    .orderBy(desc(messages.id))
    .limit(100);

  res.json({ messages: results });
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length > 1000) {
    return res.status(400).json({ error: "Message content must be between 1 and 1000 characters." });
  }

  const [message] = await db.insert(messages).values({
    authorUsername: req.user!.username,
    content,
  }).returning();

  res.status(201).json({ message });
});

export default router;
