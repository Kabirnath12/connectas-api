import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type DemoUser = {
  name: string;
  email: string;
  username: string;
  bio: string;
  location: string;
  capabilities: string[];
  skills: string[];
};

const demoUsers: DemoUser[] = [
  {
    name: "Rahul Sharma",
    email: "demo.rahul@collabx.test",
    username: "rahulsharma",
    bio: "Content creator and food vlogger looking for brands and creative collaborators.",
    location: "Guwahati",
    capabilities: ["CREATOR"],
    skills: ["Content Creation", "Food Blogging", "Instagram", "Video Editing"],
  },

  {
    name: "Priya Das",
    email: "demo.priya@collabx.test",
    username: "priyadas",
    bio: "Professional photographer specialising in portraits, food and events.",
    location: "Guwahati",
    capabilities: ["PHOTOGRAPHER", "FREELANCER"],
    skills: ["Photography", "Portraits", "Food Photography", "Lightroom"],
  },

  {
    name: "Arjun Bora",
    email: "demo.arjun@collabx.test",
    username: "arjunbora",
    bio: "Videographer and filmmaker helping brands create high quality visual content.",
    location: "Guwahati",
    capabilities: ["VIDEOGRAPHER", "CREATOR"],
    skills: ["Videography", "Cinematography", "Premiere Pro", "Reels"],
  },

  {
    name: "Sneha Saikia",
    email: "demo.sneha@collabx.test",
    username: "snehasaikia",
    bio: "Graphic and UI/UX designer working with startups and creators.",
    location: "Guwahati",
    capabilities: ["DESIGNER", "FREELANCER"],
    skills: ["UI/UX", "Figma", "Branding", "Graphic Design"],
  },

  {
    name: "Rohan Nath",
    email: "demo.rohan@collabx.test",
    username: "rohannath",
    bio: "Full-stack developer building websites and digital products for businesses.",
    location: "Guwahati",
    capabilities: ["DEVELOPER", "FREELANCER"],
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
  },

  {
    name: "Megha Baruah",
    email: "demo.megha@collabx.test",
    username: "meghabaruah",
    bio: "Restaurant owner interested in food creators, photographers and marketing.",
    location: "Guwahati",
    capabilities: ["BUSINESS_OWNER"],
    skills: ["Restaurant", "Food", "Hospitality", "Marketing"],
  },

  {
    name: "Kunal Dutta",
    email: "demo.kunal@collabx.test",
    username: "kunaldutta",
    bio: "Freelance digital marketer helping local businesses grow online.",
    location: "Guwahati",
    capabilities: ["FREELANCER"],
    skills: ["Digital Marketing", "SEO", "Social Media", "Ads"],
  },

  {
    name: "Nisha Roy",
    email: "demo.nisha@collabx.test",
    username: "nisharoy",
    bio: "Fashion and lifestyle creator working with local brands.",
    location: "Guwahati",
    capabilities: ["CREATOR"],
    skills: ["Fashion", "Lifestyle", "Instagram", "Brand Collaboration"],
  },

  {
    name: "Ishita Sharma",
    email: "demo.ishita@collabx.test",
    username: "ishitasharma",
    bio: "Professional makeup artist available for weddings and events.",
    location: "Guwahati",
    capabilities: ["SERVICE_PROVIDER", "FREELANCER"],
    skills: ["Makeup", "Bridal Makeup", "Beauty", "Events"],
  },

  {
    name: "Amit Kalita",
    email: "demo.amit@collabx.test",
    username: "amitkalita",
    bio: "Event professional working with photographers, singers, decorators and caterers.",
    location: "Guwahati",
    capabilities: ["SERVICE_PROVIDER"],
    skills: ["Event Management", "Weddings", "Planning", "Coordination"],
  },

  {
    name: "Ananya Das",
    email: "demo.ananya@collabx.test",
    username: "ananyadas",
    bio: "Aspiring software engineer looking for internships and development opportunities.",
    location: "Tezpur",
    capabilities: ["JOB_SEEKER", "DEVELOPER"],
    skills: ["JavaScript", "React", "Python", "DSA"],
  },

  {
    name: "Vikram Singh",
    email: "demo.vikram@collabx.test",
    username: "vikramsingh",
    bio: "Local electronics and computer equipment seller.",
    location: "Guwahati",
    capabilities: ["SELLER"],
    skills: ["Electronics", "Computers", "Laptops", "Cameras"],
  },

  {
    name: "Riya Hazarika",
    email: "demo.riya@collabx.test",
    username: "riyahazarika",
    bio: "Travel creator showcasing Northeast India.",
    location: "Tezpur",
    capabilities: ["CREATOR"],
    skills: ["Travel", "Photography", "Reels", "Northeast India"],
  },

  {
    name: "Dev Kumar",
    email: "demo.dev@collabx.test",
    username: "devkumar",
    bio: "Startup founder looking for developers, designers and marketers.",
    location: "Guwahati",
    capabilities: ["BUSINESS_OWNER"],
    skills: ["Startups", "Technology", "Business", "Product"],
  },

  {
    name: "Pooja Saikia",
    email: "demo.pooja@collabx.test",
    username: "poojasaikia",
    bio: "Freelance writer and social media specialist.",
    location: "Tezpur",
    capabilities: ["FREELANCER"],
    skills: ["Writing", "Copywriting", "Social Media", "Content"],
  },

  {
    name: "Sanjay Bora",
    email: "demo.sanjay@collabx.test",
    username: "sanjaybora",
    bio: "Wedding photographer and videographer.",
    location: "Tezpur",
    capabilities: ["PHOTOGRAPHER", "VIDEOGRAPHER"],
    skills: ["Wedding Photography", "Videography", "Editing", "Events"],
  },

  {
    name: "Neha Ahmed",
    email: "demo.neha@collabx.test",
    username: "nehaahmed",
    bio: "Digital agency owner helping businesses with branding and marketing.",
    location: "Guwahati",
    capabilities: ["BUSINESS_OWNER", "SERVICE_PROVIDER"],
    skills: ["Marketing", "Branding", "Social Media", "Advertising"],
  },

  {
    name: "Manish Das",
    email: "demo.manish@collabx.test",
    username: "manishdas",
    bio: "Web developer and UI specialist available for freelance projects.",
    location: "Tezpur",
    capabilities: ["DEVELOPER", "DESIGNER"],
    skills: ["Next.js", "React", "UI/UX", "Tailwind CSS"],
  },

  {
    name: "Kavita Bora",
    email: "demo.kavita@collabx.test",
    username: "kavitabora",
    bio: "Home service professional providing renovation and maintenance services.",
    location: "Guwahati",
    capabilities: ["SERVICE_PROVIDER"],
    skills: ["Home Repair", "Renovation", "Painting", "Maintenance"],
  },

  {
    name: "Aditya Nath",
    email: "demo.aditya@collabx.test",
    username: "adityanath",
    bio: "Young entrepreneur building local businesses and digital ventures.",
    location: "Guwahati",
    capabilities: ["BUSINESS_OWNER", "SELLER"],
    skills: ["Business", "Sales", "E-commerce", "Marketing"],
  },
];

const posts = [
  {
    title: "Food Reel Shoot",
    caption:
      "Looking for restaurants interested in professional food content.",
    category: "Food",
    location: "Guwahati",
  },
  {
    title: "Portrait Photography",
    caption:
      "New portrait portfolio. Available for collaborations and paid shoots.",
    category: "Photography",
    location: "Guwahati",
  },
  {
    title: "Brand Video",
    caption:
      "Sample commercial video created for a local business.",
    category: "Videography",
    location: "Guwahati",
  },
  {
    title: "UI Design Concept",
    caption:
      "Modern mobile app interface concept.",
    category: "Design",
    location: "Guwahati",
  },
  {
    title: "Full Stack Project",
    caption:
      "Building scalable web applications using React and Node.js.",
    category: "Technology",
    location: "Guwahati",
  },
  {
    title: "Restaurant Collaboration",
    caption:
      "Looking for food creators and photographers for our restaurant.",
    category: "Business",
    location: "Guwahati",
  },
  {
    title: "Digital Marketing",
    caption:
      "Helping local businesses grow through social media.",
    category: "Marketing",
    location: "Guwahati",
  },
  {
    title: "Travel Northeast",
    caption:
      "Exploring hidden destinations across Northeast India.",
    category: "Travel",
    location: "Tezpur",
  },
];

async function main() {
  console.log("======================================");
  console.log("       COLLABX DEMO SEED START");
  console.log("======================================");

  const passwordHash = await bcrypt.hash(
    "Demo@123",
    10
  );

  const createdUsers: Record<string, string> = {};

  /*
  |--------------------------------------------------------------------------
  | USERS + PROFILES
  |--------------------------------------------------------------------------
  */

  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({
      where: {
        email: demo.email,
      },

      update: {
        name: demo.name,
        passwordHash,
      },

      create: {
        email: demo.email,
        name: demo.name,
        passwordHash,
      },
    });

    createdUsers[demo.username] = user.id;

    const profile =
      await prisma.profile.upsert({
        where: {
          userId: user.id,
        },

        update: {
          username: demo.username,
          bio: demo.bio,
          location: demo.location,
          availability: "Available for collaboration",
        },

        create: {
          userId: user.id,
          username: demo.username,
          bio: demo.bio,
          location: demo.location,
          availability:
            "Available for collaboration",
        },
      });

    /*
    |--------------------------------------------------------------------------
    | CAPABILITIES
    |--------------------------------------------------------------------------
    */

    await prisma.profileCapability.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    for (const capability of demo.capabilities) {
      await prisma.profileCapability.create({
        data: {
          profileId: profile.id,
          capability: capability as any,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SKILLS
    |--------------------------------------------------------------------------
    */

    await prisma.profileSkill.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    for (const skill of demo.skills) {
      await prisma.profileSkill.create({
        data: {
          profileId: profile.id,
          skill,
        },
      });
    }

    console.log(
      `Created/updated user: ${demo.name}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | POSTS
  |--------------------------------------------------------------------------
  */

  for (let i = 0; i < demoUsers.length; i++) {
    const demo = demoUsers[i];

    const userId =
      createdUsers[demo.username];

    await prisma.post.deleteMany({
      where: {
        authorId: userId,
      },
    });

    const post =
      posts[i % posts.length];

    await prisma.post.create({
      data: {
        authorId: userId,
        type:
          i % 5 === 0
            ? "OPPORTUNITY"
            : "PORTFOLIO",
        title: post.title,
        caption: post.caption,
        category: post.category,
        location: post.location,
      },
    });
  }

  console.log("Created demo posts.");

  /*
  |--------------------------------------------------------------------------
  | FOLLOW RELATIONSHIPS
  |--------------------------------------------------------------------------
  */

  const follows = [
    ["rahulsharma", "priyadas"],
    ["rahulsharma", "arjunbora"],
    ["rahulsharma", "snehasaikia"],
    ["rahulsharma", "meghabaruah"],
    ["rahulsharma", "rohannath"],

    ["nisharoy", "rahulsharma"],
    ["kunaldutta", "rahulsharma"],
    ["ishitasharma", "rahulsharma"],
    ["riyahazarika", "rahulsharma"],

    ["meghabaruah", "rahulsharma"],
    ["devkumar", "rohannath"],
    ["nehaahmed", "kunaldutta"],
    ["ananyadas", "rohannath"],
    ["riyahazarika", "priyadas"],
    ["adityanath", "meghabaruah"],
  ];

  for (const [follower, following] of follows) {
    const followerId =
      createdUsers[follower];

    const followingId =
      createdUsers[following];

    if (!followerId || !followingId) {
      continue;
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },

      update: {},

      create: {
        followerId,
        followingId,
      },
    });
  }

  console.log("Created follow relationships.");

  /*
  |--------------------------------------------------------------------------
  | FRIENDSHIPS
  |--------------------------------------------------------------------------
  */

  const friendships = [
    ["rahulsharma", "priyadas"],
    ["rahulsharma", "arjunbora"],
    ["rahulsharma", "kunaldutta"],
    ["snehasaikia", "rohannath"],
    ["meghabaruah", "devkumar"],
  ];

  for (const [personA, personB] of friendships) {
    let userAId =
      createdUsers[personA];

    let userBId =
      createdUsers[personB];

    if (!userAId || !userBId) {
      continue;
    }

    if (userAId > userBId) {
      [userAId, userBId] = [
        userBId,
        userAId,
      ];
    }

    await prisma.friendship.upsert({
      where: {
        userAId_userBId: {
          userAId,
          userBId,
        },
      },

      update: {},

      create: {
        userAId,
        userBId,
      },
    });
  }

  console.log("Created friendships.");

  /*
  |--------------------------------------------------------------------------
  | FRIEND REQUESTS
  |--------------------------------------------------------------------------
  */

  const friendRequests = [
    ["nisharoy", "rahulsharma"],
    ["rahulsharma", "riyahazarika"],
  ];

  for (const [sender, receiver] of friendRequests) {
    const senderId =
      createdUsers[sender];

    const receiverId =
      createdUsers[receiver];

    if (!senderId || !receiverId) {
      continue;
    }

    const existing =
      await prisma.friendRequest.findFirst({
        where: {
          senderId,
          receiverId,
          status: "PENDING",
        },
      });

    if (!existing) {
      await prisma.friendRequest.create({
        data: {
          senderId,
          receiverId,
          status: "PENDING",
        },
      });
    }
  }

  console.log("Created friend requests.");

  /*
  |--------------------------------------------------------------------------
  | COLLABORATIONS
  |--------------------------------------------------------------------------
  */

  const collaborationPairs = [
    {
      sender: "rahulsharma",
      receiver: "meghabaruah",
      status: "PENDING" as const,
      message:
        "I would love to create food content for your restaurant.",
    },

    {
      sender: "rahulsharma",
      receiver: "arjunbora",
      status: "ACCEPTED" as const,
      message:
        "Let's collaborate on a travel video project.",
    },

    {
      sender: "meghabaruah",
      receiver: "priyadas",
      status: "PENDING" as const,
      message:
        "We are looking for a photographer for our restaurant.",
    },
  ];

  for (const item of collaborationPairs) {
    const senderId =
      createdUsers[item.sender];

    const receiverId =
      createdUsers[item.receiver];

    if (!senderId || !receiverId) {
      continue;
    }

    const existing =
      await prisma.collaboration.findFirst({
        where: {
          senderId,
          receiverId,
        },
      });

    if (!existing) {
      await prisma.collaboration.create({
        data: {
          senderId,
          receiverId,
          message: item.message,
          status: item.status,
        },
      });
    }
  }

  console.log("Created collaborations.");

  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const rahulId =
    createdUsers["rahulsharma"];

  if (rahulId) {
    await prisma.notification.createMany({
      data: [
        {
          userId: rahulId,
          type: "FOLLOW",
          message:
            "Nisha Roy started following you.",
        },

        {
          userId: rahulId,
          type: "FRIEND_REQUEST",
          message:
            "Nisha Roy sent you a friend request.",
        },

        {
          userId: rahulId,
          type: "COLLABORATION",
          message:
            "Megha Baruah received your collaboration request.",
        },
      ],
    });
  }

  console.log("Created notifications.");

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log("======================================");
  console.log("       COLLABX DEMO SEED COMPLETE");
  console.log("======================================");
  console.log("");
  console.log("Demo users:", demoUsers.length);
  console.log("Demo password: Demo@123");
  console.log("");
  console.log("Example accounts:");
  console.log("rahulsharma");
  console.log("priyadas");
  console.log("arjunbora");
  console.log("meghabaruah");
  console.log("rohannath");
  console.log("");
  console.log(
    "Recommendation testing is now ready."
  );
}

main()
  .catch((error) => {
    console.error(
      "SEED ERROR:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });