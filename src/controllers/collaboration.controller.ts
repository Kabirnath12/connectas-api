import { Request, Response } from "express";
import prisma from "../config/prisma";

type AuthenticatedRequest = Request & {
  userId?: string;
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

/**
 * Create a collaboration request
 */
export async function createCollaboration(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { receiverId, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (userId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot collaborate with yourself",
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Collaboration message is required",
      });
    }

    const receiver = await prisma.user.findUnique({
      where: {
        id: receiverId,
      },
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingPending = await prisma.collaboration.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId,
          },
          {
            senderId: receiverId,
            receiverId: userId,
          },
        ],
        status: "PENDING",
      },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending collaboration request with this user.",
      });
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        senderId: userId,
        receiverId,
        message: String(message).trim(),
        status: "PENDING",
      },
    });

    const sender = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "COLLABORATION",
        message: `${sender?.name || "Someone"} sent you a collaboration request.`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully",
      collaboration,
    });
  } catch (error) {
    console.error("Create collaboration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create collaboration request",
    });
  }
}

/**
 * Get collaborations for logged-in user
 */
export async function getCollaborations(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const collaborations = await prisma.collaboration.findMany({
      where: {
        OR: [
          {
            senderId: userId,
          },
          {
            receiverId: userId,
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
                location: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      collaborations,
    });
  } catch (error) {
    console.error("Get collaborations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load collaborations",
    });
  }
}

/**
 * Get collaboration status between current user and another user
 */
export async function getCollaborationStatus(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const otherUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (userId === otherUserId) {
      return res.json({
        success: true,
        status: "SELF",
      });
    }

    const collaboration = await prisma.collaboration.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!collaboration) {
      return res.json({
        success: true,
        status: "NONE",
      });
    }

    return res.json({
      success: true,
      status: collaboration.status,
      collaborationId: collaboration.id,
      senderId: collaboration.senderId,
      receiverId: collaboration.receiverId,
    });
  } catch (error) {
    console.error("Get collaboration status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get collaboration status",
    });
  }
}

/**
 * Accept collaboration request
 */
export async function acceptCollaboration(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const collaborationId = getParam(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!collaborationId) {
      return res.status(400).json({
        success: false,
        message: "Collaboration ID is required",
      });
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: {
        id: collaborationId,
      },
    });

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: "Collaboration request not found",
      });
    }

    if (collaboration.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot accept this request",
      });
    }

    if (collaboration.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This collaboration request is no longer pending",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedCollaboration =
        await tx.collaboration.update({
          where: {
            id: collaborationId,
          },
          data: {
            status: "ACCEPTED",
          },
        });

      let conversation = await tx.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: collaboration.senderId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: collaboration.receiverId,
                },
              },
            },
          ],
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            participants: {
              create: [
                {
                  userId: collaboration.senderId,
                },
                {
                  userId: collaboration.receiverId,
                },
              ],
            },
          },
        });
      }

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: collaboration.receiverId,
          text: collaboration.message ?? "",
        },
      });

      await tx.notification.create({
        data: {
          userId: collaboration.senderId,
          type: "COLLABORATION",
          message: "Your collaboration request was accepted.",
        },
      });

      return {
        updatedCollaboration,
        conversationId: conversation.id,
      };
    });

    return res.json({
      success: true,
      message: "Collaboration accepted",
      collaboration: result.updatedCollaboration,
      conversationId: result.conversationId,
    });
  } catch (error) {
    console.error("Accept collaboration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept collaboration",
    });
  }
}

/**
 * Reject collaboration request
 */
export async function rejectCollaboration(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const collaborationId = getParam(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!collaborationId) {
      return res.status(400).json({
        success: false,
        message: "Collaboration ID is required",
      });
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: {
        id: collaborationId,
      },
    });

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: "Collaboration request not found",
      });
    }

    if (collaboration.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot reject this request",
      });
    }

    if (collaboration.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This collaboration request is no longer pending",
      });
    }

    const updatedCollaboration =
      await prisma.collaboration.update({
        where: {
          id: collaborationId,
        },
        data: {
          status: "REJECTED",
        },
      });

    await prisma.notification.create({
      data: {
        userId: collaboration.senderId,
        type: "COLLABORATION",
        message: "Your collaboration request was rejected.",
      },
    });

    return res.json({
      success: true,
      message: "Collaboration rejected",
      collaboration: updatedCollaboration,
    });
  } catch (error) {
    console.error("Reject collaboration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject collaboration",
    });
  }
}