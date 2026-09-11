import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getRecommendedPeople } from "../services/recommendation.service";

export async function recommendedPeople(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const rawLimit = Number(req.query.limit || 20);

    const limit = Math.min(
      Math.max(rawLimit, 1),
      50
    );

    const people = await getRecommendedPeople(
      req.userId,
      limit
    );

    return res.json({
      success: true,
      people,
    });
  } catch (error) {
    console.error(
      "Recommendation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate recommendations",
    });
  }
}