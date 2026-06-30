import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AtsScore from "./pages/AtsScore.jsx";
import Suggestions from "./pages/Suggestions.jsx";
import JdMatch from "./pages/JdMatch.jsx";
import CoverLetter from "./pages/CoverLetter.jsx";
import GithubReview from "./pages/GithubReview.jsx";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/ats"
          element={
            <Protected>
              <AtsScore />
            </Protected>
          }
        />
        <Route
          path="/suggestions"
          element={
            <Protected>
              <Suggestions />
            </Protected>
          }
        />
        <Route
          path="/jd-match"
          element={
            <Protected>
              <JdMatch />
            </Protected>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <Protected>
              <CoverLetter />
            </Protected>
          }
        />
        <Route
          path="/github-review"
          element={
            <Protected>
              <GithubReview />
            </Protected>
          }
        />
      </Routes>
    </>
  );
}
