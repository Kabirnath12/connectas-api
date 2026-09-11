import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

interface RegisterInput { name: string; email: string; password: string; }
interface LoginInput { email: string; password: string; }

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error("Invalid email or password");

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) throw new Error("Invalid email or password");

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is not configured");

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
  };
}
