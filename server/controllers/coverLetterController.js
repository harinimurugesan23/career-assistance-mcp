import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import { chatComplete } from "../utils/aiClient.js";

const SYSTEM_PROMPT = `You are an expert career coach who writes concise, compelling, specific cover letters
for software engineering / tech roles. Avoid generic filler ("I am writing to express my interest...").
Open with a strong hook, connect 2-3 concrete resume achievements to the job description's actual needs,
and close with a confident, specific call to action. Keep it to 3-4 short paragraphs, plain text, no markdown,
no placeholders like [Your Name] left unfilled if the info is available.`;

export async function generateCoverLetter(req, res) {
  try {
    const { resumeId, jobDescription, companyName, roleTitle, candidateName } = req.body;
    if (!resumeId || !jobDescription || !companyName) {
      return res
        .status(400)
        .json({ message: "resumeId, jobDescription, and companyName are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const userPrompt = `Candidate name: ${candidateName || "the candidate"}
Target role: ${roleTitle || "the advertised role"}
Company: ${companyName}

RESUME:
"""
${resume.extractedText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Write the cover letter now as plain text (no markdown headers).`;

    const letter = await chatComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { json: false, temperature: 0.6, maxTokens: 800 }
    );

    await Analysis.create({
      user: req.userId,
      resume: resume._id,
      type: "cover_letter",
      jobDescription,
      result: { companyName, roleTitle, letter },
    });

    res.json({ letter });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Exports the most recently generated letter text (sent in request body) as a downloadable PDF.
export async function downloadCoverLetterPdf(req, res) {
  try {
    const { letter, companyName } = req.body;
    if (!letter) return res.status(400).json({ message: "letter text is required" });

    const fileName = `cover-letter-${(companyName || "company").replace(/\s+/g, "_")}-${Date.now()}.pdf`;
    const outPath = path.resolve("uploads", fileName);

    const doc = new PDFDocument({ margin: 60 });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    doc.font("Helvetica").fontSize(11).text(letter, { align: "left", lineGap: 4 });
    doc.end();

    stream.on("finish", () => {
      res.download(outPath, fileName, (err) => {
        if (!err) fs.unlink(outPath, () => {});
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
