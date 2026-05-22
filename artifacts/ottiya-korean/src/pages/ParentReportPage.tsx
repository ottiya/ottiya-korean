import { useGetChildProgress, useGetLogbook, useGetLogbookStats } from "@workspace/api-client-react";
import { useChildId } from "@/hooks/useChildId";
import { useChildProfile } from "@/hooks/useChildProfile";
import { Link } from "wouter";

const WORD_EMOJI: Record<string, string> = {
  "안녕": "👋",
  "안녕하세요": "🙇‍♀️",
};
const getWordEmoji = (korean: string) => WORD_EMOJI[korean] ?? "📖";

const SCENE_LABELS: Record<string, string> = {
  "song-challenge": "안녕하세요 Song Challenge",
};
const getSceneLabel = (sceneId: string) => SCENE_LABELS[sceneId] ?? sceneId;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex gap-0.5 text-base leading-none" aria-label={`${stars} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < stars ? "text-yellow-400" : "text-gray-200"}>
          {i < stars ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function StatCard({
  value,
  label,
  colorClass,
  printLabel,
}: {
  value: string | number;
  label: string;
  colorClass: string;
  printLabel: string;
}) {
  return (
    <div className={`flex-1 rounded-2xl p-5 text-center border-2 break-inside-avoid ${colorClass} print:rounded-lg print:border-gray-400 print:bg-white`}>
      <div className="text-4xl font-black text-foreground print:text-3xl">{value}</div>
      <div className="text-sm font-bold text-muted-foreground mt-1 print:text-gray-600">{printLabel || label}</div>
    </div>
  );
}

const PRINT_STYLES = `
@media print {
  @page {
    margin: 0.6in 0.7in;
    size: letter portrait;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  html, body {
    background: white !important;
    font-size: 10.5pt;
    color: #111827;
  }

  /* ── Letterhead banner ── */
  .print-letterhead {
    display: block !important;
    border-top: 5px solid #7c3aed !important;
    padding-top: 12pt !important;
    padding-bottom: 12pt !important;
    margin-bottom: 16pt !important;
    border-bottom: 1.5px solid #d1d5db !important;
  }
  .print-letterhead-inner {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-end !important;
  }
  .print-brand {
    font-size: 7.5pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.12em !important;
    text-transform: uppercase !important;
    color: #7c3aed !important;
    margin-bottom: 3pt !important;
  }
  .print-child-name {
    font-size: 26pt !important;
    font-weight: 900 !important;
    color: #111827 !important;
    line-height: 1 !important;
  }
  .print-subtitle {
    font-size: 9pt !important;
    color: #6b7280 !important;
    margin-top: 4pt !important;
  }
  .print-date-label {
    font-size: 7.5pt !important;
    color: #9ca3af !important;
    font-weight: 600 !important;
    text-align: right !important;
  }
  .print-date-value {
    font-size: 9.5pt !important;
    font-weight: 700 !important;
    color: #374151 !important;
    text-align: right !important;
  }

  /* ── Stat row ── */
  .stat-row {
    display: flex !important;
    gap: 10pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 14pt !important;
  }
  .stat-item {
    flex: 1 !important;
    border: 1.5px solid #d1d5db !important;
    border-radius: 6px !important;
    padding: 10pt 8pt !important;
    text-align: center !important;
    background: white !important;
  }
  .stat-item-value {
    font-size: 22pt !important;
    font-weight: 900 !important;
    color: #111827 !important;
    display: block !important;
  }
  .stat-item-label {
    font-size: 7.5pt !important;
    font-weight: 700 !important;
    color: #6b7280 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    margin-top: 3pt !important;
    display: block !important;
  }

  /* ── Section cards ── */
  .print-card {
    border: 1.5px solid #d1d5db !important;
    border-radius: 6px !important;
    background: white !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 12pt !important;
    overflow: hidden !important;
  }
  .print-card-header {
    border-bottom: 1.5px solid #e5e7eb !important;
    padding: 8pt 14pt !important;
    background: #f9fafb !important;
  }

  /* ── Table rows ── */
  .print-row {
    border-bottom: 1px solid #f3f4f6 !important;
  }
  .print-row:last-child { border-bottom: none !important; }
  .print-row:nth-child(even) { background: #fafafa !important; }

  /* ── Progress bar ── */
  .print-bar-track {
    background: #e5e7eb !important;
    height: 5pt !important;
    border-radius: 99px !important;
  }
  .print-bar-fill {
    background: #f59e0b !important;
    height: 5pt !important;
    border-radius: 99px !important;
  }

  /* ── Tips section ── */
  .print-tips {
    border: 1.5px solid #d1d5db !important;
    border-left: 4px solid #7c3aed !important;
    border-radius: 6px !important;
    background: white !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 12pt !important;
  }

  /* ── Footer ── */
  .print-footer {
    display: block !important;
    text-align: center !important;
    border-top: 1px solid #e5e7eb !important;
    padding-top: 10pt !important;
    margin-top: 8pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .print-footer-message {
    font-size: 13pt !important;
    font-weight: 900 !important;
    color: #7c3aed !important;
  }
  .print-footer-sub {
    font-size: 7.5pt !important;
    color: #9ca3af !important;
    margin-top: 3pt !important;
  }

  /* ── Visibility ── */
  .print\\:hidden, .screen-only { display: none !important; }
  .print-only { display: block !important; }

  /* ── Layout ── */
  .print-content { gap: 0 !important; padding: 0 !important; }
}
`;

export default function ParentReportPage() {
  const childId = useChildId();
  const { profile } = useChildProfile();
  const { data: progress, isLoading: progressLoading } = useGetChildProgress(childId);
  const { data: logbook, isLoading: logbookLoading } = useGetLogbook(childId);
  const { data: stats } = useGetLogbookStats(childId);

  const isLoading = progressLoading || logbookLoading;
  const childName = profile?.name ?? "Your Child";

  const completedScenes = progress?.completedScenes ?? [];
  const episodeScenes = completedScenes.filter(s => s.sceneId !== "song-challenge");
  const songScenes = completedScenes.filter(s => s.sceneId === "song-challenge");
  const sortedScenes = [...completedScenes].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const episodesStarted = new Set(episodeScenes.map(s => s.episodeId)).size;
  const songChallengesCompleted = songScenes.length;
  const totalStars = progress?.totalStars ?? 0;
  const uniqueLogbook = logbook?.filter((entry, index, self) =>
    index === self.findIndex((item) => item.korean === entry.korean)
  );
  const totalWords = uniqueLogbook?.length ?? 0;

  const bestByScene: Record<string, number> = {};
  completedScenes.forEach(s => {
    const key = `${s.episodeId}::${s.sceneId}`;
    bestByScene[key] = Math.max(bestByScene[key] ?? 0, s.stars);
  });

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-[100dvh] bg-gray-50 print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Screen nav — hidden on print */}
      <header className="print:hidden bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Link
          href="/"
          className="bg-white text-primary font-bold px-5 py-2.5 rounded-full border-2 border-primary/20 hover:scale-105 transition-transform text-sm shadow-sm"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-black text-foreground">Progress Report</h1>
        <button
          onClick={() => window.print()}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-full hover:scale-105 transition-transform text-sm shadow-sm"
        >
          🖨️ Print / Save Report Card
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 flex flex-col gap-8 print-content">

        {/* Print-only letterhead */}
        <div className="hidden print:block print-letterhead">
          <div className="print-letterhead-inner">
            <div>
              <p className="print-brand">Ottiya Korean · Progress Report</p>
              <p className="print-child-name">{childName}</p>
              <p className="print-subtitle">Korean learning progress summary · Ottiya Korean app</p>
            </div>
            <div>
              <p className="print-date-label">Generated</p>
              <p className="print-date-value">{today}</p>
            </div>
          </div>
        </div>

        {/* Screen-only report header card */}
        <div className="print:hidden bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ottiya Korean · Progress Report</p>
              <h2 className="text-3xl font-black text-foreground">{childName}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-bold">Generated</p>
              <p className="text-sm font-bold text-foreground">{today}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This report summarizes your child's Korean learning activity in the Ottiya Korean app.
          </p>
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="flex gap-4 stat-row flex-wrap">
            <StatCard value={totalStars} label="Stars Earned" printLabel="Stars Earned" colorClass="bg-yellow-50 border-yellow-100" />
            <StatCard value={totalWords} label="Words Learned" printLabel="Words Learned" colorClass="bg-green-50 border-green-100" />
            <StatCard value={episodesStarted} label="Episodes" printLabel="Episodes" colorClass="bg-blue-50 border-blue-100" />
            <StatCard value={songChallengesCompleted} label="Song Challenges" printLabel="Song Challenges" colorClass="bg-violet-50 border-violet-100" />
          </div>
        )}

        {/* Activity History */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden break-inside-avoid print-card">
          <div className="px-6 py-4 border-b border-gray-100 print-card-header">
            <h3 className="text-lg font-black text-foreground">Activity History</h3>
            <p className="text-sm text-muted-foreground">Every session {childName} has played</p>
          </div>

          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sortedScenes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground font-bold">No sessions yet — encourage {childName} to play!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedScenes.map((scene, i) => {
                const isSong = scene.sceneId === "song-challenge";
                return (
                  <div key={scene.id ?? i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors print-row">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isSong ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>
                          {isSong ? "🎵 Song" : "📺 Episode"}
                        </span>
                        <p className="font-bold text-sm text-foreground">{getSceneLabel(scene.sceneId)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(scene.completedAt)} · {formatTime(scene.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRow stars={scene.stars} />
                      <span className="text-xs font-bold text-gray-500 w-10 text-right tabular-nums">{scene.stars}/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Scores */}
        {Object.keys(bestByScene).length > 0 && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden break-inside-avoid print-card">
            <div className="px-6 py-4 border-b border-gray-100 print-card-header">
              <h3 className="text-lg font-black text-foreground">Best Scores</h3>
              <p className="text-sm text-muted-foreground">Highest stars achieved per activity</p>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(bestByScene).map(([key, stars]) => {
                const [, sceneId] = key.split("::");
                const pct = Math.round((stars / 5) * 100);
                return (
                  <div key={key} className="flex items-center justify-between px-6 py-4 print-row">
                    <p className="font-bold text-sm text-foreground">🎵 {getSceneLabel(sceneId)}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-32 bg-gray-100 rounded-full overflow-hidden print-bar-track">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full print-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-foreground w-14 text-right tabular-nums">{stars}/5 ★</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vocabulary Learned */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden break-inside-avoid print-card">
          <div className="px-6 py-4 border-b border-gray-100 print-card-header">
            <h3 className="text-lg font-black text-foreground">Vocabulary Learned</h3>
            <p className="text-sm text-muted-foreground">All words added to {childName}'s logbook</p>
          </div>

          {logbookLoading ? (
            <div className="p-6 grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !uniqueLogbook || uniqueLogbook.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground font-bold">No words learned yet</p>
              <p className="text-sm text-muted-foreground mt-1">Words are added automatically after completing activities</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {uniqueLogbook.map((entry, i) => (
                <div key={entry.id} className={`flex items-center gap-4 px-6 py-3 print-row ${i % 2 === 1 ? "print:bg-gray-50" : ""}`}>
                  <span className="text-2xl w-8 flex-shrink-0 print:text-xl">{getWordEmoji(entry.korean)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-black text-base text-foreground">{entry.korean}</span>
                      <span className="text-xs font-bold text-primary/70 print:text-gray-500">{entry.romanization}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.english}</p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0 print:text-gray-500">{formatDate(entry.addedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips for parents */}
        <div className="bg-gradient-to-br from-violet-50 to-white rounded-3xl border-2 border-violet-100 p-6 shadow-sm break-inside-avoid print-tips">
          <h3 className="text-base font-black text-violet-700 print:text-gray-900 mb-3">💡 Tips to Support Learning at Home</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 print:text-gray-400 font-bold flex-shrink-0 mt-0.5">→</span>
              Ask your child to teach you the words they've learned — 안녕! (Annyeong — "hello!") Kids love being the teacher.
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 print:text-gray-400 font-bold flex-shrink-0 mt-0.5">→</span>
              Praise effort, not just accuracy — every attempt builds confidence and fluency.
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-violet-400 print:text-gray-400 font-bold flex-shrink-0 mt-0.5">→</span>
              10–15 minutes a day is more effective than long single sessions. Consistency beats intensity.
            </li>
          </ul>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block print-footer">
          <p className="print-footer-message">Keep going, {childName}! ⭐</p>
          <p className="print-footer-sub">Ottiya Korean · Report generated {today}</p>
        </div>

        {/* Screen-only footer */}
        <div className="print:hidden text-center pb-4">
          <p className="text-xs text-muted-foreground">
            Ottiya Korean · Report generated {today}
          </p>
        </div>

      </div>
    </div>
  );
}
