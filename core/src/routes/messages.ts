import { Router, Request, Response } from "express";
import { publicProfile } from "../profiles.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { repositories } from "../repositories/index.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const messages = await repositories.messages.list();
  const authors = new Map<string, Awaited<ReturnType<typeof publicProfile>>>();
  try {
    await Promise.all(messages.map(async (message) => {
      if (!authors.has(message.authorUsername)) {
        const user = await repositories.users.findByUsername(message.authorUsername);
        if (user) authors.set(message.authorUsername, await publicProfile(user));
      }
    }));
    res.json({ messages: messages.map((message) => {
      const author = authors.get(message.authorUsername);
      return { ...message, authorFullname: author?.fullname || message.authorFullname, authorAvatarUrl: author?.avatarUrl || null };
    }) });
  } catch (error) {
    console.error("PMB profile lookup error:", error);
    res.status(502).json({ error: "Failed to load message authors from pmb.cs.ui.ac.id" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length > 1000) {
    return res.status(400).json({ error: "Message content must be between 1 and 1000 characters." });
  }

  const message = await repositories.messages.create(req.user!.username, content);

  res.status(201).json({ message });
});

export default router;
