import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { supabase } from "../utils/supabase.js";

/**
 * Middleware to verify Supabase JWT and extract user ID.
 * Expects Authorization header: "Bearer <supabase_jwt>"
 * 
 * This middleware performs CRYPTOGRAPHIC verification of the JWT
 * using Supabase's API, not just base64 decoding.
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

    // Verify JWT using Supabase API - this performs cryptographic verification
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Supabase auth error:", error.message);
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }

    if (!data.user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    // Attach user ID to request
    req.userId = data.user.id;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
}
