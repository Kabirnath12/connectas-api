import { Router } from "express";
import {
  getConversations,
  getUnreadCount,
  getMessages,
  markConversationRead,
  sendMessage,
} from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Conversations
router.get(
  "/conversations",
  authenticate,
  getConversations
);

// Unread message count
router.get(
  "/unread-count",
  authenticate,
  getUnreadCount
);

// Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  authenticate,
  markConversationRead
);

// Messages
router.get(
  "/conversations/:conversationId/messages",
  authenticate,
  getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authenticate,
  sendMessage
);

export default router;