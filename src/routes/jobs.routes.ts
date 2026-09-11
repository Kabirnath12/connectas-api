import { Router } from "express";

import {
  searchJobs,
  getLatestJobs,
  getRemoteJobs,
} from "../controllers/jobs.controller";

const router = Router();

/**
 * Search jobs
 *
 * GET /api/jobs/search?search=react
 * GET /api/jobs/search?q=node.js
 * GET /api/jobs/search?category=software
 */
router.get("/search", searchJobs);

/**
 * Latest jobs
 *
 * GET /api/jobs/latest
 * GET /api/jobs/latest?limit=20
 */
router.get("/latest", getLatestJobs);

/**
 * Remote jobs
 *
 * GET /api/jobs/remote
 */
router.get("/remote", getRemoteJobs);

export default router;