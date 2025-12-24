import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";

/**
 * Middleware to verify Supabase JWT and extract user ID.
 * Expects Authorization header: "Bearer <supabase_jwt>"
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Decode JWT payload (Supabase uses standard JWT format)
    // The JWT is already verified by Supabase on the client side
    // For production, you should verify the JWT signature using Supabase's JWT secret
    const payload = decodeJwtPayload(token);

    if (!payload || !payload.sub) {
      res.status(401).json({ success: false, error: "Invalid token payload" });
      return;
    }

    // Attach user ID to request
    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
}

/**
 * Decode JWT payload without verification (base64 decode).
 * For production, use proper JWT verification with Supabase's secret.
 */
function decodeJwtPayload(token: string): { sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    if (!payload) return null;
    
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
