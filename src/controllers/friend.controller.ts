import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

function requireAuth(
  req: AuthenticatedRequest,
  res: Response
): boolean {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return false;
  }

  return true;
}

function normalizeFriendshipIds(
  userAId: string,
  userBId: string
) {
  return userAId < userBId
    ? { userAId, userBId }
    : { userAId: userBId, userBId: userAId };
}

/**
 * Send friend request
 */
export async function sendFriendRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const senderId = req.userId!;
    const receiverId = String(req.params.userId);

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userAId: senderId,
            userBId: receiverId,
          },
          {
            userAId: receiverId,
            userBId: senderId,
          },
        ],
      },
    });

    if (existingFriendship) {
      return res.status(409).json({
        success: false,
        message: "You are already friends",
      });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          {
            senderId,
            receiverId,
          },
          {
            senderId: receiverId,
            receiverId: senderId,
          },
        ],
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          existingRequest.senderId === senderId
            ? "Friend request already sent"
            : "This user has already sent you a friend request",
      });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "FRIEND_REQUEST",
        message: `${sender?.name || "Someone"} sent you a friend request`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent",
      request,
    });
  } catch (error) {
    console.error("sendFriendRequest error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send friend request",
    });
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const receiverId = req.userId!;
    const requestId = String(req.params.requestId);

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    if (request.receiverId !== receiverId) {
      return res.status(403).json({
        success: false,
        message: "You cannot accept this request",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "This request is no longer pending",
      });
    }

    const friendshipIds = normalizeFriendshipIds(
      request.senderId,
      request.receiverId
    );

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.friendRequest.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
        },
      });

      const friendship = await tx.friendship.create({
        data: friendshipIds,
      });

      return {
        updatedRequest,
        friendship,
      };
    });

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: "FRIEND_REQUEST",
        message: `${receiver?.name || "Someone"} accepted your friend request`,
      },
    });

    return res.json({
      success: true,
      message: "Friend request accepted",
      friendship: result.friendship,
    });
  } catch (error) {
    console.error("acceptFriendRequest error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept friend request",
    });
  }
}

/**
 * Reject friend request
 */
export async function rejectFriendRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const receiverId = req.userId!;
    const requestId = String(req.params.requestId);

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    if (request.receiverId !== receiverId) {
      return res.status(403).json({
        success: false,
        message: "You cannot reject this request",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "This request is no longer pending",
      });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
      },
    });

    return res.json({
      success: true,
      message: "Friend request rejected",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("rejectFriendRequest error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject friend request",
    });
  }
}

/**
 * Cancel sent friend request
 */
export async function cancelFriendRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const senderId = req.userId!;
    const requestId = String(req.params.requestId);

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    if (request.senderId !== senderId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own requests",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "This request is no longer pending",
      });
    }

    const cancelledRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: "CANCELLED",
      },
    });

    return res.json({
      success: true,
      message: "Friend request cancelled",
      request: cancelledRequest,
    });
  } catch (error) {
    console.error("cancelFriendRequest error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel friend request",
    });
  }
}

/**
 * Incoming pending requests
 */
export async function getFriendRequests(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const receiverId = req.userId!;

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            createdAt: true,
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
    });

    return res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("getFriendRequests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load friend requests",
    });
  }
}

/**
 * Sent pending requests
 */
export async function getSentFriendRequests(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const senderId = req.userId!;

    const requests = await prisma.friendRequest.findMany({
      where: {
        senderId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            createdAt: true,
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
    });

    return res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("getSentFriendRequests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load sent requests",
    });
  }
}

/**
 * Friends list
 */
export async function getFriends(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const userId = req.userId!;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const friendIds = friendships.map((friendship) =>
      friendship.userAId === userId
        ? friendship.userBId
        : friendship.userAId
    );

    const friends = await prisma.user.findMany({
      where: {
        id: {
          in: friendIds,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            username: true,
            avatarUrl: true,
            bio: true,
            location: true,
            capabilities: true,
            skills: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      friends,
      count: friends.length,
    });
  } catch (error) {
    console.error("getFriends error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load friends",
    });
  }
}

/**
 * Followers list
 */
export async function getFollowers(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const userId = req.userId!;

    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
                location: true,
              },
            },
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      followers: followers.map((item) => item.follower),
      count: followers.length,
    });
  } catch (error) {
    console.error("getFollowers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load followers",
    });
  }
}

/**
 * Following list
 */
export async function getFollowing(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const userId = req.userId!;

    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
                location: true,
              },
            },
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      following: following.map((item) => item.following),
      count: following.length,
    });
  } catch (error) {
    console.error("getFollowing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load following",
    });
  }
}

/**
 * Friend status
 */
export async function getFriendStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const currentUserId = req.userId!;
    const targetUserId = String(req.params.userId);

    if (currentUserId === targetUserId) {
      return res.json({
        success: true,
        status: "SELF",
        requestId: null,
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userAId: currentUserId,
            userBId: targetUserId,
          },
          {
            userAId: targetUserId,
            userBId: currentUserId,
          },
        ],
      },
    });

    if (friendship) {
      return res.json({
        success: true,
        status: "FRIENDS",
        requestId: null,
      });
    }

    const pendingRequest = await prisma.friendRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          {
            senderId: currentUserId,
            receiverId: targetUserId,
          },
          {
            senderId: targetUserId,
            receiverId: currentUserId,
          },
        ],
      },
    });

    if (!pendingRequest) {
      return res.json({
        success: true,
        status: "NONE",
        requestId: null,
      });
    }

    if (pendingRequest.senderId === currentUserId) {
      return res.json({
        success: true,
        status: "REQUEST_SENT",
        requestId: pendingRequest.id,
      });
    }

    return res.json({
      success: true,
      status: "REQUEST_RECEIVED",
      requestId: pendingRequest.id,
    });
  } catch (error) {
    console.error("getFriendStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load friend status",
    });
  }
}