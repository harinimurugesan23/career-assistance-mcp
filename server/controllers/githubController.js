import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import { chatComplete, parseJsonSafe } from "../utils/aiClient.js";

const GITHUB_API = "https://api.github.com";

async function ghFetch(endpoint) {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${GITHUB_API}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error ${res.status} for ${endpoint}`);
  return res.json();
}

/**
 * Pulls a lightweight profile snapshot: top repos, languages used, and README presence.
 * This mirrors what the GitHub MCP server exposes as a tool, so the same logic
 * can be reused whether called from this REST endpoint or from the MCP server.
 */
export async function buildGithubSnapshot(username) {
  const repos = await ghFetch(`/users/${username}/repos?sort=updated&per_page=10`);

  const languageCounts = {};
  const repoSummaries = [];

  for (const repo of repos.filter((r) => !r.fork).slice(0, 8)) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
    repoSummaries.push({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    });
  }

  return {
    username,
    topLanguages: Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang),
    repoSummaries,
  };
}

const SYSTEM_PROMPT = `You are a technical recruiter cross-referencing a candidate's resume claims against
their actual GitHub activity. Identify mismatches (skills claimed but not evidenced in repos) and
genuine strengths (skills well-evidenced by repos). Be specific and reference repo names where useful.
Always respond ONLY with valid JSON, no markdown, matching this exact shape:
{
  "alignedSkills": [<string>, ...],
  "mismatches": [<string>, ...],
  "recommendations": [<string>, ...]
}`;

export async function reviewGithubProfile(req, res) {
  try {
    const { resumeId, githubUsername } = req.body;
    if (!resumeId || !githubUsername) {
      return res.status(400).json({ message: "resumeId and githubUsername are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const snapshot = await buildGithubSnapshot(githubUsername);

    const userPrompt = `RESUME:
"""
${resume.extractedText}
"""

GITHUB SNAPSHOT for @${githubUsername}:
Top languages: ${snapshot.topLanguages.join(", ") || "none detected"}
Repositories:
${snapshot.repoSummaries
  .map((r) => `- ${r.name} (${r.language || "unknown"}): ${r.description || "no description"}`)
  .join("\n")}

Cross-check resume claims against this GitHub evidence.`;

    const raw = await chatComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { json: true, temperature: 0.3 }
    );

    const result = parseJsonSafe(raw);

    await Analysis.create({
      user: req.userId,
      resume: resume._id,
      type: "github_review",
      result: { ...result, snapshot },
    });

    res.json({ snapshot, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
