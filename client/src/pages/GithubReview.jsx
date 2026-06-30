import { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, PageHeader, Button, ResumeSelect } from "../components/ui.jsx";

export default function GithubReview() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data));
  }, []);

  async function handleReview() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/github/review", { resumeId, githubUsername });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Review failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="GitHub Profile Review"
        subtitle="Cross-checks resume claims against real evidence from your public repositories — the same logic exposed via the GitHub MCP server."
      />

      <Card className="mb-6 space-y-3">
        <ResumeSelect resumes={resumes} value={resumeId} onChange={setResumeId} />
        <input
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="GitHub username"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <Button onClick={handleReview} loading={loading} disabled={!resumeId || !githubUsername.trim()}>
          Review
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </Card>

      {result && (
        <Card>
          <h3 className="text-sm font-semibold text-green-700 mb-1">Aligned skills</h3>
          <ul className="text-sm space-y-1 mb-4">
            {result.alignedSkills.map((s, i) => (
              <li key={i}>✔ {s}</li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold text-amber-700 mb-1">Mismatches</h3>
          <ul className="text-sm space-y-1 mb-4">
            {result.mismatches.map((s, i) => (
              <li key={i}>⚠ {s}</li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold mb-1">Recommendations</h3>
          <ul className="text-sm space-y-1 mb-4">
            {result.recommendations.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>

          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Raw GitHub snapshot used</summary>
            <pre className="whitespace-pre-wrap mt-2">
              {JSON.stringify(result.snapshot, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}
