import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|\.be\/)([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export default function Library() {
  const { profile } = useAuth();
  const isTrainer = profile?.role === "trainer";
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Beine", youtube_url: "" });
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alle");
  const CATEGORIES = ["Beine", "Brust", "Rücken", "Schulter", "Arme", "Bauch", "Ganzkörper"];

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("exercises").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setExercises(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addExercise = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("exercises").insert({
      trainer_id: profile.id,
      name: form.name,
      category: form.category,
      youtube_url: form.youtube_url || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ name: "", category: "Beine", youtube_url: "" });
    setShowForm(false);
    load();
  };

  const inviteLink = `${window.location.origin}${window.location.pathname}?view=signup-client&trainer=${profile?.id}`;

  return (
    <div className="page">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Übungsbibliothek</div>
      <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 20 }}>
        Eingeloggt als {profile?.name} ({isTrainer ? "Trainer" : "Klient"})
      </div>

      {isTrainer && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label">Einladungslink für Klienten</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", wordBreak: "break-all", marginBottom: 8 }}>
            {inviteLink}
          </div>
          <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(inviteLink)}>Link kopieren</button>
        </div>
      )}

      {error && <div style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <input placeholder="Übung suchen…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        {["Alle", ...CATEGORIES].map((cat) => (
          <button
            key={cat} onClick={() => setActiveCategory(cat)}
            className={activeCategory === cat ? "btn-primary" : "btn-ghost"}
            style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-faint)" }}>Lädt…</div>
      ) : (
        <div className="stack">
          {(() => {
            const filtered = exercises
              .filter((ex) => ex.name.toLowerCase().includes(query.toLowerCase()))
              .filter((ex) => activeCategory === "Alle" || ex.category === activeCategory);
            if (filtered.length === 0) {
              return <div style={{ color: "var(--text-faint)", fontSize: 14 }}>{exercises.length === 0 ? "Noch keine Übungen." : "Keine Übung gefunden."}</div>;
            }
            return filtered.map((ex) => {
              const vid = ytId(ex.youtube_url);
              return (
                <div key={ex.id} className="card" style={{ display: "flex", gap: 12 }}>
                  {vid ? (
                    <a href={ex.youtube_url} target="_blank" rel="noreferrer" style={{ width: 80, height: 50, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                  ) : (
                    <div style={{ width: 80, height: 50, background: "var(--surface2)", borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.name}</div>
                    <div style={{ background: "var(--brass-soft)", color: "var(--brass)", fontSize: 10, borderRadius: 20, padding: "2px 8px", display: "inline-block", marginTop: 4 }}>
                      {ex.category}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {isTrainer && (
        <div style={{ marginTop: 16 }}>
          {!showForm ? (
            <button className="btn-ghost" style={{ width: "100%" }} onClick={() => setShowForm(true)}>+ Übung erstellen</button>
          ) : (
            <form onSubmit={addExercise} className="card stack">
              <input placeholder="Name der Übung" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="YouTube-Link (optional)" value={form.youtube_url} onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Abbrechen</button>
                <button className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? "Speichert…" : "Speichern"}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
