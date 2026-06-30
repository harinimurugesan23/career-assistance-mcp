import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import { chatComplete, parseJsonSafe } from "../utils/aiClient.js";

const SYSTEM_PROMPT = `You are an expert technical recruiter and ATS (Applicant Tracking System) evaluator.
You analyze resumes strictly and realistically for the target role given.
Always respond ONLY with valid JSON, no markdown, no commentary, matching this exact shape:
{
  "atsScore": <integer 0-100>,
  "strengths": [<string>, ...],
  "missingSkills": [<string>, ...],
  "weaknesses": [<string>, ...],
  "summary": "<2-3 sentence overall assessment>"
}`;

export async function getAtsScore(req, res) {
  try {
    const { resumeId, targetRole } = req.body;
    if (!resumeId || !targetRole) {
      return res.status(400).json({ message: "resumeId and targetRole are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const userPrompt = `Analyze this resume for a "${targetRole}" role.

RESUME:
"""
${resume.extractedText}
"""

Return the ATS score, strengths, missing skills, and weaknesses as specified.`;

    const raw = await chatComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { json: true, temperature: 0.3 }
    );

    const result = parseJsonSafe(raw);

    const analysis = await Analysis.create({
      user: req.userId,
      resume: resume._id,
      type: "ats_score",
      targetRole,
      result,
    });

    res.json({ analysisId: analysis._id, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Module 2 cont. - history so users can track improvements over time
export async function getAtsHistory(req, res) {
  try {
    const { resumeId } = req.params;
    const history = await Analysis.find({
      user: req.userId,
      resume: resumeId,
      type: "ats_score",
    }).sort({ createdAt: 1 });

    res.json(
      history.map((h) => ({
        date: h.createdAt,
        targetRole: h.targetRole,
        atsScore: h.result.atsScore,
        summary: h.result.summary,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
