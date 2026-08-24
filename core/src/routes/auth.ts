import { Router, Request, Response } from "express";
import { XMLParser } from "fast-xml-parser";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { JWT_SECRET, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const xmlParser = new XMLParser();

const CAS_SERVER = process.env.CAS_SERVER || "https://sso.ui.ac.id/cas2";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
const SERVICE_URL = `${SERVER_URL}/api/auth/cas/callback`;

// GET /api/auth/login — redirect to CAS
router.get("/login", (_req: Request, res: Response) => {
  const loginUrl = `${CAS_SERVER}/login?service=${encodeURIComponent(SERVICE_URL)}`;
  res.redirect(loginUrl);
});

// GET /api/auth/cas/callback — CAS ticket validation, JWT issuance
router.get("/cas/callback", async (req: Request, res: Response) => {
  const ticket = req.query.ticket as string | undefined;
  if (!ticket) {
    return res.redirect(`${CLIENT_URL}?error=missing_ticket`);
  }

  try {
    const validateUrl = `${CAS_SERVER}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(SERVICE_URL)}`;
    const response = await fetch(validateUrl);
    if (!response.ok) {
      return res.redirect(`${CLIENT_URL}?error=cas_validation_failed`);
    }

    const xmlResponse = await response.text();
    const parsed = xmlParser.parse(xmlResponse);
    const serviceResponse = parsed["cas:serviceResponse"];

    if (serviceResponse["cas:authenticationFailure"]) {
      return res.redirect(`${CLIENT_URL}?error=cas_auth_failed`);
    }

    if (serviceResponse["cas:authenticationSuccess"]) {
      const successData = serviceResponse["cas:authenticationSuccess"];
      const username = successData["cas:user"] as string;
      const attributes = successData["cas:attributes"] || {};
      const fullname = (attributes["cas:nama"] || attributes["cas:cn"] || username) as string;

      // Upsert user profile into the database
      const [existing] = await db.select().from(profiles).where(eq(profiles.username, username));
      if (!existing) {
        await db.insert(profiles).values({ username, fullname });
      }

      // Issue JWT
      const token = jwt.sign({ username, fullname }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.redirect(CLIENT_URL);
    }

    return res.redirect(`${CLIENT_URL}?error=invalid_response`);
  } catch (error) {
    console.error("CAS validation error:", error);
    return res.redirect(`${CLIENT_URL}?error=server_error`);
  }
});

// GET /api/auth/me — return current user info from JWT
router.get("/me", (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; fullname: string };
    return res.json({ user: decoded });
  } catch {
    return res.json({ user: null });
  }
});

// POST /api/auth/logout — clear cookie
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

// GET /api/auth/logout/cas — clear cookie + redirect to CAS logout
router.get("/logout/cas", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  const logoutUrl = `${CAS_SERVER}/logout?url=${encodeURIComponent(CLIENT_URL)}`;
  res.redirect(logoutUrl);
});

export default router;
