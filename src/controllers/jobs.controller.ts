import { Request, Response } from "express";
import { fetchRemotiveJobs } from "../services/jobs/remotive.service";
import { fetchAdzunaJobs } from "../services/jobs/adzuna.service";

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getLimit(value: unknown): number {
  const parsed = Number(value || 50);

  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

function combineJobs(...jobLists: any[][]) {
  const combined = jobLists.flat();

  const seen = new Set<string>();

  return combined.filter((job) => {
    const key = `${job.source}-${job.externalId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function searchJobs(req: Request, res: Response) {
  try {
    const search =
      getQueryString(req.query.search) ||
      getQueryString(req.query.q);

    const category = getQueryString(req.query.category);
    const location = getQueryString(req.query.location);
    const source = getQueryString(req.query.source);
    const limit = getLimit(req.query.limit);

    const shouldUseIndia =
      !location ||
      location.toLowerCase() === "india" ||
      location.toLowerCase() === "all" ||
      location.toLowerCase() === "remote india";

    const [remotiveJobs, adzunaJobs] = await Promise.all([
      source === "adzuna"
        ? Promise.resolve([])
        : fetchRemotiveJobs({
            search,
            category,
            location:
              location?.toLowerCase() === "india"
                ? "india"
                : location,
            limit,
          }),

      source === "remotive" || !shouldUseIndia
        ? Promise.resolve([])
        : fetchAdzunaJobs({
            search,
            location:
              location?.toLowerCase() === "india"
                ? undefined
                : location,
            limit,
          }),
    ]);

    const jobs = combineJobs(remotiveJobs, adzunaJobs);

    return res.status(200).json({
      success: true,
      sources: ["Remotive", "Adzuna"],
      count: jobs.length,
      filters: {
        search: search || null,
        category: category || null,
        location: location || null,
        source: source || null,
      },
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

export async function getLatestJobs(req: Request, res: Response) {
  try {
    const location = getQueryString(req.query.location);
    const limit = getLimit(req.query.limit);

    const [remotiveJobs, adzunaJobs] = await Promise.all([
      fetchRemotiveJobs({
        location,
        limit,
      }),

      location?.toLowerCase() === "worldwide"
        ? Promise.resolve([])
        : fetchAdzunaJobs({
            location:
              location?.toLowerCase() === "india"
                ? undefined
                : location,
            limit,
          }),
    ]);

    const jobs = combineJobs(remotiveJobs, adzunaJobs);

    return res.status(200).json({
      success: true,
      sources: ["Remotive", "Adzuna"],
      count: jobs.length,
      filters: {
        location: location || null,
      },
      jobs,
    });
  } catch (error) {
    console.error("Latest jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
}

export async function getRemoteJobs(req: Request, res: Response) {
  try {
    const location = getQueryString(req.query.location);

    const remotiveJobs = await fetchRemotiveJobs({
      location,
      limit: 100,
    });

    return res.status(200).json({
      success: true,
      sources: ["Remotive"],
      count: remotiveJobs.length,
      filters: {
        location: location || null,
      },
      jobs: remotiveJobs,
    });
  } catch (error) {
    console.error("Remote jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch remote jobs",
    });
  }
}
