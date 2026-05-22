import { Link } from "wouter";
import { useListEpisodes, useGetChildProgress, useTextToSpeech } from "@workspace/api-client-react";
import { DrColiSprite } from "@/components/DrColiSprite";
import { BoriSprite } from "@/components/BoriSprite";
import { InstallBanner } from "@/components/InstallBanner";
import { FeedbackButton } from "@/components/FeedbackButton";
import ottiyaLogo from "@assets/Ottiya_Korean_Icon_1777770327862.png";
import koalaImg from "@assets/ottiya_korean_koala_1777778826131.webp";
import lionImg from "@assets/ottiya_korean_lion_1777778826131.webp";
import llamaImg from "@assets/ottiya_korean_llama_1777778826131.webp";
import pandaImg from "@assets/ottiya_korean_panda_1777778826131.webp";
import rabbitImg from "@assets/ottiya_korean_rabbit_1777778826131.webp";
import { useChildId } from "@/hooks/useChildId";
import { useChildProfile } from "@/hooks/useChildProfile";

const CHAR_IMAGES: Record<string, string> = {
  koala: koalaImg,
  lion: lionImg,
  llama: llamaImg,
  panda: pandaImg,
  rabbit: rabbitImg,
};

const LESSON_WORDS = [
  { korean: "선생님", english: "teacher", romanization: "seon-saeng-nim" },
  { korean: "안녕하세요", english: "hello (formal)", romanization: "an-nyeong-ha-se-yo" },
  { korean: "안녕", english: "hello / goodbye", romanization: "an-nyeong" },
];

function getDailyWord() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return LESSON_WORDS[dayOfYear % LESSON_WORDS.length];
}

export default function HomePage() {
  const childId = useChildId();
  const { data: episodes, isLoading } = useListEpisodes();
  const { data: progress } = useGetChildProgress(childId);
  const { profile } = useChildProfile();

  const totalStars = progress?.totalStars ?? 0;
  const completedScenes = progress?.completedScenes ?? [];
  const songChallengeCount = completedScenes.filter(s => s.sceneId === "song-challenge").length;
  const bestSongStars = completedScenes
    .filter(s => s.sceneId === "song-challenge")
    .reduce((best: number, s: { stars?: number }) => Math.max(best, s.stars ?? 0), 0);
  const isEpLocked = (_epId: string) => false; // TEMP: unlock all for testing
  const displayName = profile?.name;
  const todaysWord = getDailyWord();
  const buddyImg = CHAR_IMAGES[profile?.favorite ?? "rabbit"] ?? rabbitImg;
  const { mutateAsync: tts } = useTextToSpeech();

  const speakTodaysWord = async () => {
    try {
      const { audio } = await tts({ data: { text: todaysWord.korean, character: "drColi" } });
      const sound = new Audio(`data:audio/mp3;base64,${audio}`);
      sound.play().catch(() => {});
    } catch {
      // Non-critical
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background overflow-x-hidden">
      <InstallBanner />

      <header className="w-full px-4 pt-4 pb-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src={ottiyaLogo}
            alt="Ottiya Logo"
            className="w-10 h-10 md:w-13 md:h-13 object-contain drop-shadow-md rounded-full flex-shrink-0"
          />
          <h1 className="text-base md:text-2xl font-black text-primary tracking-tight">
            Ottiya Korean
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/logbook"
            className="bg-white text-secondary-foreground font-bold px-3 py-2 md:px-5 md:py-3 rounded-full shadow-md border-2 border-secondary hover:bg-secondary/10 transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
            data-testid="link-logbook"
          >
            <span className="hidden sm:inline">My </span>Logbook
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 font-black px-3 py-2 md:px-5 md:py-3 rounded-full shadow-md border-2 border-yellow-300 hover:bg-yellow-100 transition-all hover:scale-105 active:scale-95"
            data-testid="link-profile"
          >
            <span className="text-base">⭐</span>
            <span className="text-sm font-black">{totalStars}</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-col md:hidden flex-1 px-4 pb-6 gap-3">
        <div className="bg-white rounded-3xl px-5 py-4 shadow-md border-4 border-primary/20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 mt-1">
          {displayName ? (
            <>
              <p className="text-lg font-bold text-foreground">
                안녕, <span className="text-primary">{displayName}</span>!
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">Ready to learn Korean today?</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground">안녕! (Annyeong!)</p>
              <p className="text-sm text-muted-foreground mt-0.5">Let's play and learn Korean together!</p>
            </>
          )}
        </div>

        <div className="flex items-end justify-center gap-0 h-[18vh] max-h-[150px] overflow-hidden flex-shrink-0">
          <div className="w-[36%] max-w-[100px] flex-shrink-0">
            <DrColiSprite isTalking={true} className="drop-shadow-xl" />
          </div>
          <div className="w-[30%] max-w-[85px] flex-shrink-0">
            <BoriSprite isAnimating={true} className="drop-shadow-xl" />
          </div>
        </div>

        {profile && (
          <button onClick={speakTodaysWord} className="w-full bg-white rounded-[1.5rem] px-4 py-3 shadow-sm border-2 border-accent/40 flex items-center gap-3 text-left cursor-pointer active:scale-95 transition-transform">
            <img
              src={buddyImg}
              alt="your buddy"
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">Today's Word</p>
              <p className="text-xl font-black text-foreground leading-tight">{todaysWord.korean}</p>
              <p className="text-xs font-bold text-muted-foreground">
                {todaysWord.romanization} · {todaysWord.english}
              </p>
            </div>
            <span className="text-xl flex-shrink-0" aria-hidden>🔊</span>
          </button>
        )}

        <h2 className="text-xl font-black text-center text-primary-foreground drop-shadow-sm bg-primary/90 py-2 px-6 rounded-full self-center">
          Choose an Episode
        </h2>

        <div className="flex flex-col gap-3 w-full">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 w-full bg-white/50 animate-pulse rounded-3xl border-2 border-primary/10" />
            ))
          ) : episodes && episodes.length > 0 ? (
            episodes.map((ep, idx) => {
              const locked = isEpLocked(ep.id);
              if (locked) {
                return (
                  <div
                    key={ep.id}
                    className="block w-full bg-white/60 rounded-3xl p-4 border-4 border-dashed border-muted-foreground/20 relative overflow-hidden"
                    data-testid={`link-episode-${ep.id}`}
                  >
                    <div className="relative z-10 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-0.5">Episode {idx + 1}</div>
                        <h3 className="text-lg font-black text-muted-foreground/60">{ep.title}</h3>
                        <div className="text-xs text-muted-foreground/50 mt-0.5">
                          Finish the 안녕하세요 Song Challenge first! 🎵
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-lg flex-shrink-0">
                        🔒
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={ep.id}
                  href={`/episode/${ep.id}`}
                  className="group block w-full bg-white rounded-3xl p-4 shadow-sm hover:shadow-md border-4 border-transparent hover:border-primary/50 transition-all active:scale-95 cursor-pointer relative overflow-hidden"
                  data-testid={`link-episode-${ep.id}`}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-0.5">Episode {idx + 1}</div>
                      <h3 className="text-lg font-black text-foreground">{ep.title}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">{ep.vocabulary.length} words</div>
                    </div>
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                      →
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center p-6 bg-white rounded-3xl border-2 border-dashed border-muted-foreground/30">
              <p className="text-base font-bold text-muted-foreground">More episodes coming soon!</p>
            </div>
          )}
        </div>

        <Link
          href="/song-challenge"
          className="group block w-full bg-gradient-to-r from-violet-100 to-violet-50 rounded-3xl p-4 shadow-sm hover:shadow-md border-4 border-violet-200 hover:border-violet-400 transition-all active:scale-95 cursor-pointer"
          data-testid="link-song-challenge"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-0.5">Episode 1 · Song</div>
              <h3 className="text-lg font-black text-foreground">안녕하세요 Song Challenge</h3>
              <div className="text-xs text-muted-foreground mt-0.5">
                Tap the emoji when you hear the word!
                {songChallengeCount > 0 && (
                  <span className="ml-2 text-violet-500 font-black">🎵 Played {songChallengeCount}×</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-violet-500 text-white rounded-full flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
              🎵
            </div>
          </div>
        </Link>

        <Link
          href="/chat"
          className="bg-accent text-accent-foreground font-black text-lg py-4 px-8 rounded-3xl shadow-md hover:shadow-lg border-b-4 border-accent-foreground/20 hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0 transition-all text-center flex items-center justify-center gap-3"
          data-testid="link-chat"
        >
          <span className="text-xl">🌟</span> Let's Practice!
        </Link>

        <div className="flex justify-end pt-1">
          <Link
            href="/parent-report"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-semibold"
            data-testid="link-parent-report"
          >
            📊 For Parents
          </Link>
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-stretch justify-between gap-8 px-8 py-4 max-w-5xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-between gap-3 py-4" style={{ minHeight: 0 }}>
          <div className="bg-white rounded-3xl px-6 py-5 shadow-lg border-4 border-primary/20 max-w-[300px] w-full text-center flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {displayName ? (
              <>
                <p className="text-xl font-bold text-foreground">
                  안녕, <span className="text-primary">{displayName}</span>!
                </p>
                <p className="text-base text-muted-foreground mt-1">Ready to learn Korean today?</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-foreground">안녕! (Annyeong!)</p>
                <p className="text-lg text-muted-foreground mt-1">Let's play and learn Korean together!</p>
              </>
            )}
          </div>
          <div className="flex items-end justify-center gap-0 w-full" style={{ height: "42vh", maxHeight: 420 }}>
            <div className="w-[55%] max-w-[280px] flex-shrink-0">
              <DrColiSprite isTalking={true} className="drop-shadow-xl" />
            </div>
            <div className="w-[42%] max-w-[240px] flex-shrink-0">
              <BoriSprite isAnimating={true} className="drop-shadow-xl" />
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-sm flex flex-col gap-4">
          {profile && (
            <button onClick={speakTodaysWord} className="w-full bg-white rounded-[1.5rem] p-4 shadow-sm border-2 border-accent/40 flex items-center gap-3 text-left cursor-pointer active:scale-95 transition-transform">
              <img src={buddyImg} alt="your buddy" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">Today's Word</p>
                <p className="text-2xl font-black text-foreground leading-tight">{todaysWord.korean}</p>
                <p className="text-sm font-bold text-muted-foreground">
                  {todaysWord.romanization} · {todaysWord.english}
                </p>
              </div>
              <span className="text-2xl flex-shrink-0" aria-hidden>🔊</span>
            </button>
          )}

          <h2 className="text-2xl font-black text-center text-primary-foreground drop-shadow-sm bg-primary/90 py-2 px-6 rounded-full self-center">
            Choose an Episode
          </h2>

          <div className="flex flex-col gap-4 w-full">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full bg-white/50 animate-pulse rounded-3xl border-2 border-primary/10" />
              ))
            ) : episodes && episodes.length > 0 ? (
              episodes.map((ep, idx) => {
                const locked = isEpLocked(ep.id);
                if (locked) {
                  return (
                    <div
                      key={ep.id}
                      className="block w-full bg-white/60 rounded-3xl p-4 border-4 border-dashed border-muted-foreground/20 relative overflow-hidden"
                      data-testid={`link-episode-${ep.id}`}
                    >
                      <div className="relative z-10 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Episode {idx + 1}</div>
                          <h3 className="text-xl font-black text-muted-foreground/60">{ep.title}</h3>
                          <div className="text-sm text-muted-foreground/50 mt-1">
                            Finish the 안녕하세요 Song Challenge first! 🎵
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          🔒
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={ep.id}
                    href={`/episode/${ep.id}`}
                    className="group block w-full bg-white rounded-3xl p-4 shadow-sm hover:shadow-md border-4 border-transparent hover:border-primary/50 transition-all active:scale-95 cursor-pointer relative overflow-hidden"
                    data-testid={`link-episode-${ep.id}`}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-primary/80 uppercase tracking-wider mb-1">Episode {idx + 1}</div>
                        <h3 className="text-xl font-black text-foreground">{ep.title}</h3>
                        <div className="text-sm text-muted-foreground mt-1">{ep.vocabulary.length} words</div>
                      </div>
                      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl shadow-inner group-hover:scale-110 transition-transform">
                        →
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center p-8 bg-white rounded-3xl border-2 border-dashed border-muted-foreground/30">
                <p className="text-lg font-bold text-muted-foreground">More episodes coming soon!</p>
              </div>
            )}
          </div>

          <Link
            href="/song-challenge"
            className="group block w-full bg-gradient-to-r from-violet-100 to-violet-50 rounded-3xl p-4 shadow-sm hover:shadow-md border-4 border-violet-200 hover:border-violet-400 transition-all active:scale-95 cursor-pointer"
            data-testid="link-song-challenge"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-violet-500 uppercase tracking-wider mb-1">Episode 1 · Song</div>
                <h3 className="text-xl font-black text-foreground">안녕하세요 Song Challenge</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  Tap the emoji when you hear the word!
                  {songChallengeCount > 0 && (
                    <span className="ml-2 text-violet-500 font-black">🎵 Played {songChallengeCount}×</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-violet-500 text-white rounded-full flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                🎵
              </div>
            </div>
          </Link>

          <Link
            href="/chat"
            className="mt-2 bg-accent text-accent-foreground font-black text-xl py-5 px-8 rounded-3xl shadow-md hover:shadow-lg border-b-4 border-accent-foreground/20 hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0 transition-all text-center flex items-center justify-center gap-3"
            data-testid="link-chat"
          >
            <span className="text-2xl">🌟</span> Let's Practice!
          </Link>

          <div className="flex justify-end pt-1">
            <Link
              href="/parent-report"
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-semibold"
              data-testid="link-parent-report"
            >
              📊 For Parents
            </Link>
          </div>
        </div>
      </div>

      <FeedbackButton />
    </div>
  );
}
