import axios from "axios";

export type NormalizedJob = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  companyName: string;
  companyLogo?: string | null;
  location?: string | null;
  remote: boolean;
  jobType?: string | null;
  category?: string | null;
  salary?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  applicationUrl: string;
  sourceUrl: string;
  tags: string[];
};

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
  tags?: string[];
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
  "job-count"?: number;
};

function normalizeJob(job: RemotiveJob): NormalizedJob {
  return {
    id: `remotive-${job.id}`,
    externalId: String(job.id),
    source: "Remotive",
    title: job.title,
    companyName: job.company_name,
    companyLogo: job.company_logo || null,
    location: job.candidate_required_location || "Remote",
    remote: true,
    jobType: job.job_type || null,
    category: job.category || null,
    salary: job.salary || null,
    description: job.description || null,
    publishedAt: job.publication_date || null,
    applicationUrl: job.url,
    sourceUrl: job.url,
    tags: Array.isArray(job.tags) ? job.tags : [],
  };
}

export async function fetchRemotiveJobs(params: {
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
}) {
  const response = await axios.get<RemotiveResponse>(
    "https://remotive.com/api/remote-jobs",
    {
      params: {
        limit: Math.min(params.limit || 50, 100),
      },
      timeout: 20000,
    }
  );

  let jobs = response.data.jobs || [];

  const search = params.search?.trim().toLowerCase();
  const category = params.category?.trim().toLowerCase();
  const location = params.location?.trim().toLowerCase();

  if (search) {
    jobs = jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company_name,
        job.category,
        job.description,
        ...(job.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }

  if (category) {
    jobs = jobs.filter((job) =>
      String(job.category || "")
        .toLowerCase()
        .includes(category)
    );
  }

  if (location && location !== "all") {
    jobs = jobs.filter((job) => {
      const jobLocation = String(
        job.candidate_required_location || ""
      ).toLowerCase();

      // India-specific matching
      if (location === "india") {
        return (
          jobLocation.includes("india") ||
          jobLocation.includes("indian") ||
          jobLocation.includes("bengaluru") ||
          jobLocation.includes("bangalore") ||
          jobLocation.includes("mumbai") ||
          jobLocation.includes("new delhi") ||
          jobLocation.includes("delhi") ||
          jobLocation.includes("hyderabad") ||
          jobLocation.includes("pune") ||
          jobLocation.includes("chennai") ||
          jobLocation.includes("kolkata") ||
          jobLocation.includes("gurgaon") ||
          jobLocation.includes("gurugram") ||
          jobLocation.includes("noida") ||
          jobLocation.includes("ahmedabad")
        );
      }

      if (location === "worldwide") {
        return (
          jobLocation.includes("worldwide") ||
          jobLocation.includes("anywhere") ||
          jobLocation.includes("global") ||
          jobLocation.includes("all countries")
        );
      }

      if (location === "usa") {
        return (
          jobLocation.includes("united states") ||
          jobLocation.includes("usa") ||
          jobLocation.includes("us only")
        );
      }

      if (location === "uk") {
        return (
          jobLocation.includes("united kingdom") ||
          jobLocation.includes("uk only") ||
          jobLocation.includes("england")
        );
      }

      if (location === "canada") {
        return jobLocation.includes("canada");
      }

      if (location === "europe") {
        return jobLocation.includes("europe");
      }

      if (location === "asia") {
        return jobLocation.includes("asia");
      }

      return jobLocation.includes(location);
    });
  }

  return jobs.map(normalizeJob);
}