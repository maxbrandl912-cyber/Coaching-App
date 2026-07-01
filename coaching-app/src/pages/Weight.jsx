import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { todayISO, fmtDate } from "../lib/utils";

function startOfWeekISO(iso) {
  const d = new Date(iso + "T00:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function weeklyAverages(logs) {
  const groups = {};
  logs.forEach((l) => {
    const key = startOfWeekISO(l.logged_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(Number(l.weight));
  });
  return Object.entries(groups)
    .map(([weekStart, weights]) => ({
      weekStart,
      avg: weights.reduce((a, b) => a + b, 0) / weights.length,
      count: weights.length,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export default function Weight() {
  const { profile } = useAuth();
  const isTrainer = profile.role === "trainer";

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(isTrainer ? null : profile.id);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isTrainer) return;
    supabase.from("profiles").select("*").eq("role", "client").then(({ data, error }) => {
      if (error) { setError(error.message); return; }
      setClients(data);
      if (data.length > 0) setClientId((c) => c || data[0].id);
    });
  }, [isTrainer]);

  const load = async () => {
    if (!clientId) return;
    setLoading(true);
    const { data, error } = await supabase.from("weight_logs").select("*").eq("client_id", clientId).order("logged_at");
    if (error) setError(error.message);
    else setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const logWeight = async () => {
    const w = parseFloat(input.replace(",", "."));
    if (!w) return;
    setSaving(true);
    const { error } = await supabase
      .from("weight_logs")
      .upsert({ client_id: clientId, logged_at: todayISO(), weight: w }, { onConflict: "client_id,logged_at" });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setInput("");
    load();
  };

  const loggedToday = logs.some((l) => l.logged_at === todayISO());
  const weeks = weeklyAverages(logs);
  const currentWeek = weeks[weeks.length - 1];
  const prevWeek = weeks[weeks.length - 2];
  const weekDelta = currentWeek && prevWeek ? currentWeek.avg - prevWeek.avg : null;

  return (
    <div className="page">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Gewicht</div>

      {isTrainer && clients.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {clients.map((c) => (
            <button key={c.id} className={c.id === clientId ? "btn-primary" : "btn-ghost"} style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setClientId(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {isTrainer && clients.length === 0 && (
        <div style={{ color: "var(--text-faint)", fontSize: 13, marginBottom: 12 }}>
          Noch kein Klient registriert.
        </div>
      )}

      {error && <div style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ color: "var(--text-faint)" }}>Lädt…</div>
      ) : (
        <div className="stack">
          <div className="card">
            <div className="label">Wochendurchschnitt</div>
            {currentWeek ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: "var(--brass)" }}>{currentWeek.avg.toFixed(1)}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>kg · {currentWeek.count} {currentWeek.count === 1 ? "Eintrag" : "Einträge"}</span>
                {weekDelta !== null && (
                  <span style={{ marginLeft: "auto", fontSize: 12, color: weekDelta <= 0 ? "var(--sage)" : "var(--terracotta)" }}>
                    {weekDelta <= 0 ? "↓" : "↑"} {Math.abs(weekDelta).toFixed(1)} kg ggü. Vorwoche
                  </span>
                )}
              </div>
            ) : (
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Noch keine Einträge.</div>
            )}
          </div>

          {!isTrainer && (
            <div className="card">
              <div className="label">Heute eintragen</div>
              <div style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 8 }}>
                Bitte jeden Morgen eintragen, am besten direkt nach dem Aufstehen.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="z. B. 66.8" />
                <button className="btn-primary" onClick={logWeight} disabled={saving}>
                  {saving ? "…" : loggedToday ? "Aktualisieren" : "Eintragen"}
                </button>
              </div>
              {loggedToday && <div style={{ color: "var(--sage)", fontSize: 12, marginTop: 8 }}>✓ Heute schon eingetragen</div>}
            </div>
          )}

          <div className="card">
            <div className="label">Verlauf</div>
            {logs.length === 0 ? (
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Noch keine Einträge.</div>
            ) : (
              <div className="stack">
                {[...logs].reverse().slice(0, 14).map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-dim)" }}>{fmtDate(l.logged_at)}</span>
                    <span style={{ fontWeight: 600 }}>{l.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {weeks.length > 1 && (
            <div className="card">
              <div className="label">Wochen im Überblick</div>
              <div className="stack">
                {weeks.slice(-6).reverse().map((w) => (
                  <div key={w.weekStart} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-dim)" }}>ab {fmtDate(w.weekStart)}</span>
                    <span style={{ fontWeight: 600 }}>{w.avg.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
