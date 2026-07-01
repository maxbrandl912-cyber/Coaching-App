import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { profile } = useAuth();
  const isTrainer = profile.role === "trainer";

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(isTrainer ? null : profile.id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isTrainer) return;
    supabase.from("profiles").select("*").eq("role", "client").then(({ data, error }) => {
      if (error) { setError(error.message); return; }
      setClients(data);
      if (data.length > 0) setClientId((c) => c || data[0].id);
    });
  }, [isTrainer]);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);

    supabase.from("chat_messages").select("*").eq("client_id", clientId).order("created_at").then(({ data, error }) => {
      if (error) setError(error.message);
      else setMessages(data || []);
      setLoading(false);
    });

    const channel = supabase
      .channel(`chat-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `client_id=eq.${clientId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !clientId) return;
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      client_id: clientId,
      sender_role: isTrainer ? "trainer" : "client",
      body: text,
    });
    if (error) setError(error.message);
  };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 100px)" }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Chat</div>

      {isTrainer && clients.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {clients.map((c) => (
            <button key={c.id} className={c.id === clientId ? "btn-primary" : "btn-ghost"} style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setClientId(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {isTrainer && clients.length === 0 && (
        <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Noch kein Klient registriert.</div>
      )}

      {error && <div style={{ color: "var(--terracotta)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {clientId && (
        <>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {loading ? (
              <div style={{ color: "var(--text-faint)" }}>Lädt…</div>
            ) : (
              messages.map((m) => {
                const fromMe = isTrainer ? m.sender_role === "trainer" : m.sender_role === "client";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: fromMe ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        background: fromMe ? "var(--brass)" : "var(--surface2)",
                        color: fromMe ? "#1a140a" : "var(--text)",
                        border: fromMe ? "none" : "1px solid var(--border)",
                        borderRadius: 16, padding: "8px 14px", maxWidth: "75%", fontSize: 14,
                      }}
                    >
                      {m.body}
                      <div style={{ fontSize: 10, marginTop: 4, color: fromMe ? "#1a140a99" : "var(--text-faint)" }}>
                        {new Date(m.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Nachricht schreiben…"
            />
            <button className="btn-primary" onClick={send}>Senden</button>
          </div>
        </>
      )}
    </div>
  );
}
