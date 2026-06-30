import express from "express";
import { protect } from "../middleware/auth.js";
import { generateCoverLetter, downloadCoverLetterPdf } from "../controllers/coverLetterController.js";

const router = express.Router();
router.use(protect);
router.post("/", generateCoverLetter);
router.post("/pdf", downloadCoverLetterPdf);

export default router;
