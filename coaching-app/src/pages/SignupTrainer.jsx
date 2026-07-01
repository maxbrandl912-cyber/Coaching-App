import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SignupTrainer({ goTo }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "trainer", name } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setDone(true);
  };

  if (done) {
    return (
      <div className="page">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Fast geschafft!</div>
          <div style={{ color: "var(--text-dim)", fontSize: 14 }}>
            Je nach Projekteinstellung musst du noch die Bestätigungs-E-Mail öffnen. Danach kannst du dich einloggen.
          </div>
          <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => goTo("login")}>Zum Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Trainer-Account erstellen</div>
      <div style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Damit verwaltest du später deine Klienten.
      </div>
      <form onSubmit={submit} className="stack">
        <input placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Passwort (mind. 6 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <div style={{ color: "var(--terracotta)", fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Einen Moment…" : "Registrieren"}
        </button>
      </form>
      <div style={{ marginTop: 20, fontSize: 13, color: "var(--text-dim)" }}>
        Schon einen Account?{" "}
        <a href="#" onClick={() => goTo("login")} style={{ color: "var(--brass)" }}>
          Einloggen
        </a>
      </div>
    </div>
  );
}
