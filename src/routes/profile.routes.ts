import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
} from "../controllers/profile.controller";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);

// Public profile by username
router.get("/:username", getUserProfile);

export default router;