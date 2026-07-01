import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const CAT_LABELS = { food_protein: "Protein-Quellen", food_carbs: "Kohlenhydrat-Quellen", food_fat: "Fett-Quellen" };
const CAT_LABELS_CLIENT = {
  food_protein: "Protein hauptsächlich aus",
  food_carbs: "Kohlenhydrate hauptsächlich aus",
  food_fat: "Fett hauptsächlich aus",
};

function emptyTarget(clientId) {
  return {
    client_id: clientId, kcal_target: "", protein_target: "", carbs_target: "", fat_target: "",
    notes: "", food_protein: [], food_carbs: [], food_fat: [],
  };
}

export default function Nutrition() {
  const { profile } = useAuth();
  const isTrainer = profile.role === "trainer";

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(isTrainer ? null : profile.id);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newFood, setNewFood] = useState({ food_protein: "", food_carbs: "", food_fat: "" });

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
    const { data, error } = await supabase.from("nutrition_targets").select("*").eq("client_id", clientId).maybeSingle();
    if (error) setError(error.message);
    setTarget(data || emptyTarget(clientId));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const save = async (patch) => {
    const next = { ...target, ...patch };
    setTarget(next);
    setSaving(true);
    const { error } = await supabase.from("nutrition_targets").upsert(
      {
        client_id: clientId,
        kcal_target: next.kcal_target || null,
        protein_target: next.protein_target || null,
        carbs_target: next.carbs_target || null,
        fat_target: next.fat_target || null,
        notes: next.notes || null,
        food_protein: next.food_protein,
        food_carbs: next.food_carbs,
        food_fat: next.food_fat,
      },
      { onConflict: "client_id" }
    );
    setSaving(false);
    if (error) setError(error.message);
  };

  const addFood = (cat) => {
    const v = newFood[cat].trim();
    if (!v) return;
    save({ [cat]: [...(target[cat] || []), v] });
    setNewFood((f) => ({ ...f, [cat]: "" }));
  };

  const removeFood = (cat, idx) => {
    save({ [cat]: target[cat].filter((_, i) => i !== idx) });
  };

  if (loading || !target) {
    return <div className="page"><div style={{ color: "var(--text-faint)" }}>Lädt…</div></div>;
  }

  if (isTrainer) {
    return (
      <div className="page">
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Ernährung</div>
        {clients.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {clients.map((c) => (
              <button key={c.id} className={c.id === clientId ? "btn-primary" : "btn-ghost"} style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setClientId(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {clients.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 13, marginBottom: 12 }}>Noch kein Klient registriert.</div>}
        {error && <div style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {clientId && (
          <div className="stack">
            <div className="card">
              <div className="label">Makro-Vorgabe {saving && "(speichert…)"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "kcal_target", label: "Kalorien (kcal)" },
                  { key: "protein_target", label: "Protein (g)" },
                  { key: "carbs_target", label: "Kohlenhydrate (g)" },
                  { key: "fat_target", label: "Fett (g)" },
                ].map((f) => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 4 }}>{f.label}</div>
                    <input
                      type="number" value={target[f.key] || ""}
                      onChange={(e) => setTarget((t) => ({ ...t, [f.key]: e.target.value }))}
                      onBlur={() => save({ [f.key]: target[f.key] })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="label">Allgemeine Hinweise</div>
              <textarea
                rows={3} value={target.notes || ""}
                onChange={(e) => setTarget((t) => ({ ...t, notes: e.target.value }))}
                onBlur={() => save({ notes: target.notes })}
              />
            </div>

            {Object.keys(CAT_LABELS).map((cat) => (
              <div key={cat} className="card">
                <div className="label">{CAT_LABELS[cat]} (~80% der Ernährung)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {(target[cat] || []).map((item, i) => (
                    <span key={i} style={{ background: "var(--brass-soft)", color: "var(--brass)", fontSize: 12, borderRadius: 20, padding: "4px 6px 4px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {item}
                      <button onClick={() => removeFood(cat, i)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newFood[cat]} onChange={(e) => setNewFood((f) => ({ ...f, [cat]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addFood(cat)}
                    placeholder="Lebensmittel hinzufügen…"
                  />
                  <button className="btn-ghost" onClick={() => addFood(cat)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Klienten-Ansicht
  return (
    <div className="page">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Ernährung</div>
      <div className="stack">
        <div className="card">
          <div className="label">Deine Makro-Vorgabe</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "kcal_target", label: "Kalorien", unit: "kcal" },
              { key: "protein_target", label: "Protein", unit: "g" },
              { key: "carbs_target", label: "Kohlenhydrate", unit: "g" },
              { key: "fat_target", label: "Fett", unit: "g" },
            ].map((f) => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{f.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brass)" }}>
                  {target[f.key] || "–"} <span style={{ fontSize: 12, fontWeight: 500 }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="label">Worauf du achten solltest</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{target.notes || "Noch keine Hinweise hinterlegt."}</div>
        </div>

        {Object.keys(CAT_LABELS_CLIENT).map((cat) => (
          <div key={cat} className="card">
            <div className="label">{CAT_LABELS_CLIENT[cat]}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(target[cat] || []).length === 0 && <span style={{ color: "var(--text-faint)", fontSize: 13 }}>–</span>}
              {(target[cat] || []).map((item, i) => (
                <span key={i} style={{ background: "var(--brass-soft)", color: "var(--brass)", fontSize: 12, borderRadius: 20, padding: "4px 10px" }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
