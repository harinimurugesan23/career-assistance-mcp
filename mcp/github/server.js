#!/usr/bin/env node
/**
 * GitHub MCP Server
 * ------------------
 * The standout feature: instead of trusting resume claims at face value, the AI can call
 * "Review my GitHub profile" and get real evidence — repos, languages, READMEs, recent commits —
 * to cross-check against what the resume says. E.g. resume says "React" but GitHub shows only
 * one small React repo -> AI flags it and suggests strengthening that evidence.
 *
 * Exposes:
 *   - list_repositories(username)              -> non-fork repos with language/stars/updated
 *   - get_repo_languages(username, repo)       -> language breakdown for one repo
 *   - get_readme(username, repo)               -> README content for one repo
 *   - get_recent_commit_activity(username, repo, limit?) -> recent commit messages/dates
 *
 * Auth: set GITHUB_TOKEN in the environment (a token with public_repo / repo:read scope)
 * to avoid GitHub's low unauthenticated rate limits.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const GITHUB_API = "https://api.github.com";

async function gh(endpoint, { raw = false } = {}) {
  const headers = { Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`${GITHUB_API}${endpoint}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${endpoint}: ${await res.text()}`);
  }
  return raw ? res.text() : res.json();
}

const server = new McpServer({
  name: "github-review-mcp",
  version: "1.0.0",
});

server.tool(
  "list_repositories",
  "Lists a GitHub user's non-fork repositories with language, stars, description, and last update date.",
  { username: z.string().describe("GitHub username") },
  async ({ username }) => {
    try {
      const repos = await gh(`/users/${username}/repos?sort=updated&per_page=20`);
      const summary = repos
        .filter((r) => !r.fork)
        .map(
          (r) =>
            `- ${r.name} [${r.language || "n/a"}] ⭐${r.stargazers_count} — ${r.description || "no description"} (updated ${r.updated_at?.slice(0, 10)})`
        )
        .join("\n");
      return {
        content: [{ type: "text", text: summary || `No public non-fork repositories found for ${username}.` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

server.tool(
  "get_repo_languages",
  "Returns the language breakdown (bytes of code per language) for a specific repository.",
  {
    username: z.string().describe("GitHub username"),
    repo: z.string().describe("Repository name"),
  },
  async ({ username, repo }) => {
    try {
      const langs = await gh(`/repos/${username}/${repo}/languages`);
      const text = Object.entries(langs)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
        .join("\n");
      return { content: [{ type: "text", text: text || "No language data available." }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

server.tool(
  "get_readme",
  "Fetches the README content for a specific repository, useful for understanding what a project actually does.",
  {
    username: z.string().describe("GitHub username"),
    repo: z.string().describe("Repository name"),
  },
  async ({ username, repo }) => {
    try {
      const readme = await gh(`/repos/${username}/${repo}/readme`, { raw: true });
      return { content: [{ type: "text", text: readme.slice(0, 6000) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

server.tool(
  "get_recent_commit_activity",
  "Lists recent commit messages and dates for a repository, as a signal of real, ongoing work.",
  {
    username: z.string().describe("GitHub username"),
    repo: z.string().describe("Repository name"),
    limit: z.number().optional().describe("Max commits to return (default 10)"),
  },
  async ({ username, repo, limit }) => {
    try {
      const commits = await gh(`/repos/${username}/${repo}/commits?per_page=${limit || 10}`);
      const text = commits
        .map((c) => `- ${c.commit.author.date.slice(0, 10)}: ${c.commit.message.split("\n")[0]}`)
        .join("\n");
      return { content: [{ type: "text", text: text || "No commits found." }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
