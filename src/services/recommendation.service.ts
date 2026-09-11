import prisma from "../config/prisma";

type Capability =
  | "CREATOR"
  | "PHOTOGRAPHER"
  | "VIDEOGRAPHER"
  | "DESIGNER"
  | "DEVELOPER"
  | "FREELANCER"
  | "BUSINESS_OWNER"
  | "JOB_SEEKER"
  | "SERVICE_PROVIDER"
  | "SELLER";

type RecommendedPerson = {
  user: {
    id: string;
    name: string;
    profile: {
      username: string;
      bio: string | null;
      location: string | null;
      avatarUrl: string | null;
      availability: string | null;
      capabilities: {
        capability: string;
      }[];
      skills: {
        skill: string;
      }[];
    };
  };

  score: number;

  reasons: string[];

  relationship: {
    following: boolean;
    followedBy: boolean;
    friend: boolean;
  };
};

/*
|--------------------------------------------------------------------------
| COLLABORATION COMPATIBILITY
|--------------------------------------------------------------------------
|
| This defines who should be relevant to whom.
|
| Example:
|
| CREATOR
|   -> BUSINESS_OWNER
|   -> PHOTOGRAPHER
|   -> VIDEOGRAPHER
|   -> DESIGNER
|
| BUSINESS_OWNER
|   -> CREATOR
|   -> PHOTOGRAPHER
|   -> VIDEOGRAPHER
|   -> DESIGNER
|   -> DEVELOPER
|
|--------------------------------------------------------------------------
*/

const compatibility: Record<Capability, Capability[]> = {
  CREATOR: [
    "BUSINESS_OWNER",
    "PHOTOGRAPHER",
    "VIDEOGRAPHER",
    "DESIGNER",
    "FREELANCER",
    "SERVICE_PROVIDER",
  ],

  PHOTOGRAPHER: [
    "CREATOR",
    "BUSINESS_OWNER",
    "VIDEOGRAPHER",
    "DESIGNER",
    "SERVICE_PROVIDER",
    "FREELANCER",
  ],

  VIDEOGRAPHER: [
    "CREATOR",
    "BUSINESS_OWNER",
    "PHOTOGRAPHER",
    "DESIGNER",
    "FREELANCER",
    "SERVICE_PROVIDER",
  ],

  DESIGNER: [
    "CREATOR",
    "BUSINESS_OWNER",
    "DEVELOPER",
    "FREELANCER",
    "SERVICE_PROVIDER",
  ],

  DEVELOPER: [
    "BUSINESS_OWNER",
    "DESIGNER",
    "FREELANCER",
    "JOB_SEEKER",
  ],

  FREELANCER: [
    "BUSINESS_OWNER",
    "CREATOR",
    "DESIGNER",
    "DEVELOPER",
    "PHOTOGRAPHER",
    "VIDEOGRAPHER",
  ],

  BUSINESS_OWNER: [
    "CREATOR",
    "PHOTOGRAPHER",
    "VIDEOGRAPHER",
    "DESIGNER",
    "DEVELOPER",
    "FREELANCER",
    "SERVICE_PROVIDER",
  ],

  JOB_SEEKER: [
    "BUSINESS_OWNER",
    "DEVELOPER",
    "DESIGNER",
    "CREATOR",
    "FREELANCER",
  ],

  SERVICE_PROVIDER: [
    "BUSINESS_OWNER",
    "CREATOR",
    "PHOTOGRAPHER",
    "VIDEOGRAPHER",
    "FREELANCER",
  ],

  SELLER: [
    "BUSINESS_OWNER",
    "CREATOR",
  ],
};

/*
|--------------------------------------------------------------------------
| NORMALIZE
|--------------------------------------------------------------------------
*/

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

/*
|--------------------------------------------------------------------------
| CALCULATE RECOMMENDATION SCORE
|--------------------------------------------------------------------------
|
| Maximum score = 100
|
| Capability compatibility = 30
| Same capability          = 15
| Shared skills            = up to 20
| Same location            = 15
| Friend                   = 10
| Following                = 8
| Followed by              = 7
|
|--------------------------------------------------------------------------
*/

function calculateScore(
  currentCapabilities: string[],
  currentSkills: string[],
  currentLocation: string | null,
  targetCapabilities: string[],
  targetSkills: string[],
  targetLocation: string | null,
  following: boolean,
  followedBy: boolean,
  friend: boolean
) {
  let score = 0;

  const reasons: string[] = [];

  const currentCaps = currentCapabilities.map((value) =>
    value.toUpperCase()
  );

  const targetCaps = targetCapabilities.map((value) =>
    value.toUpperCase()
  );

  /*
  |--------------------------------------------------------------------------
  | 1. Capability compatibility
  |--------------------------------------------------------------------------
  */

  let capabilityMatch = false;

  for (const current of currentCaps) {
    if (!(current in compatibility)) {
      continue;
    }

    const compatible =
      compatibility[current as Capability];

    for (const target of targetCaps) {
      if (compatible.includes(target as Capability)) {
        capabilityMatch = true;

        score += 30;

        reasons.push(
          `${target.replace(
            /_/g,
            " "
          )} is relevant to your work`
        );

        break;
      }
    }

    if (capabilityMatch) {
      break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Same capability
  |--------------------------------------------------------------------------
  |
  | Even if two people do the same thing,
  | they may still be useful for networking,
  | referrals and collaboration.
  |
  */

  if (!capabilityMatch) {
    for (const current of currentCaps) {
      if (targetCaps.includes(current)) {
        score += 15;

        reasons.push(
          `You both work in ${current
            .replace(/_/g, " ")
            .toLowerCase()}`
        );

        break;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 3. Shared skills
  |--------------------------------------------------------------------------
  */

  const currentSkillSet = new Set(
    currentSkills.map((skill) => normalize(skill))
  );

  const sharedSkills = targetSkills.filter((skill) =>
    currentSkillSet.has(normalize(skill))
  );

  if (sharedSkills.length > 0) {
    score += Math.min(sharedSkills.length * 5, 20);

    reasons.push(
      `Shared skills: ${sharedSkills
        .slice(0, 3)
        .join(", ")}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 4. Same location
  |--------------------------------------------------------------------------
  */

  if (
    currentLocation &&
    targetLocation &&
    normalize(currentLocation) ===
      normalize(targetLocation)
  ) {
    score += 15;

    reasons.push(
      "You are in the same location"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 5. Social relationship
  |--------------------------------------------------------------------------
  */

  if (friend) {
    score += 10;

    reasons.push(
      "You are already friends"
    );
  } else if (following) {
    score += 8;

    reasons.push(
      "You already follow this person"
    );
  } else if (followedBy) {
    score += 7;

    reasons.push(
      "This person follows you"
    );
  }

  return {
    score: Math.min(score, 100),
    reasons: reasons.slice(0, 4),
  };
}

/*
|--------------------------------------------------------------------------
| GET RECOMMENDED PEOPLE
|--------------------------------------------------------------------------
*/

export async function getRecommendedPeople(
  userId: string,
  limit = 20
): Promise<RecommendedPerson[]> {
  /*
  |--------------------------------------------------------------------------
  | Get current user
  |--------------------------------------------------------------------------
  */

  const currentUser =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,

        profile: {
          include: {
            capabilities: true,
            skills: true,
          },
        },
      },
    });

  if (!currentUser) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | People I follow
  |--------------------------------------------------------------------------
  */

  const followingRows =
    await prisma.follow.findMany({
      where: {
        followerId: userId,
      },

      select: {
        followingId: true,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | People who follow me
  |--------------------------------------------------------------------------
  */

  const followerRows =
    await prisma.follow.findMany({
      where: {
        followingId: userId,
      },

      select: {
        followerId: true,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | Friends
  |--------------------------------------------------------------------------
  */

  const friendshipRows =
    await prisma.friendship.findMany({
      where: {
        OR: [
          {
            userAId: userId,
          },
          {
            userBId: userId,
          },
        ],
      },

      select: {
        userAId: true,
        userBId: true,
      },
    });

  const followingIds = new Set(
    followingRows.map(
      (row) => row.followingId
    )
  );

  const followerIds = new Set(
    followerRows.map(
      (row) => row.followerId
    )
  );

  const friendIds = new Set<string>();

  for (const friendship of friendshipRows) {
    if (friendship.userAId === userId) {
      friendIds.add(friendship.userBId);
    } else {
      friendIds.add(friendship.userAId);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get candidate users
  |--------------------------------------------------------------------------
  |
  | For V1 we inspect up to 200 users.
  |
  | Later this can become:
  |
  | PostgreSQL search
  | PostgreSQL full-text search
  | pgvector
  | embeddings
  | ML ranking
  |
  |--------------------------------------------------------------------------
  */

  const users =
    await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },

        profile: {
          isNot: null,
        },
      },

      select: {
        id: true,
        name: true,

        profile: {
          include: {
            capabilities: true,
            skills: true,
          },
        },
      },

      take: 200,
    });

  /*
  |--------------------------------------------------------------------------
  | Current user's information
  |--------------------------------------------------------------------------
  */

  const currentCapabilities =
    currentUser.profile?.capabilities.map(
      (item) => item.capability
    ) || [];

  const currentSkills =
    currentUser.profile?.skills.map(
      (item) => item.skill
    ) || [];

  const currentLocation =
    currentUser.profile?.location || null;

  /*
  |--------------------------------------------------------------------------
  | Build recommendations
  |--------------------------------------------------------------------------
  */

  const recommendations: RecommendedPerson[] =
    [];

  for (const user of users) {
    if (!user.profile) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship state
    |--------------------------------------------------------------------------
    */

    const following =
      followingIds.has(user.id);

    const followedBy =
      followerIds.has(user.id);

    const friend =
      friendIds.has(user.id);

    /*
    |--------------------------------------------------------------------------
    | Target information
    |--------------------------------------------------------------------------
    */

    const targetCapabilities =
      user.profile.capabilities.map(
        (item) => item.capability
      );

    const targetSkills =
      user.profile.skills.map(
        (item) => item.skill
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate score
    |--------------------------------------------------------------------------
    */

    const result = calculateScore(
      currentCapabilities,
      currentSkills,
      currentLocation,
      targetCapabilities,
      targetSkills,
      user.profile.location,
      following,
      followedBy,
      friend
    );

    /*
    |--------------------------------------------------------------------------
    | If there is no strong match,
    | keep the person as discovery content.
    |--------------------------------------------------------------------------
    */

    if (result.score === 0) {
      result.score = 5;

      result.reasons.push(
        "Discover someone new on CollabX"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Add recommendation
    |--------------------------------------------------------------------------
    */

    recommendations.push({
      user: {
        id: user.id,

        name: user.name,

        profile: {
          username:
            user.profile.username,

          bio:
            user.profile.bio,

          location:
            user.profile.location,

          avatarUrl:
            user.profile.avatarUrl,

          availability:
            user.profile.availability,

          capabilities:
            user.profile.capabilities.map(
              (item) => ({
                capability:
                  item.capability,
              })
            ),

          skills:
            user.profile.skills.map(
              (item) => ({
                skill: item.skill,
              })
            ),
        },
      },

      score: result.score,

      reasons: result.reasons,

      relationship: {
        following,
        followedBy,
        friend,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Sort
  |--------------------------------------------------------------------------
  |
  | First:
  | Highest relevance
  |
  | Second:
  | Existing relationships
  |
  |--------------------------------------------------------------------------
  */

  recommendations.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aRelationship =
      Number(a.relationship.friend) +
      Number(a.relationship.following) +
      Number(a.relationship.followedBy);

    const bRelationship =
      Number(b.relationship.friend) +
      Number(b.relationship.following) +
      Number(b.relationship.followedBy);

    return (
      bRelationship -
      aRelationship
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Return requested number
  |--------------------------------------------------------------------------
  */

  return recommendations.slice(
    0,
    Math.max(1, Math.min(limit, 50))
  );
}
