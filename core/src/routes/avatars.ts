import { Router } from "express";
import { avatarPath } from "../avatars.js";

const router = Router();

router.get("/:username", (req, res) => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  res.sendFile(avatarPath(username), (error) => {
    if (error && !res.headersSent) res.status(404).json({ error: "Avatar not found" });
  });
});

export default router;
