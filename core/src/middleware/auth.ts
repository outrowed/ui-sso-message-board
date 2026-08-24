import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "sso-ui-react-jwt-secret-key-change-me";

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    fullname: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing session token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; fullname: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid session token" });
  }
}
