import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.get(
  "/unread-count",
  authenticate,
  getUnreadNotificationCount
);

router.get(
  "/",
  authenticate,
  getNotifications
);

router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsRead
);

router.delete(
  "/read",
  authenticate,
  deleteReadNotifications
);

router.patch(
  "/:notificationId/read",
  authenticate,
  markNotificationAsRead
);

router.delete(
  "/:notificationId",
  authenticate,
  deleteNotification
);

export default router;