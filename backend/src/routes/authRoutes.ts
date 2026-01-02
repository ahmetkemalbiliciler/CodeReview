import { Router } from "express";
import { signUp, login, getMe, forgotPassword, resetPassword, refreshToken } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/signup - Register new user
router.post("/signup", signUp);

// POST /api/auth/login - Login and get token
router.post("/login", login);

// GET /api/auth/me - Get current user (requires token)
router.get("/me", getMe);

// POST /api/auth/forgot-password - Request password reset email
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post("/reset-password", resetPassword);

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", refreshToken);

export default router;

