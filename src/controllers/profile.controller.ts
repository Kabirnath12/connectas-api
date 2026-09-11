import { Request, Response } from "express";
import { Capability } from "@prisma/client";
import prisma from "../config/prisma";

const EXPERIENCE_LEVELS = [
  "BEGINNER",
  "ENTRY_LEVEL",
  "MID_LEVEL",
  "SENIOR",
  "EXPERT",
] as const;

const WORK_PREFERENCES = [
  "REMOTE",
  "HYBRID",
  "ONSITE",
  "FLEXIBLE",
] as const;

function getUserId(req: Request) {
  return (req as Request & { userId?: string }).userId;
}

function formatProfile(profile: any) {
  return {
    ...profile,

    capabilities:
      profile.capabilities?.map((item: any) => ({
        id: item.id,
        capability: item.capability,
      })) || [],

    skills: profile.skills || [],

    socialLinks: profile.socialLinks || [],
  };
}

/**
 * GET /api/profile/me
 */
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await prisma.profile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        capabilities: true,
        skills: true,
        socialLinks: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.json({
      success: true,
      profile: formatProfile(profile),
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * PUT /api/profile/me
 */
export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      username,
      bio,
      location,
      avatarUrl,
      website,
      availability,
      professionalTitle,
      professionalHeadline,
      professionalBio,
      experienceLevel,
      workPreference,
      isAvailableForWork,
      expectedSalary,
      hourlyRate,
      resumeUrl,
      portfolioUrl,
      capabilities,
      skills,
      socialLinks,
    } = req.body;

    if (
      experienceLevel !== undefined &&
      experienceLevel !== null &&
      !EXPERIENCE_LEVELS.includes(experienceLevel)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience level",
      });
    }

    if (
      workPreference !== undefined &&
      workPreference !== null &&
      !WORK_PREFERENCES.includes(workPreference)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid work preference",
      });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (
      username !== undefined &&
      String(username).trim() !== existingProfile.username
    ) {
      const usernameTaken = await prisma.profile.findFirst({
        where: {
          username: String(username).trim(),
          NOT: {
            userId,
          },
        },
      });

      if (usernameTaken) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: {
          userId,
        },
        data: {
          ...(username !== undefined && {
            username: String(username).trim(),
          }),

          ...(bio !== undefined && {
            bio,
          }),

          ...(location !== undefined && {
            location,
          }),

          ...(avatarUrl !== undefined && {
            avatarUrl,
          }),

          ...(website !== undefined && {
            website,
          }),

          ...(availability !== undefined && {
            availability,
          }),

          ...(professionalTitle !== undefined && {
            professionalTitle,
          }),

          ...(professionalHeadline !== undefined && {
            professionalHeadline,
          }),

          ...(professionalBio !== undefined && {
            professionalBio,
          }),

          ...(experienceLevel !== undefined && {
            experienceLevel,
          }),

          ...(workPreference !== undefined && {
            workPreference,
          }),

          ...(isAvailableForWork !== undefined && {
            isAvailableForWork: Boolean(isAvailableForWork),
          }),

          ...(expectedSalary !== undefined && {
            expectedSalary,
          }),

          ...(hourlyRate !== undefined && {
            hourlyRate:
              hourlyRate === null || hourlyRate === ""
                ? null
                : Number(hourlyRate),
          }),

          ...(resumeUrl !== undefined && {
            resumeUrl,
          }),

          ...(portfolioUrl !== undefined && {
            portfolioUrl,
          }),
        },
      });

      /*
       * Update capabilities
       */
      if (Array.isArray(capabilities)) {
        await tx.profileCapability.deleteMany({
          where: {
            profileId: profile.id,
          },
        });

        const validCapabilities = capabilities
          .filter(
            (item): item is string => typeof item === "string"
          )
          .map((item) =>
            item
              .trim()
              .toUpperCase()
              .replace(/[\s-]+/g, "_")
          )
          .filter(
            (item): item is Capability =>
              Object.values(Capability).includes(
                item as Capability
              )
          );

        for (const capability of validCapabilities) {
          await tx.profileCapability.create({
            data: {
              profileId: profile.id,
              capability,
            },
          });
        }
      }

      /*
       * Update skills
       */
      if (Array.isArray(skills)) {
        await tx.profileSkill.deleteMany({
          where: {
            profileId: profile.id,
          },
        });

        const validSkills = skills
          .filter(
            (item): item is string => typeof item === "string"
          )
          .map((item) => item.trim())
          .filter(Boolean);

        for (const skill of validSkills) {
          await tx.profileSkill.create({
            data: {
              profileId: profile.id,
              skill,
            },
          });
        }
      }

      /*
       * Update social links
       */
      if (Array.isArray(socialLinks)) {
        await tx.socialLink.deleteMany({
          where: {
            profileId: profile.id,
          },
        });

        for (const link of socialLinks) {
          if (
            link &&
            typeof link.platform === "string" &&
            typeof link.url === "string" &&
            link.platform.trim() &&
            link.url.trim()
          ) {
            await tx.socialLink.create({
              data: {
                profileId: profile.id,
                platform: link.platform.trim(),
                url: link.url.trim(),
              },
            });
          }
        }
      }

      return tx.profile.findUnique({
        where: {
          id: profile.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          capabilities: true,
          skills: true,
          socialLinks: true,
        },
      });
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: formatProfile(updatedProfile),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/profile/:username
 *
 * Public profile lookup by username
 */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const username = String(req.params.username);

    const profile = await prisma.profile.findUnique({
      where: {
        username,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            createdAt: true,

            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },

            posts: {
              orderBy: {
                createdAt: "desc",
              },

              select: {
                id: true,
                type: true,
                title: true,
                caption: true,
                mediaUrl: true,
                category: true,
                location: true,
                createdAt: true,

                _count: {
                  select: {
                    likes: true,
                    comments: true,
                  },
                },
              },
            },
          },
        },

        capabilities: true,
        skills: true,
        socialLinks: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.json({
      success: true,
      profile: formatProfile(profile),
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}