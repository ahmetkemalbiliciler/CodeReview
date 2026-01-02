import type { Request, Response } from "express";
import { supabase, supabaseAdmin } from "../utils/supabase.js";
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

interface ForgotPasswordBody {
  email: string;
}

/**
 * Request password reset email
 * POST /auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordBody;

    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data: {
        message: "Password reset email sent. Please check your inbox.",
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, error: "Failed to send reset email" });
  }
}

interface ResetPasswordBody {
  newPassword: string;
}

/**
 * Reset password with new password (user must be authenticated via reset token)
 * POST /auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { newPassword } = req.body as ResetPasswordBody;

    if (!newPassword) {
      res.status(400).json({ success: false, error: "New password is required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    // First verify the token and get user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      res.status(500).json({ 
        success: false, 
        error: "Password reset not configured. Missing SUPABASE_SERVICE_ROLE_KEY." 
      });
      return;
    }

    // Update the password using admin client
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data: {
        message: "Password updated successfully",
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
}
interface RefreshTokenBody {
  refresh_token: string;
}

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refresh_token } = req.body as RefreshTokenBody;

    if (!refresh_token) {
      res.status(400).json({ success: false, error: "Refresh token is required" });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    if (!data.session) {
      res.status(401).json({ success: false, error: "Failed to refresh session" });
      return;
    }

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ success: false, error: "Failed to refresh token" });
  }
}
