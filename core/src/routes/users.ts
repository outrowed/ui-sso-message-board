import { Router, Request, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import type { UserUpdate } from "../domain/user.js";
import { repositories } from "../repositories/index.js";

const router = Router();

// GET /api/users - Public user search
router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  res.json({ users: await repositories.users.search(q) });
});

// GET /api/users/:username - Public user profile
router.get("/:username", async (req: Request, res: Response) => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const profile = await repositories.users.findByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  res.json({ user: profile });
});

// PUT /api/users/me - Update own profile
router.put("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const username = req.user!.username;
  const values: UserUpdate = req.body;

  try {
    const updated = await repositories.users.update(username, values);
    res.json({ user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
