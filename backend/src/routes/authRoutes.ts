import { Router } from "express";
import { signUp, login, getMe } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/signup - Register new user
router.post("/signup", signUp);

// POST /api/auth/login - Login and get token
router.post("/login", login);

// GET /api/auth/me - Get current user (requires token)
router.get("/me", getMe);

export default router;
