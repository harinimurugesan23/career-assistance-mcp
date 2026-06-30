import Resume from "../models/Resume.js";
import { extractText } from "../utils/extractText.js";

export async function uploadResume(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "docx";
    const extractedText = await extractText(req.file.path, req.file.mimetype);

    if (!extractedText || extractedText.length < 30) {
      return res.status(422).json({
        message: "Could not extract meaningful text from this file. Try a different export.",
      });
    }

    const resume = await Resume.create({
      user: req.userId,
      originalName: req.file.originalname,
      storedPath: req.file.path,
      fileType,
      extractedText,
    });

    res.status(201).json({
      resumeId: resume._id,
      originalName: resume.originalName,
      preview: extractedText.slice(0, 400),
      charCount: extractedText.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getResume(req, res) {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listResumes(req, res) {
  try {
    const resumes = await Resume.find({ user: req.userId })
      .select("originalName fileType createdAt")
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
