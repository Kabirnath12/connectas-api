import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

    const user = await registerUser({ name, email, password });
    return res.status(201).json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({ success: false, message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const result = await loginUser({ email, password });
    return res.status(200).json({ success: true, message: "Login successful", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({ success: false, message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Authentication required" });
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to retrieve user" });
  }
}
