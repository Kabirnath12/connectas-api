import prisma from "./src/config/prisma";

async function test() {
  try {
    const follows = await prisma.follow.findMany({
      take: 5,
    });

    console.log("FOLLOW TEST SUCCESS:");
    console.log(follows);
  } catch (error) {
    console.error("FOLLOW TEST ERROR:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();