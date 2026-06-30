import express from "express";
import { protect } from "../middleware/auth.js";
import { getSuggestions } from "../controllers/suggestionsController.js";

const router = express.Router();
router.use(protect);
router.post("/", getSuggestions);

export default router;
