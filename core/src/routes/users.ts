import { Router, Request, Response } from "express";
import multer from "multer";
import { saveAvatar } from "../avatars.js";
import { config } from "../config.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { publicProfile } from "../profiles.js";
import type { UserUpdate } from "../domain/user.js";
import { repositories } from "../repositories/index.js";

const router = Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});



// GET /api/users - Public user search
router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const users = await repositories.users.search(q);
  try {
    res.json({ users: await Promise.all(users.map(publicProfile)), profileSource: config.pmbProfilesEnabled ? "pmb.cs.ui.ac.id" : "local" });
  } catch (error) {
    console.error("PMB profile lookup error:", error);
    res.status(502).json({ error: "Failed to load profiles from pmb.cs.ui.ac.id" });
  }
});

// GET /api/users/:username - Public user profile
router.get("/:username", async (req: Request, res: Response) => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const profile = await repositories.users.findByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  try {
    res.json({ user: await publicProfile(profile) });
  } catch (error) {
    console.error("PMB profile lookup error:", error);
    res.status(502).json({ error: "Failed to load profile from pmb.cs.ui.ac.id" });
  }
});

// PUT /api/users/me - Update own profile
router.put("/me", requireAuth, avatarUpload.single("avatar"), async (req: AuthenticatedRequest, res: Response) => {
  if (config.pmbProfilesEnabled) {
    return res.status(403).json({ error: "Profiles are managed by pmb.cs.ui.ac.id when PMB profiles are enabled" });
  }
  const username = req.user!.username;
  const values: UserUpdate = JSON.parse(req.body.profile || "{}");

  try {
    if (req.file) await saveAvatar(username, req.file.buffer);
    const updated = await repositories.users.update(username, values);
    res.json({ user: updated ? await publicProfile(updated) : null });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
