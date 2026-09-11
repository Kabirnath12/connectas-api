import { Router } from "express";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";
import { getRecommendedPeople } from "../services/recommendation.service";

const router = Router();

/*
|--------------------------------------------------------------------------
| GET RECOMMENDED PEOPLE
|--------------------------------------------------------------------------
|
| GET /api/recommendations/people
|
| Optional:
|
| ?limit=20
|
|--------------------------------------------------------------------------
*/

router.get(
  "/people",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const requestedLimit = Number(
        req.query.limit || 20
      );

      const limit = Number.isFinite(requestedLimit)
        ? Math.max(
            1,
            Math.min(requestedLimit, 50)
          )
        : 20;

      const people =
        await getRecommendedPeople(
          userId,
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
);

export default router;