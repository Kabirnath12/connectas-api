import { Request, Response } from "express";
import { fetchRemotiveJobs } from "../services/jobs/remotive.service";

export async function searchJobs(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : typeof req.query.q === "string"
        ? req.query.q
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined;

    const limitValue =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 50;

    const limit = Number.isFinite(limitValue)
      ? Math.min(Math.max(limitValue, 1), 100)
      : 50;

    const jobs = await fetchRemotiveJobs({
      search,
      category,
      limit,
    });

    return res.status(200).json({
      success: true,
      source: "Remotive",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Search jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

export async function getLatestJobs(
  req: Request,
  res: Response
) {
  try {
    const limitValue =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 50;

    const limit = Number.isFinite(limitValue)
      ? Math.min(Math.max(limitValue, 1), 100)
      : 50;

    const jobs = await fetchRemotiveJobs({
      limit,
    });

    return res.status(200).json({
      success: true,
      source: "Remotive",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Latest jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest jobs",
    });
  }
}

export async function getRemoteJobs(
  req: Request,
  res: Response
) {
  try {
    const jobs = await fetchRemotiveJobs({
      limit: 100,
    });

    return res.status(200).json({
      success: true,
      source: "Remotive",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Remote jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch remote jobs",
    });
  }
}
