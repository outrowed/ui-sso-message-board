import { Router, Request, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { repositories } from "../repositories/index.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  res.json({ messages: await repositories.messages.list() });
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
