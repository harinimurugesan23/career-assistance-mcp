import { useEffect, useState } from "react";
import api from "../api.js";
import { Card, PageHeader, Button, ResumeSelect } from "../components/ui.jsx";

export default function Suggestions() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [adhocText, setAdhocText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data));
  }, []);

  async function handleImprove() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const payload = adhocText.trim()
        ? { lines: adhocText.split("\n").filter(Boolean) }
        : { resumeId };
      const { data } = await api.post("/suggestions", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate suggestions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="AI Suggestions"
        subtitle="Rewrites weak bullet points into specific, ATS-friendly, achievement-driven lines."
      />

      <Card className="mb-6 space-y-3">
        <ResumeSelect resumes={resumes} value={resumeId} onChange={setResumeId} />
        <p className="text-xs text-slate-400">— or paste specific lines instead —</p>
        <textarea
          rows={4}
          value={adhocText}
          onChange={(e) => setAdhocText(e.target.value)}
          placeholder={"Developed website.\nWorked on backend APIs."}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <Button onClick={handleImprove} loading={loading} disabled={!resumeId && !adhocText.trim()}>
          Improve
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </Card>

      {result && (
        <div className="space-y-4">
          {result.rewrites.map((r, i) => (
            <Card key={i}>
              <p className="text-sm text-slate-400 line-through mb-1">{r.original}</p>
              <p className="text-sm font-medium text-slate-900 mb-2">{r.improved}</p>
              <p className="text-xs text-brand-600">{r.reason}</p>
            </Card>
          ))}
          {result.generalTips?.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-2 text-sm">General tips</h3>
              <ul className="text-sm space-y-1">
                {result.generalTips.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
