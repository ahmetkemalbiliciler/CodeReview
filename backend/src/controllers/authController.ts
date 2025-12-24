import type { Request, Response } from "express";
import { supabase } from "../utils/supabase.js";
import prisma from "../utils/prisma.js";

interface SignUpBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 * POST /auth/signup
 */
export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as SignUpBody;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    // Create user in our database if sign up successful
    if (data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: { id: data.user.id },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        message: "Check your email for verification link",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, error: "Failed to sign up" });
  }
}

/**
 * Login user and return token
 * POST /auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    // Ensure user exists in our database
    if (data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: { id: data.user.id },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Failed to login" });
  }
}

/**
 * Get current user info
 * GET /auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ success: false, error: "Failed to get user info" });
  }
}
