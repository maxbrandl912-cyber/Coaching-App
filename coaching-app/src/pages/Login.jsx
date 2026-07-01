import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ goTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="page">
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Anmelden</div>
      <div style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Coaching App
      </div>
      <form onSubmit={submit} className="stack">
        <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ color: "var(--terracotta)", fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Einen Moment…" : "Einloggen"}
        </button>
      </form>
      <div style={{ marginTop: 20, fontSize: 13, color: "var(--text-dim)" }}>
        Noch keinen Account?{" "}
        <a href="#" onClick={() => goTo("signup-trainer")} style={{ color: "var(--brass)" }}>
          Als Trainer registrieren
        </a>
      </div>
    </div>
  );
}
