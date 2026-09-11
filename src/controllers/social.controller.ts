import { Request, Response } from "express";
import prisma from "../config/prisma";

/**
 * Safely convert Express route params to string.
 *
 * Express may type route parameters as:
 * string | string[] | undefined
 *
 * Prisma requires plain strings.
 */
function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getUserId(req: Request): string | undefined {
  return (req as Request & { userId?: string }).userId;
}

/*
 * FOLLOW USER
 */
export async function followUser(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const target = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Already following this user",
      });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    const actor = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "FOLLOW",
        message: `${actor?.name || "Someone"} started following you`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Following",
      follow,
    });
  } catch (error) {
    console.error("followUser ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown follow error",
    });
  }
}

/*
 * UNFOLLOW USER
 */
export async function unfollowUser(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return res.json({
      success: true,
      message: "Unfollowed",
    });
  } catch (error) {
    console.error("unfollowUser:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user",
    });
  }
}

/*
 * GET FOLLOW STATUS
 */
export async function getFollowStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const [following, followedBy] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      }),

      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: userId,
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      following: Boolean(following),
      followedBy: Boolean(followedBy),
    });
  } catch (error) {
    console.error("getFollowStatus:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get follow status",
    });
  }
}

/*
 * GET FOLLOWERS
 */
export async function getFollowers(req: Request, res: Response) {
  try {
    const targetUserId = getParam(req.params.userId);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const followers = await prisma.follow.findMany({
      where: {
        followingId: targetUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
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
      followers,
    });
  } catch (error) {
    console.error("getFollowers:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load followers",
    });
  }
}

/*
 * GET FOLLOWING
 */
export async function getFollowing(req: Request, res: Response) {
  try {
    const targetUserId = getParam(req.params.userId);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: targetUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
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
      following,
    });
  } catch (error) {
    console.error("getFollowing:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load following",
    });
  }
}

/*
 * SEND FRIEND REQUEST
 */
export async function sendFriendRequest(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const target = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [existingFriend, existingRequest] = await Promise.all([
      prisma.friendship.findFirst({
        where: {
          OR: [
            {
              userAId: userId,
              userBId: targetUserId,
            },
            {
              userAId: targetUserId,
              userBId: userId,
            },
          ],
        },
      }),

      prisma.friendRequest.findFirst({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: targetUserId,
              status: "PENDING",
            },
            {
              senderId: targetUserId,
              receiverId: userId,
              status: "PENDING",
            },
          ],
        },
      }),
    ]);

    if (existingFriend) {
      return res.status(409).json({
        success: false,
        message: "You are already friends",
      });
    }

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "A friend request is already pending",
      });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: targetUserId,
      },
    });

    const actor = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "FRIEND_REQUEST",
        message: `${actor?.name || "Someone"} sent you a friend request`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent",
      request,
    });
  } catch (error) {
    console.error("sendFriendRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send friend request",
    });
  }
}

/*
 * ACCEPT FRIEND REQUEST
 */
export async function acceptFriendRequest(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const requestId = getParam(req.params.requestId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    const request = await prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot accept this request",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Friend request is no longer pending",
      });
    }

    const userAId =
      request.senderId < request.receiverId
        ? request.senderId
        : request.receiverId;

    const userBId =
      request.senderId < request.receiverId
        ? request.receiverId
        : request.senderId;

    const friendship = await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return tx.friendship.upsert({
        where: {
          userAId_userBId: {
            userAId,
            userBId,
          },
        },
        create: {
          userAId,
          userBId,
        },
        update: {},
      });
    });

    const actor = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: "FRIEND_REQUEST",
        message: `${actor?.name || "Someone"} accepted your friend request`,
      },
    });

    return res.json({
      success: true,
      message: "Friend request accepted",
      friendship,
    });
  } catch (error) {
    console.error("acceptFriendRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept friend request",
    });
  }
}

/*
 * REJECT FRIEND REQUEST
 */
export async function rejectFriendRequest(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const requestId = getParam(req.params.requestId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    const request = await prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot reject this request",
      });
    }

    await prisma.friendRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "REJECTED",
      },
    });

    return res.json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("rejectFriendRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject friend request",
    });
  }
}

/*
 * GET FRIEND STATUS
 */
export async function getFriendStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userAId: userId,
            userBId: targetUserId,
          },
          {
            userAId: targetUserId,
            userBId: userId,
          },
        ],
      },
    });

    const pendingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: targetUserId,
            status: "PENDING",
          },
          {
            senderId: targetUserId,
            receiverId: userId,
            status: "PENDING",
          },
        ],
      },
    });

    let requestDirection: "SENT" | "RECEIVED" | null = null;

    if (pendingRequest) {
      requestDirection =
        pendingRequest.senderId === userId ? "SENT" : "RECEIVED";
    }

    return res.json({
      success: true,
      friends: Boolean(friendship),
      requestDirection,
      requestId: pendingRequest?.id || null,
    });
  } catch (error) {
    console.error("getFriendStatus:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get friend status",
    });
  }
}

/*
 * REMOVE FRIEND
 */
export async function removeFriend(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const targetUserId = getParam(req.params.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            userAId: userId,
            userBId: targetUserId,
          },
          {
            userAId: targetUserId,
            userBId: userId,
          },
        ],
      },
    });

    return res.json({
      success: true,
      message: "Friend removed",
    });
  } catch (error) {
    console.error("removeFriend:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove friend",
    });
  }
}