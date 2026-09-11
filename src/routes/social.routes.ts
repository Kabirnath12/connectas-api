import { Router } from "express";

import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendStatus,
  removeFriend,
} from "../controllers/social.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/follow/:userId",
  authenticate,
  followUser
);

router.delete(
  "/follow/:userId",
  authenticate,
  unfollowUser
);

router.get(
  "/follow/:userId/status",
  authenticate,
  getFollowStatus
);

router.get(
  "/followers/:userId",
  getFollowers
);

router.get(
  "/following/:userId",
  getFollowing
);

router.post(
  "/friends/request/:userId",
  authenticate,
  sendFriendRequest
);

router.put(
  "/friends/request/:requestId/accept",
  authenticate,
  acceptFriendRequest
);

router.put(
  "/friends/request/:requestId/reject",
  authenticate,
  rejectFriendRequest
);

router.get(
  "/friends/:userId/status",
  authenticate,
  getFriendStatus
);

router.delete(
  "/friends/:userId",
  authenticate,
  removeFriend
);

export default router;