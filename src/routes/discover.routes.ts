import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { discoverPeople } from "../controllers/discover.controller";

const router = Router();

router.get("/people", authenticate, discoverPeople);

export default router;