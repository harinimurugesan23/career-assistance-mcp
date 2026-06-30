import express from "express";
import { protect } from "../middleware/auth.js";
import { matchJobDescription } from "../controllers/jdMatchController.js";

const router = express.Router();
router.use(protect);
router.post("/", matchJobDescription);

export default router;
