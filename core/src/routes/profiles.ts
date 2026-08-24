import { Router, Request, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq, like, or } from "drizzle-orm";

const router = Router();

// GET /api/profiles/directory - Public directory search
router.get("/directory", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  let results;

  if (q) {
    const pattern = `%${q}%`;
    results = await db.select().from(profiles).where(
      or(
        like(profiles.username, pattern),
        like(profiles.fullname, pattern),
        like(profiles.interests, pattern)
      )
    ).limit(50);
  } else {
    results = await db.select().from(profiles).limit(50);
  }

  res.json({ profiles: results });
});

// GET /api/profiles/:username - Public single profile
router.get("/:username", async (req: Request, res: Response) => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const [profile] = await db.select().from(profiles).where(eq(profiles.username, username));
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  res.json({ profile });
});

// POST /api/profiles/me - Update own profile
router.post("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const username = req.user!.username;
  const { fullname, interests, likes, dislikes, instagram, twitter, youtube } = req.body;

  try {
    await db.update(profiles).set({
      fullname, interests, likes, dislikes, instagram, twitter, youtube,
    }).where(eq(profiles.username, username));

    const [updated] = await db.select().from(profiles).where(eq(profiles.username, username));
    res.json({ profile: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
