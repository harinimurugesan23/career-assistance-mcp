import { useEffect, useState } from "react";
import api from "../api.js";
import { Card, PageHeader, Button } from "../components/ui.jsx";

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadResumes() {
    const { data } = await api.get("/resumes");
    setResumes(data);
  }

  useEffect(() => {
    loadResumes();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const { data } = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`Uploaded "${data.originalName}" — extracted ${data.charCount} characters.`);
      setFile(null);
      loadResumes();
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Your resumes"
        subtitle="Upload a PDF or DOCX resume. Text is extracted automatically and stored so every other module can use it."
      />

      <Card className="mb-6">
        <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm flex-1"
          />
          <Button type="submit" loading={uploading} disabled={!file}>
            Upload
          </Button>
        </form>
        {message && <p className="text-sm text-slate-600 mt-3">{message}</p>}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Uploaded resumes</h2>
        {resumes.length === 0 ? (
          <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {resumes.map((r) => (
              <li key={r._id} className="py-2 flex justify-between text-sm">
                <span>{r.originalName}</span>
                <span className="text-slate-400 uppercase text-xs">{r.fileType}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
