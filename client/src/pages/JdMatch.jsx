import { useEffect, useState } from "react";
import api from "../api.js";
import { Card, PageHeader, Button, ResumeSelect } from "../components/ui.jsx";

export default function JdMatch() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data));
  }, []);

  async function handleMatch() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/jd-match", { resumeId, jobDescription });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Matching failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Job Description Match"
        subtitle="Paste a job description to see how well your resume matches and what's missing."
      />

      <Card className="mb-6 space-y-3">
        <ResumeSelect resumes={resumes} value={resumeId} onChange={setResumeId} />
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <Button onClick={handleMatch} loading={loading} disabled={!resumeId || !jobDescription.trim()}>
          Match
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </Card>

      {result && (
        <Card>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-brand-700">{result.matchPercent}%</span>
            <span className="text-slate-400">match</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-1">Matched</h3>
              <ul className="text-sm space-y-1">
                {result.matchedSkills.map((s, i) => (
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

          <h3 className="text-sm font-semibold mb-1">Suggestions</h3>
          <ul className="text-sm space-y-1">
            {result.suggestions.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
