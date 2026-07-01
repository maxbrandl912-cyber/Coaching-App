import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { DAYS, DAY_LABELS, LETTERS, todayKey, todayISO, fmtDate, weekStartISO, weekEndISO, fmtWeek, isoWeekNumber } from "../lib/utils";

// ---------- BlockCard ----------
function BlockCard({ block, isTrainer, results, onRemove, onAddExerciseResult, onAddFreetextResult }) {
  const [logging, setLogging] = useState(false);
  const [setInputs, setSetInputs] = useState(
    Array.from({ length: block.sets || 0 }, () => ({ weight: "", reps: "" }))
  );
  const [freeValue, setFreeValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (block.type === "freetext") {
    const hasResultType = block.result_type && block.result_type !== "none";
    const sessions = results || [];
    const last = sessions[sessions.length - 1];
    const save = async () => {
      if (!freeValue.trim()) return;
      setSaving(true);
      await onAddFreetextResult(block.id, freeValue.trim());
      setSaving(false);
      setFreeValue("");
      setLogging(false);
    };
    return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{block.letter}{block.number} · {block.title}</div>
          {isTrainer && <button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => onRemove(block.id)}>✕</button>}
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{block.body_text}</div>
        {hasResultType && last && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>
            Letzter Eintrag ({fmtDate(last.logged_at)}): <b style={{ color: "var(--text)" }}>{last.value}</b>
          </div>
        )}
        {hasResultType && !isTrainer && !logging && (
          <button className="btn-ghost" style={{ marginTop: 10, fontSize: 12, padding: "6px 10px" }} onClick={() => setLogging(true)}>
            + Ergebnis eintragen
          </button>
        )}
        {hasResultType && !isTrainer && logging && (
          <div className="stack" style={{ marginTop: 10 }}>
            <input value={freeValue} onChange={(e) => setFreeValue(e.target.value)}
              placeholder={block.result_type === "time" ? "z. B. 12:30" : block.result_type === "rounds" ? "z. B. 6" : "z. B. 42"} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setLogging(false)}>Abbrechen</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "…" : "Speichern"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Kraftübung
  const sessions = results || [];
  const last = sessions[sessions.length - 1];
  const save = async () => {
    const rows = setInputs
      .filter((s) => s.weight !== "" || s.reps !== "")
      .map((s, i) => ({ set_number: i + 1, weight: parseFloat(s.weight) || null, reps: s.reps || null }));
    if (rows.length === 0) return;
    setSaving(true);
    await onAddExerciseResult(block.id, rows);
    setSaving(false);
    setSetInputs(Array.from({ length: block.sets || 0 }, () => ({ weight: "", reps: "" })));
    setLogging(false);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{block.letter}{block.number} · {block.name}</div>
        {isTrainer && <button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => onRemove(block.id)}>✕</button>}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span>{block.sets} Sätze</span>
        <span>{block.reps} {block.rep_type === "time" ? "Zeit" : "Wdh"}</span>
        <span>RPE {block.rpe}</span>
        <span>{block.rest_seconds}s Pause</span>
        {block.kadenz && <span>Kadenz {block.kadenz}</span>}
      </div>
      {block.notes && <div style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{block.notes}</div>}
      {last && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>
          Letzter Eintrag ({fmtDate(last.logged_at)}): {last.sets.map((s) => (s.weight ? `${s.weight}kg×${s.reps}` : s.reps)).join(", ")}
        </div>
      )}
      {!isTrainer && !logging && (
        <button className="btn-ghost" style={{ marginTop: 10, fontSize: 12, padding: "6px 10px" }} onClick={() => setLogging(true)}>
          + Ergebnis eintragen
        </button>
      )}
      {!isTrainer && logging && (
        <div className="stack" style={{ marginTop: 10 }}>
          {setInputs.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-faint)", width: 16 }}>{i + 1}.</span>
              <input style={{ width: 70 }} value={s.weight} placeholder="kg"
                onChange={(e) => setSetInputs((arr) => arr.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)))} />
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>kg ×</span>
              <input style={{ width: 70 }} value={s.reps} placeholder={block.rep_type === "time" ? "0:30" : "Wdh"}
                onChange={(e) => setSetInputs((arr) => arr.map((x, j) => (j === i ? { ...x, reps: e.target.value } : x)))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setLogging(false)}>Abbrechen</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "…" : "Speichern"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- AddBlockForm ----------
function AddBlockForm({ onAdd, onClose }) {
  const [blockType, setBlockType] = useState("exercise");
  const [form, setForm] = useState({
    letter: "A", number: 1, name: "", sets: 3, reps: "10", rep_type: "reps",
    rpe: 8, rest_seconds: 90, kadenz: "", notes: "", title: "", body_text: "", result_type: "none",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (blockType === "exercise" && !form.name) return;
    if (blockType === "freetext" && !form.title) return;
    setSaving(true);
    if (blockType === "exercise") {
      await onAdd({
        type: "exercise", letter: form.letter, number: Number(form.number) || 1,
        name: form.name, sets: Number(form.sets) || 1, reps: form.reps, rep_type: form.rep_type,
        rpe: Number(form.rpe) || null, rest_seconds: Number(form.rest_seconds) || null,
        kadenz: form.kadenz || null, notes: form.notes || null,
      });
    } else {
      await onAdd({
        type: "freetext", letter: form.letter, number: Number(form.number) || 1,
        title: form.title, body_text: form.body_text, result_type: form.result_type,
      });
    }
    setSaving(false);
  };

  return (
    <div className="card stack">
      <div className="label">Neuer Block</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className={blockType === "exercise" ? "btn-primary" : "btn-ghost"} style={{ flex: 1 }} onClick={() => setBlockType("exercise")}>Einzelübung</button>
        <button className={blockType === "freetext" ? "btn-primary" : "btn-ghost"} style={{ flex: 1 }} onClick={() => setBlockType("freetext")}>Workout-Block</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <select style={{ width: 70 }} value={form.letter} onChange={(e) => setForm((f) => ({ ...f, letter: e.target.value }))}>
          {LETTERS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <input style={{ width: 60 }} type="number" min={1} value={form.number}
          onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
      </div>
      {blockType === "exercise" ? (
        <>
          <input placeholder="Übungsname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className={form.rep_type === "reps" ? "btn-primary" : "btn-ghost"} style={{ flex: 1, fontSize: 12 }}
              onClick={() => setForm((f) => ({ ...f, rep_type: "reps" }))}>Wiederholungen</button>
            <button className={form.rep_type === "time" ? "btn-primary" : "btn-ghost"} style={{ flex: 1, fontSize: 12 }}
              onClick={() => setForm((f) => ({ ...f, rep_type: "time" }))}>Zeit (z. B. Plank)</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <input placeholder="Sätze" value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))} />
            <input placeholder={form.rep_type === "time" ? "Zeit z.B. 45s" : "Wdh"} value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} />
            <input placeholder="RPE" value={form.rpe} onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))} />
            <input placeholder="Pause (s)" value={form.rest_seconds}
              onChange={(e) => setForm((f) => ({ ...f, rest_seconds: e.target.value }))} />
            <input placeholder="Kadenz z.B. 30X0" value={form.kadenz}
              onChange={(e) => setForm((f) => ({ ...f, kadenz: e.target.value }))} />
          </div>
          <input placeholder="Notizen (optional)" value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </>
      ) : (
        <>
          <input placeholder="Titel (z. B. Cardio-Finisher)" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea rows={3} placeholder="Freitext: Workout, Intervalle…" value={form.body_text}
            onChange={(e) => setForm((f) => ({ ...f, body_text: e.target.value }))} />
          <select value={form.result_type} onChange={(e) => setForm((f) => ({ ...f, result_type: e.target.value }))}>
            <option value="none">Kein Ergebnis</option>
            <option value="time">Zeit</option>
            <option value="rounds">Runden</option>
            <option value="reps">Wiederholungen</option>
          </select>
        </>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Abbrechen</button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={submit} disabled={saving}>{saving ? "…" : "Speichern"}</button>
      </div>
    </div>
  );
}

// ---------- Haupt-Seite ----------
export default function TrainingPlan() {
  const { profile } = useAuth();
  const isTrainer = profile.role === "trainer";

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(isTrainer ? null : profile.id);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [blocks, setBlocks] = useState([]);
  const [resultsByBlock, setResultsByBlock] = useState({});
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const currentWeekStart = weekStartISO(weekOffset);

  useEffect(() => {
    if (!isTrainer) return;
    supabase.from("profiles").select("*").eq("role", "client").then(({ data, error }) => {
      if (error) { setError(error.message); return; }
      setClients(data);
      if (data.length > 0) setClientId((c) => c || data[0].id);
    });
  }, [isTrainer]);

  const loadDay = async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");

    const { data: blockData, error: blockErr } = await supabase
      .from("training_blocks")
      .select("*")
      .eq("client_id", clientId)
      .eq("week_start", currentWeekStart)
      .eq("day_of_week", selectedDay)
      .order("letter").order("number");

    if (blockErr) { setError(blockErr.message); setLoading(false); return; }
    setBlocks(blockData || []);

    const map = {};
    const exIds = (blockData || []).filter((b) => b.type === "exercise").map((b) => b.id);
    const ftIds = (blockData || []).filter((b) => b.type === "freetext").map((b) => b.id);

    if (exIds.length > 0) {
      const { data: exResults } = await supabase.from("exercise_results").select("*").in("block_id", exIds).order("logged_at");
      exIds.forEach((id) => {
        const byDate = {};
        (exResults || []).filter((r) => r.block_id === id).forEach((r) => {
          if (!byDate[r.logged_at]) byDate[r.logged_at] = [];
          byDate[r.logged_at].push(r);
        });
        map[id] = Object.entries(byDate)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([logged_at, sets]) => ({ logged_at, sets: sets.sort((a, b) => a.set_number - b.set_number) }));
      });
    }
    if (ftIds.length > 0) {
      const { data: ftResults } = await supabase.from("freetext_results").select("*").in("block_id", ftIds).order("logged_at");
      ftIds.forEach((id) => { map[id] = (ftResults || []).filter((r) => r.block_id === id); });
    }

    setResultsByBlock(map);
    setLoading(false);
  };

  useEffect(() => { loadDay(); }, [clientId, currentWeekStart, selectedDay]);

  const addBlock = async (form) => {
    const { error } = await supabase.from("training_blocks").insert({
      ...form, client_id: clientId, day_of_week: selectedDay, week_start: currentWeekStart,
    });
    if (error) { setError(error.message); return; }
    setShowAdd(false);
    loadDay();
  };

  const removeBlock = async (id) => {
    const { error } = await supabase.from("training_blocks").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    loadDay();
  };

  const addExerciseResult = async (blockId, rows) => {
    const { error } = await supabase.from("exercise_results").insert(
      rows.map((r) => ({ ...r, block_id: blockId, logged_at: todayISO() }))
    );
    if (error) setError(error.message);
    else loadDay();
  };

  const addFreetextResult = async (blockId, value) => {
    const { error } = await supabase.from("freetext_results").insert({ block_id: blockId, value, logged_at: todayISO() });
    if (error) setError(error.message);
    else loadDay();
  };

  // Alle Blöcke der Vorwoche in die aktuelle Woche kopieren
  const copyFromPreviousWeek = async () => {
    setCopying(true);
    const prevWeekStart = weekStartISO(weekOffset - 1);

    const { data: prevBlocks, error: fetchErr } = await supabase
      .from("training_blocks")
      .select("*")
      .eq("client_id", clientId)
      .eq("week_start", prevWeekStart);

    if (fetchErr) { setError(fetchErr.message); setCopying(false); return; }
    if (!prevBlocks || prevBlocks.length === 0) {
      setError("In der Vorwoche sind keine Blöcke vorhanden.");
      setCopying(false);
      return;
    }

    // Bestehende Blöcke dieser Woche löschen und neu befüllen
    await supabase.from("training_blocks").delete().eq("client_id", clientId).eq("week_start", currentWeekStart);

    const newBlocks = prevBlocks.map(({ id, created_at, ...rest }) => ({
      ...rest,
      week_start: currentWeekStart,
    }));

    const { error: insertErr } = await supabase.from("training_blocks").insert(newBlocks);
    if (insertErr) { setError(insertErr.message); setCopying(false); return; }

    setCopying(false);
    loadDay();
  };

  // Prüfen ob diese Woche schon Blöcke hat (für Kopier-Button)
  const [weekHasBlocks, setWeekHasBlocks] = useState(false);
  useEffect(() => {
    if (!clientId || !isTrainer) return;
    supabase
      .from("training_blocks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("week_start", currentWeekStart)
      .then(({ count }) => setWeekHasBlocks((count || 0) > 0));
  }, [clientId, currentWeekStart, blocks]);

  const weekLabel = `KW ${isoWeekNumber(currentWeekStart)} · ${fmtWeek(currentWeekStart)}`;

  return (
    <div className="page">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Trainingsplan</div>

      {/* Klienten-Auswahl (Trainer) */}
      {isTrainer && clients.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {clients.map((c) => (
            <button key={c.id} className={c.id === clientId ? "btn-primary" : "btn-ghost"}
              style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setClientId(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Wochennavigation */}
      {clientId && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 18 }}
            onClick={() => setWeekOffset((o) => o - 1)}>‹</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{weekLabel}</div>
            {weekOffset === 0 && <div style={{ fontSize: 11, color: "var(--brass)" }}>Aktuelle Woche</div>}
            {weekOffset < 0 && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Vergangene Woche</div>}
            {weekOffset > 0 && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Zukünftige Woche</div>}
          </div>
          <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 18 }}
            onClick={() => setWeekOffset((o) => o + 1)}>›</button>
        </div>
      )}

      {/* Vorwoche kopieren (Trainer, nur wenn aktuelle Woche leer) */}
      {isTrainer && clientId && !weekHasBlocks && (
        <div className="card" style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Diese Woche ist noch leer.</div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
            onClick={copyFromPreviousWeek} disabled={copying}>
            {copying ? "Kopiert…" : "Vorwoche übernehmen"}
          </button>
        </div>
      )}

      {/* Tagesauswahl */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {DAYS.map((d) => (
          <button key={d} onClick={() => setSelectedDay(d)}
            className={d === selectedDay ? "btn-primary" : "btn-ghost"}
            style={{ flex: 1, padding: "8px 0", fontSize: 12 }}>
            {d}
          </button>
        ))}
      </div>
      <div style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 14 }}>{DAY_LABELS[selectedDay]}</div>

      {error && <div style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ color: "var(--text-faint)" }}>Lädt…</div>
      ) : (
        <div className="stack">
          {blocks.map((b) => (
            <BlockCard
              key={b.id} block={b} isTrainer={isTrainer} results={resultsByBlock[b.id]}
              onRemove={removeBlock}
              onAddExerciseResult={addExerciseResult}
              onAddFreetextResult={addFreetextResult}
            />
          ))}
          {blocks.length === 0 && (
            <div style={{ color: "var(--text-faint)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
              {isTrainer ? "Noch kein Training für diesen Tag geplant." : "Heute ist Ruhetag."}
            </div>
          )}
        </div>
      )}

      {isTrainer && clientId && (
        <div style={{ marginTop: 16 }}>
          {!showAdd ? (
            <button className="btn-ghost" style={{ width: "100%" }} onClick={() => setShowAdd(true)}>+ Block hinzufügen</button>
          ) : (
            <AddBlockForm onAdd={addBlock} onClose={() => setShowAdd(false)} />
          )}
        </div>
      )}
    </div>
  );
}
