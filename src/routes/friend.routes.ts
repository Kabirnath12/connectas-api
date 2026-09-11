import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getSentFriendRequests,
  getFriends,
  getFollowers,
  getFollowing,
  getFriendStatus,
} from "../controllers/friend.controller";

const router = Router();

router.post(
  "/request/:userId",
  authenticate,
  sendFriendRequest
);

router.post(
  "/request/:requestId/accept",
  authenticate,
  acceptFriendRequest
);

router.post(
  "/request/:requestId/reject",
  authenticate,
  rejectFriendRequest
);

router.post(
  "/request/:requestId/cancel",
  authenticate,
  cancelFriendRequest
);

router.get(
  "/requests",
  authenticate,
  getFriendRequests
);

router.get(
  "/sent",
  authenticate,
  getSentFriendRequests
);

router.get(
  "/list",
  authenticate,
  getFriends
);

router.get(
  "/followers",
  authenticate,
  getFollowers
);

router.get(
  "/following",
  authenticate,
  getFollowing
);

router.get(
  "/status/:userId",
  authenticate,
  getFriendStatus
);

export default router;