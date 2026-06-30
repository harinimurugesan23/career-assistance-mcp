import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import { chatComplete, parseJsonSafe } from "../utils/aiClient.js";

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-friendly, achievement-driven bullet points
for software engineering resumes. You rewrite weak, vague bullet points into strong, specific,
metrics-aware bullet points using powerful action verbs, without inventing false metrics.
If no metric is given, use qualitative impact language instead of fake numbers.
Always respond ONLY with valid JSON, no markdown, matching this exact shape:
{
  "rewrites": [
    { "original": "<string>", "improved": "<string>", "reason": "<short string explaining the change>" }
  ],
  "generalTips": [<string>, ...]
}`;

// Accepts either a full resume (resumeId) or a single ad-hoc bullet/line of text.
export async function getSuggestions(req, res) {
  try {
    const { resumeId, lines } = req.body;
    let textToImprove = "";

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
      if (!resume) return res.status(404).json({ message: "Resume not found" });
      textToImprove = resume.extractedText;
    } else if (Array.isArray(lines) && lines.length) {
      textToImprove = lines.join("\n");
    } else {
      return res.status(400).json({ message: "Provide either resumeId or lines[]" });
    }

    const userPrompt = `Improve the bullet points / experience lines below. For each weak or vague line you find
(e.g. "Developed website."), rewrite it to be specific, ATS-friendly, and impact-driven. Also fix grammar
and weak action verbs. Return at most 10 of the most impactful rewrites.

TEXT:
"""
${textToImprove}
"""`;

    const raw = await chatComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { json: true, temperature: 0.5 }
    );

    const result = parseJsonSafe(raw);

    if (resumeId) {
      await Analysis.create({
        user: req.userId,
        resume: resumeId,
        type: "suggestions",
        result,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
