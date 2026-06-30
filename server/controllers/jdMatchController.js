import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import { chatComplete, parseJsonSafe } from "../utils/aiClient.js";

const SYSTEM_PROMPT = `You are an ATS matching engine and technical recruiter. Compare a candidate's resume
against a target job description. Extract the key required skills/keywords from the JD, check which are
present or absent in the resume, and compute a realistic match percentage.
Always respond ONLY with valid JSON, no markdown, matching this exact shape:
{
  "matchPercent": <integer 0-100>,
  "matchedSkills": [<string>, ...],
  "missingSkills": [<string>, ...],
  "suggestions": [<string>, ...]
}`;

export async function matchJobDescription(req, res) {
  try {
    const { resumeId, jobDescription } = req.body;
    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: "resumeId and jobDescription are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const userPrompt = `RESUME:
"""
${resume.extractedText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Compare them and return matchPercent, matchedSkills, missingSkills, and concrete suggestions
(e.g. "Add experience with Git, Docker, and automated testing.").`;

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
      type: "jd_match",
      jobDescription,
      result,
    });

    res.json({ analysisId: analysis._id, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
