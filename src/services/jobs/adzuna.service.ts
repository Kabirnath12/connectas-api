import axios from "axios";

export type AdzunaJob = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  location: string | null;
  remote: boolean;
  jobType: string | null;
  category: string | null;
  salary: string | null;
  description: string | null;
  publishedAt: string | null;
  applicationUrl: string;
  sourceUrl: string;
  tags: string[];
};

type AdzunaRawJob = {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  category?: {
    label?: string;
    tag?: string;
  };
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
    area?: string[];
  };
};

type AdzunaResponse = {
  results?: AdzunaRawJob[];
  count?: number;
};

function getSalary(job: AdzunaRawJob): string | null {
  const min = job.salary_min;
  const max = job.salary_max;

  if (min && max) return `${min} - ${max}`;
  if (min) return `From ${min}`;
  if (max) return `Up to ${max}`;

  return null;
}

function normalizeJob(job: AdzunaRawJob): AdzunaJob {
  const location = job.location?.display_name || null;

  return {
    id: `adzuna-${String(job.id || Math.random())}`,
    externalId: String(job.id || ""),
    source: "Adzuna",
    title: job.title || "Untitled Job",
    companyName: job.company?.display_name || "Unknown Company",
    companyLogo: null,
    location,
    remote:
      String(location || "").toLowerCase().includes("remote") ||
      String(job.title || "").toLowerCase().includes("remote"),
    jobType: job.contract_time || job.contract_type || null,
    category: job.category?.label || null,
    salary: getSalary(job),
    description: job.description || null,
    publishedAt: job.created || null,
    applicationUrl: job.redirect_url || "#",
    sourceUrl: job.redirect_url || "#",
    tags: [
      job.category?.label,
      job.contract_type,
      job.contract_time,
    ].filter(Boolean) as string[],
  };
}

export async function fetchAdzunaJobs(params: {
  search?: string;
  location?: string;
  country?: string;
  page?: number;
  limit?: number;
}): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn(
      "Adzuna disabled: ADZUNA_APP_ID or ADZUNA_APP_KEY is missing"
    );
    return [];
  }

  const country = (params.country || "in").toLowerCase();
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);

  const queryParams: Record<string, string | number> = {
    app_id: appId,
    app_key: appKey,
    results_per_page: limit,
    what: params.search || "",
    "content-type": "application/json",
  };

  // Do not send an empty "where" parameter.
  if (params.location && params.location.trim()) {
    queryParams.where = params.location.trim();
  }

  try {
    const response = await axios.get<AdzunaResponse>(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
      {
        params: queryParams,
        timeout: 20000,
      }
    );

    return (response.data.results || []).map(normalizeJob);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Adzuna API error:", {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
    } else {
      console.error("Adzuna unknown error:", error);
    }

    // Keep Remotive and other job sources working even if Adzuna fails.
    return [];
  }
}