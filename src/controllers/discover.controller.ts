import { Request, Response } from "express";
import { getRecommendedPeople } from "../services/recommendation.service";

export async function discoverPeople(req: Request, res: Response) {
  try {
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const limit = Math.min(
      Number(req.query.limit) || 20,
      50
    );

    const recommendations = await getRecommendedPeople(
      userId,
      limit
    );

    return res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Discover people error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load recommendations",
    });
  }
}