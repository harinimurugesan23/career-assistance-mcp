import { useEffect, useState } from "react";
import api from "../api.js";
import { Card, PageHeader, Button, ResumeSelect } from "../components/ui.jsx";

export default function AtsScore() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Entry-level Software Engineer");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data));
  }, []);

  useEffect(() => {
    if (resumeId) {
      api.get(`/ats/history/${resumeId}`).then(({ data }) => setHistory(data));
    }
  }, [resumeId, result]);

  async function handleAnalyze() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/ats", { resumeId, targetRole });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="ATS Score"
        subtitle="The AI evaluates your resume for a target role — no hardcoded keyword lists."
      />

      <Card className="mb-6 space-y-3">
        <ResumeSelect resumes={resumes} value={resumeId} onChange={setResumeId} />
        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role, e.g. Entry-level Software Engineer"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <Button onClick={handleAnalyze} loading={loading} disabled={!resumeId || !targetRole}>
          Analyze
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </Card>

      {result && (
        <Card className="mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-brand-700">{result.atsScore}</span>
            <span className="text-slate-400">/ 100</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">{result.summary}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-1">Strengths</h3>
              <ul className="text-sm space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i}>✔ {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-1">Missing</h3>
              <ul className="text-sm space-y-1">
                {result.missingSkills.map((s, i) => (
                  <li key={i}>✘ {s}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.weaknesses?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-amber-700 mb-1">Weaknesses</h3>
              <ul className="text-sm space-y-1">
                {result.weaknesses.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-3">Score history for this resume</h2>
          <ul className="text-sm space-y-1">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {new Date(h.date).toLocaleDateString()} — {h.targetRole}
                </span>
                <span className="font-medium">{h.atsScore}/100</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
