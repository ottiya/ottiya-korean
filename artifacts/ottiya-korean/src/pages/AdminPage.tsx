import { useEffect, useState } from "react";
import { getLessonByEpisodeId } from "@/data/lessons";
import { ADMIN_SESSION_KEY } from "@/App";

interface SceneStat {
  episodeId: string;
  sceneId: string;
  uniqueKids: number;
  totalCompletions: number;
  avgStars: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

interface WordStat {
  korean: string;
  english: string;
  romanization: string;
  uniqueKids: number;
  totalSaves: number;
}

interface DayActivity {
  day: string;
  completions: number;
  uniqueKids: number;
}

interface AgeGroup {
  age: number;
  uniqueKids: number;
  totalCompletions: number;
  avgStars: number;
  uniqueScenes: number;
}

interface AnalyticsSummary {
  totalChildren: number;
  totalCompletions: number;
  avgStarsOverall: number;
  totalLogbookSaves: number;
  totalLogbookKids: number;
  profilesWithAge: number;
}

interface Analytics {
  summary: AnalyticsSummary;
  sceneStats: SceneStat[];
  topWords: WordStat[];
  dailyActivity: DayActivity[];
  ageBreakdown: AgeGroup[];
}

interface Props {
  onLogout: () => void;
}

function getSceneLabel(episodeId: string, sceneId: string): string {
  const lesson = getLessonByEpisodeId(episodeId);
  if (!lesson) return sceneId;
  const scene = lesson.scenes.find(s => s.id === sceneId);
  if (!scene) return sceneId;
  const label = scene.type.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getSceneOrder(episodeId: string, sceneId: string): number {
  const lesson = getLessonByEpisodeId(episodeId);
  if (!lesson) return 999;
  return lesson.scenes.findIndex(s => s.id === sceneId);
}

function StarBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 80, height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", minWidth: 32 }}>{value.toFixed(1)}</span>
    </div>
  );
}

function KidBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 80, height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#6366f1", borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", minWidth: 24 }}>{value}</span>
    </div>
  );
}

function DayChart({ days }: { days: DayActivity[] }) {
  if (days.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No activity yet in the last 30 days</p>;
  }
  const maxC = Math.max(...days.map(d => d.completions), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, padding: "8px 0" }}>
      {days.map(d => {
        const pct = (d.completions / maxC) * 100;
        const date = new Date(d.day + "T12:00:00");
        const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <div
            key={d.day}
            title={`${label}: ${d.completions} completions, ${d.uniqueKids} kids`}
            style={{
              flex: 1,
              background: "linear-gradient(180deg, #818cf8, #6366f1)",
              height: `${Math.max(pct, 4)}%`,
              borderRadius: "4px 4px 0 0",
              cursor: "default",
              minWidth: 6,
            }}
          />
        );
      })}
    </div>
  );
}

function StatCard({ value, label, sub, color }: { value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "20px 24px",
      border: `2px solid ${color}22`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20,
      border: "2px solid #f1f5f9",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ padding: "12px 0" }}>{children}</div>
    </div>
  );
}

const AGE_EMOJI: Record<number, string> = { 4: "🧒", 5: "🧒", 6: "👦", 7: "👦", 8: "👧" };

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Unknown";
  }
}

export default function AdminPage({ onLogout }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverTime, setServerTime] = useState("");

  const getAdminHeaders = (): Record<string, string> => {
    const sid = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return sid ? { Authorization: `Bearer ${sid}` } : {};
  };

  const fetchData = () => {
    setLoading(true);
    setError("");
    setServerTime(new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " PT");
    fetch("/api/admin/analytics", { headers: getAdminHeaders() })
      .then(r => {
        if (r.status === 403) return Promise.reject("forbidden");
        return r.ok ? r.json() as Promise<Analytics> : Promise.reject(r.status);
      })
      .then(setData)
      .catch(e => {
        if (e === "forbidden") {
          setError("Session expired — please log in again.");
          onLogout();
        } else {
          setError("Failed to load analytics — please refresh.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const maxKids = data && data.sceneStats.length > 0
    ? Math.max(...data.sceneStats.map(s => s.uniqueKids), 1)
    : 1;
  const maxAgeKids = data && data.ageBreakdown.length > 0
    ? Math.max(...data.ageBreakdown.map(a => a.uniqueKids), 1)
    : 1;

  const sortedScenes = data
    ? [...data.sceneStats].sort((a, b) => {
        if (a.episodeId !== b.episodeId) return a.episodeId.localeCompare(b.episodeId);
        return getSceneOrder(a.episodeId, a.sceneId) - getSceneOrder(b.episodeId, b.sceneId);
      })
    : [];

  const strugglingScenes = data
    ? [...data.sceneStats]
        .filter(s => s.totalCompletions >= 2)
        .sort((a, b) => a.avgStars - b.avgStars)
        .slice(0, 5)
    : [];

  const tz = getLocalTimezone();

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #f1f5f9",
        padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>🌿 Ottiya Analytics</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            Internal · {serverTime || "—"} · Your browser: {tz}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchData}
            style={{
              background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 12,
              padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#475569", cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={onLogout}
            style={{
              background: "#fff1f2", border: "2px solid #fecdd3", borderRadius: 12,
              padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#f43f5e", cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 16 }}>Loading analytics…</div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 16, padding: 20, color: "#ef4444", fontWeight: 700 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatCard value={data.summary.totalChildren ?? 0} label="Active kids" sub="unique child IDs" color="#6366f1" />
              <StatCard value={data.summary.totalCompletions ?? 0} label="Scene completions" sub="all time" color="#22c55e" />
              <StatCard
                value={data.summary.avgStarsOverall != null ? Number(data.summary.avgStarsOverall).toFixed(1) : "—"}
                label="Avg stars" sub="out of 5" color="#f59e0b"
              />
              <StatCard
                value={data.summary.totalLogbookSaves ?? 0}
                label="Logbook saves"
                sub={`across ${data.summary.totalLogbookKids ?? 0} kids`}
                color="#ec4899"
              />
            </div>

            {/* Daily activity */}
            <Section title="📅 Activity — last 30 days" sub="Scene completions per day (Pacific time)">
              <div style={{ padding: "8px 24px 4px" }}>
                <DayChart days={data.dailyActivity} />
                {data.dailyActivity.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    <span>{new Date(data.dailyActivity[0].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span>{new Date(data.dailyActivity[data.dailyActivity.length - 1].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Age breakdown */}
            <Section
              title="🎂 By age"
              sub={
                data.ageBreakdown.length === 0
                  ? `No age data yet — ${data.summary.profilesWithAge ?? 0} profiles have synced a birth year`
                  : `${data.summary.profilesWithAge ?? 0} of ${data.summary.totalChildren ?? 0} kids have synced age data`
              }
            >
              {data.ageBreakdown.length === 0 ? (
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 10px" }}>
                    Age data appears here once kids open the app and sync their profile. It syncs automatically on login — no action needed.
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: "8px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Age</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kids</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg ★</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scenes</th>
                      <th style={{ textAlign: "right", padding: "8px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ageBreakdown.map((a, i) => (
                      <tr key={a.age} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "12px 24px" }}>
                          <span style={{ fontSize: 20, marginRight: 8 }}>{AGE_EMOJI[a.age] ?? "🧒"}</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{a.age} yrs</span>
                        </td>
                        <td style={{ padding: "12px 12px" }}><KidBar value={a.uniqueKids} max={maxAgeKids} /></td>
                        <td style={{ padding: "12px 12px" }}><StarBar value={a.avgStars} /></td>
                        <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 700, color: "#64748b" }}>{a.uniqueScenes}</td>
                        <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#64748b" }}>{a.totalCompletions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Scene funnel */}
            <Section
              title="🎬 Scene engagement funnel"
              sub="How many kids reached each scene — low numbers = drop-off"
            >
              {sortedScenes.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14, padding: "16px 24px" }}>No scene data yet</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: "8px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scene</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kids</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg ★</th>
                      <th style={{ textAlign: "right", padding: "8px 24px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScenes.map((s, i) => (
                      <tr key={`${s.episodeId}-${s.sceneId}`} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 24px" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{getSceneLabel(s.episodeId, s.sceneId)}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.episodeId} · {s.sceneId}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}><KidBar value={s.uniqueKids} max={maxKids} /></td>
                        <td style={{ padding: "10px 12px" }}><StarBar value={s.avgStars} /></td>
                        <td style={{ padding: "10px 24px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#64748b" }}>{s.totalCompletions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Struggling scenes */}
            {strugglingScenes.length > 0 && (
              <Section title="⚠️ Where kids are struggling" sub="Scenes with the lowest average stars (min 2 completions)">
                {strugglingScenes.map((s, i) => (
                  <div key={`${s.episodeId}-${s.sceneId}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 24px",
                    borderTop: i === 0 ? "none" : "1px solid #f1f5f9",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{getSceneLabel(s.episodeId, s.sceneId)}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.uniqueKids} kids, {s.totalCompletions} plays</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StarBar value={s.avgStars} />
                      {s.avgStars < 2.5 && (
                        <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444", fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>Needs work</span>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Vocabulary */}
            <Section title="📖 Vocabulary — most saved words" sub="Words kids are adding to their logbooks">
              {data.topWords.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14, padding: "16px 24px" }}>No logbook data yet</p>
              ) : (
                data.topWords.map((w, i) => (
                  <div key={w.korean} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "10px 24px",
                    borderTop: i === 0 ? "none" : "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", minWidth: 20 }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{w.korean}</span>
                      <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 700, marginLeft: 8 }}>{w.romanization}</span>
                      <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>{w.english}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#ec4899" }}>{w.uniqueKids} kids</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{w.totalSaves} saves</div>
                    </div>
                  </div>
                ))
              )}
            </Section>

            <div style={{ textAlign: "center", fontSize: 12, color: "#cbd5e1", paddingBottom: 8 }}>
              Ottiya Korean · Internal analytics · Live database · Not linked from app UI
            </div>
          </>
        )}
      </div>
    </div>
  );
}
