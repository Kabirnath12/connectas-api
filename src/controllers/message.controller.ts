import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

function requireAuth(
  req: AuthenticatedRequest,
  res: Response
): string | null {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return null;
  }

  return req.userId;
}

/**
 * GET /api/messages/conversations
 *
 * Returns all conversations for the authenticated user.
 */
export async function getConversations(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,

          select: {
            id: true,
            senderId: true,
            text: true,
            createdAt: true,
          },
        },
      },
    });

    const result = conversations.map((conversation) => ({
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,

      participants: conversation.participants
        .filter(
          (participant) => participant.userId !== userId
        )
        .map((participant) => participant.user),

      lastMessage: conversation.messages[0] || null,
    }));

    return res.json({
      success: true,
      conversations: result,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversations",
    });
  }
}

/**
 * GET /api/messages/unread-count
 *
 * Counts messages that:
 * 1. Belong to conversations the current user participates in
 * 2. Were sent after the user's lastReadAt
 * 3. Were NOT sent by the current user
 */
export async function getUnreadCount(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const participants =
      await prisma.conversationParticipant.findMany({
        where: {
          userId,
        },
        select: {
          conversationId: true,
          lastReadAt: true,
        },
      });

    if (participants.length === 0) {
      return res.json({
        success: true,
        unreadCount: 0,
      });
    }

    let unreadCount = 0;

    for (const participant of participants) {
      const count = await prisma.message.count({
        where: {
          conversationId: participant.conversationId,

          senderId: {
            not: userId,
          },

          createdAt: {
            gt: participant.lastReadAt,
          },
        },
      });

      unreadCount += count;
    }

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get unread message count",
    });
  }
}

/**
 * PATCH /api/messages/conversations/:conversationId/read
 *
 * Marks the conversation as read for the authenticated user.
 */
export async function markConversationRead(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const conversationId = String(
      req.params.conversationId
    );

    const participant =
      await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a participant in this conversation",
      });
    }

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Mark conversation read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
}

/**
 * GET /api/messages/conversations/:conversationId/messages
 *
 * Returns messages for a conversation.
 *
 * Opening the conversation also marks it as read.
 */
export async function getMessages(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const conversationId = String(
      req.params.conversationId
    );

    const participant =
      await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a participant in this conversation",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },

      orderBy: {
        createdAt: "asc",
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Opening the conversation means the user has read
    // everything currently in the conversation.
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
}

/**
 * POST /api/messages/conversations/:conversationId/messages
 *
 * Sends a message.
 */
export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const conversationId = String(
      req.params.conversationId
    );

    const text =
      typeof req.body?.text === "string"
        ? req.body.text.trim()
        : "";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    const participant =
      await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a participant in this conversation",
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        text,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const otherParticipants =
      await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: {
            not: userId,
          },
        },
      });

    if (otherParticipants.length > 0) {
      await prisma.notification.createMany({
        data: otherParticipants.map((participant) => ({
          userId: participant.userId,
          type: "MESSAGE",
          message: `${message.sender.name} sent you a message`,
        })),
      });
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
}