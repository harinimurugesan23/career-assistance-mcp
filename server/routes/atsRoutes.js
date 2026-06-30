import express from "express";
import { protect } from "../middleware/auth.js";
import { getAtsScore, getAtsHistory } from "../controllers/atsController.js";

const router = express.Router();
router.use(protect);
router.post("/", getAtsScore);
router.get("/history/:resumeId", getAtsHistory);

export default router;
