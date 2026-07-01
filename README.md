# AI Resume Intelligence Platform – MERN Stack with MCP

An AI-powered resume analysis platform with genuine MCP (Model Context Protocol) integration —
not just "I used MCP" name-dropping. Two real MCP servers expose tools an AI client can call
directly: one reads resumes off your local filesystem, the other cross-checks resume claims
against actual GitHub activity.
Live url : https://career-assistant-wo6y.onrender.com
## What it does

| Module | Feature |
|---|---|
| 1 | Upload PDF/DOCX resumes, extract text (`pdf-parse`, `mammoth`), store in MongoDB |
| 2 | AI-evaluated ATS score (no hardcoded keyword lists) with history tracking per resume |
| 3 | AI rewrites weak bullet points into specific, ATS-friendly, achievement-driven lines |
| 4 | Paste a job description, get a match %, missing skills, and concrete suggestions |
| 6 | Generate a tailored cover letter from resume + JD + company name; copy or download as PDF |
| MCP 1 | **Filesystem MCP** — "Analyze Resume.pdf" reads the file straight off disk, no re-upload |
| MCP 2 | **GitHub MCP** — "Review my GitHub profile" pulls real repos/READMEs/commits as evidence |
| MCP 3 | **File Resources** — resume exposed as a stable `resume://filename` resource so the AI references it across a session instead of resending full text every call |

## Folder structure

```
career-assistant/
  client/           React + Vite + Tailwind frontend
    src/
      components/
      pages/
      context/
  server/           Node/Express/MongoDB backend
    routes/
    controllers/
    models/
    middleware/
    utils/
  mcp/              Standalone MCP servers (separate from the web app)
    filesystem/     MCP Server 1 + 3 (tools + resource)
    github/         MCP Server 2 (tools)
  uploads/          Uploaded resumes + temp generated PDFs
```

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, AI_PROVIDER, and the matching API key
npm run dev
```

AI provider is pluggable — set `AI_PROVIDER=groq` or `AI_PROVIDER=openrouter` in `.env`.
Both have free tiers:
- Groq keys: https://console.groq.com/keys
- OpenRouter keys: https://openrouter.ai/keys (use a `:free` model id)

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Visit http://localhost:5173. The Vite dev server proxies `/api` to the backend on port 5000.

### 3. MCP servers (optional, for use with Claude Desktop or any MCP client)

```bash
cd mcp
npm install
```

Add to your MCP client config (see `mcp/claude_desktop_config.example.json`):

```json
{
  "mcpServers": {
    "resume-filesystem": {
      "command": "node",
      "args": ["mcp/filesystem/server.js"],
      "env": { "RESUME_WATCH_DIR": "/path/to/your/Desktop" }
    },
    "github-review": {
      "command": "node",
      "args": ["mcp/github/server.js"],
      "env": { "GITHUB_TOKEN": "your_github_personal_access_token" }
    }
  }
}
```

Then in Claude Desktop you can say "Analyze Resume.pdf" or "Review my GitHub profile @username"
and the AI calls these tools directly instead of you pasting text in manually.

## Why the MCP servers are genuine (not decorative)

- **Filesystem MCP** removes the upload step entirely for local-first workflows — the AI reads
  the file where it already lives, with path-traversal protection so it can only read inside the
  configured directory.
- **GitHub MCP** gives the AI independent, falsifiable evidence to check resume claims against —
  it can catch "resume says React, GitHub shows one toy project" mismatches that a resume-only
  read could never catch.
- **File Resources** avoid re-sending the full resume text on every single tool call within a
  session, which matters once a resume is a few thousand tokens and you're calling multiple tools
  back to back.

The same GitHub cross-check logic also exists as a normal REST endpoint
(`POST /api/github/review`) so the web app has the feature too, independent of whether the user's
AI client supports MCP.
