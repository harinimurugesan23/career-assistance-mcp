import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadResume, getResume, listResumes } from "../controllers/resumeController.js";

const router = express.Router();
router.use(protect);
router.post("/upload", upload.single("resume"), uploadResume);
router.get("/", listResumes);
router.get("/:id", getResume);

export default router;
