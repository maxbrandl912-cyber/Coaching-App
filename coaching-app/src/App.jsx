import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SignupTrainer from "./pages/SignupTrainer";
import SignupClient from "./pages/SignupClient";
import Library from "./pages/Library";
import TrainingPlan from "./pages/TrainingPlan";
import Weight from "./pages/Weight";
import Nutrition from "./pages/Nutrition";
import Chat from "./pages/Chat";

const NAV = [
  { key: "library", label: "Bibliothek" },
  { key: "training", label: "Training" },
  { key: "weight", label: "Gewicht" },
  { key: "nutrition", label: "Ernährung" },
  { key: "chat", label: "Chat" },
];

function Inner() {
  const { session, profile, loading, signOut } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const initialView = params.get("view") === "signup-client" ? "signup-client" : "login";
  const [view, setView] = useState(initialView);
  const [page, setPage] = useState("library");

  if (loading) {
    return <div className="page">Lädt…</div>;
  }

  if (!session || !profile) {
    if (view === "signup-trainer") return <SignupTrainer goTo={setView} />;
    if (view === "signup-client") return <SignupClient goTo={setView} />;
    return <Login goTo={setView} />;
  }

  const pages = {
    library: <Library />,
    training: <TrainingPlan />,
    weight: <Weight />,
    nutrition: <Nutrition />,
    chat: <Chat />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1, paddingBottom: 70 }}>{pages[page]}</div>

      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(20,22,26,0.95)", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-around", padding: "10px 4px",
        }}
      >
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            style={{
              background: "none", border: "none", color: page === item.key ? "var(--brass)" : "var(--text-faint)",
              fontSize: 11, fontWeight: page === item.key ? 600 : 400, padding: "4px 6px",
            }}
          >
            {item.label}
          </button>
        ))}
        <button onClick={signOut} style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 11 }}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
