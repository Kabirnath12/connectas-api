import { Router } from "express";

import {
  createCollaboration,
  getCollaborations,
  getCollaborationStatus,
  acceptCollaboration,
  rejectCollaboration,
} from "../controllers/collaboration.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  createCollaboration
);

router.get(
  "/",
  authenticate,
  getCollaborations
);

router.get(
  "/status/:userId",
  authenticate,
  getCollaborationStatus
);

router.put(
  "/:id/accept",
  authenticate,
  acceptCollaboration
);

router.put(
  "/:id/reject",
  authenticate,
  rejectCollaboration
);

export default router;