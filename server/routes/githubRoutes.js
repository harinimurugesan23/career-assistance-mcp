import express from "express";
import { protect } from "../middleware/auth.js";
import { reviewGithubProfile } from "../controllers/githubController.js";

const router = express.Router();
router.use(protect);
router.post("/review", reviewGithubProfile);

export default router;
