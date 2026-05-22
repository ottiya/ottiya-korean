import { useState } from "react";

interface Props {
  onAuthenticated: (sessionId: string) => void;
}

export default function AdminLoginPage({ onAuthenticated }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; sessionId: string };
        onAuthenticated(data.sessionId);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Incorrect password");
      }
    } catch {
      setError("Connection error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: "40px 36px",
          maxWidth: 380,
          width: "100%",
          margin: "0 24px",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              color: "#475569",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Ottiya Korean · Internal
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px" }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Restricted — admin access only
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            autoFocus
            disabled={loading}
            style={{
              padding: "12px 16px",
              fontSize: 15,
              background: "#0f172a",
              border: error ? "1px solid #ef4444" : "1px solid #334155",
              borderRadius: 10,
              color: "#f8fafc",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />

          {error && (
            <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              padding: "12px",
              background: loading || !password.trim() ? "#1e293b" : "#6366f1",
              color: loading || !password.trim() ? "#475569" : "#fff",
              border: "1px solid",
              borderColor: loading || !password.trim() ? "#334155" : "#6366f1",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !password.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s, border-color 0.15s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Checking…" : "Access Dashboard"}
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: "#334155",
            textAlign: "center",
            marginTop: 28,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          Not linked from the app — navigate to /admin directly.
        </p>
      </div>
    </div>
  );
}
