import { Request, Response } from "express";
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

/**
 * Create a new post
 */
export async function createPost(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const {
      title,
      caption,
      mediaUrl,
      category,
      location,
      type,
    } = req.body;

    if (!title && !caption && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Add some content before publishing",
      });
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.userId!,
        title: title || null,
        caption: caption || null,
        mediaUrl: mediaUrl || null,
        category: category || null,
        location: location || null,
        type: type || "PORTFOLIO",
      },

      include: {
        author: {
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

        likes: true,
        comments: true,

        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
}

/**
 * Get feed posts
 */
export async function getFeed(
  req: Request,
  res: Response
) {
  try {
    const posts = await prisma.post.findMany({
      take: 50,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        author: {
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

        likes: {
          select: {
            id: true,
            userId: true,
            postId: true,
          },
        },

        comments: {
          orderBy: {
            createdAt: "asc",
          },

          take: 5,
        },

        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load feed",
    });
  }
}

/**
 * Like or unlike a post
 */
export async function toggleLike(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const postId = String(req.params.postId);
    const userId = req.userId!;

    // Check whether the post exists
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check whether this user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // Unlike
    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      const updatedCount = await prisma.like.count({
        where: {
          postId,
        },
      });

      return res.status(200).json({
        success: true,
        liked: false,
        likesCount: updatedCount,
      });
    }

    // Like
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    const updatedCount = await prisma.like.count({
      where: {
        postId,
      },
    });

    return res.status(200).json({
      success: true,
      liked: true,
      likesCount: updatedCount,
    });
  } catch (error) {
    console.error("Toggle like error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update like",
    });
  }
}

/**
 * Add comment to a post
 */
export async function addComment(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!requireAuth(req, res)) return;

    const text =
      typeof req.body.text === "string"
        ? req.body.text.trim()
        : "";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment required",
      });
    }

    const postId = String(req.params.postId);

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.userId!,
        postId,
        text,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
}