import { useEffect, useState } from "react";
import api from "../api.js";
import { Card, PageHeader, Button, ResumeSelect } from "../components/ui.jsx";

export default function CoverLetter() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data));
  }, []);

  async function handleGenerate() {
    setError("");
    setLoading(true);
    setLetter("");
    try {
      const { data } = await api.post("/cover-letter", {
        resumeId,
        jobDescription,
        companyName,
        roleTitle,
      });
      setLetter(data.letter);
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadPdf() {
    const res = await api.post(
      "/cover-letter/pdf",
      { letter, companyName },
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${companyName || "company"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Cover Letter Generator"
        subtitle="Generates a tailored cover letter from your resume, the job description, and the company name."
      />

      <Card className="mb-6 space-y-3">
        <ResumeSelect resumes={resumes} value={resumeId} onChange={setResumeId} />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role title"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <Button
          onClick={handleGenerate}
          loading={loading}
          disabled={!resumeId || !jobDescription.trim() || !companyName.trim()}
        >
          Generate
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </Card>

      {letter && (
        <Card>
          <pre className="whitespace-pre-wrap text-sm font-sans mb-4">{letter}</pre>
          <div className="flex gap-2">
            <Button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
            <Button onClick={handleDownloadPdf}>Download PDF</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
