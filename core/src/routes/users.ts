import { Router, Request, Response } from "express";
import multer from "multer";
import { avatarUrl, saveAvatar } from "../avatars.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import type { UserUpdate } from "../domain/user.js";
import { repositories } from "../repositories/index.js";

const router = Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

function withAvatar<T extends { username: string }>(user: T) {
  return { ...user, avatarUrl: avatarUrl(user.username) };
}

// GET /api/users - Public user search
router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const users = await repositories.users.search(q);
  res.json({ users: users.map(withAvatar) });
});

// GET /api/users/:username - Public user profile
router.get("/:username", async (req: Request, res: Response) => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const profile = await repositories.users.findByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  res.json({ user: withAvatar(profile) });
});

// PUT /api/users/me - Update own profile
router.put("/me", requireAuth, avatarUpload.single("avatar"), async (req: AuthenticatedRequest, res: Response) => {
  const username = req.user!.username;
  const values: UserUpdate = JSON.parse(req.body.profile || "{}");

  try {
    if (req.file) await saveAvatar(username, req.file.buffer);
    const updated = await repositories.users.update(username, values);
    res.json({ user: updated ? withAvatar(updated) : null });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
