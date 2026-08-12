import express from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/logout", logout);

router.get("/me", protect, getMe);

router.post("/register", authLimiter, register);

router.post("/login", authLimiter, login);

export default router;
