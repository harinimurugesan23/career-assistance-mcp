import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/ats", label: "ATS Score" },
  { to: "/suggestions", label: "Suggestions" },
  { to: "/jd-match", label: "JD Match" },
  { to: "/cover-letter", label: "Cover Letter" },
  { to: "/github-review", label: "GitHub Review" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-brand-700">ResumeGPT</span>
        <div className="flex gap-1 flex-wrap">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm px-3 py-1.5 rounded-md text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-sm px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
