import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useChildId } from "@/hooks/useChildId";
import { useSaveChildProgress, useTextToSpeech } from "@workspace/api-client-react";
import { DrColiSprite } from "@/components/DrColiSprite";
import { BoriSprite } from "@/components/BoriSprite";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { playBase64Mp3, unlockAudioCtx } from "@/lib/audioContext";

const SONG_URL = `${import.meta.env.BASE_URL}song1_annyonghaseyo.mp3`;
const SONG_DURATION = 35;

const CHOICES = ["🙇‍♀️", "👋", "🏃‍♀️"];
const CHOICE_LABELS = ["Bow!", "Wave!", "Run!"];

const CUES = [
  { word: "안녕",     start: 0.0,   end: 2.15,  correctIndex: 1 },
  { word: "안녕",     start: 2.16,  end: 6.03,  correctIndex: 1 },
  { word: "안녕하세요", start: 6.04,  end: 10.1,  correctIndex: 0 },
  { word: "안녕",     start: 10.11, end: 13.0,  correctIndex: 1 },
  { word: "안녕",     start: 13.1,  end: 16.5,  correctIndex: 1 },
  { word: "안녕하세요", start: 16.51, end: 20.04, correctIndex: 0 },
  { word: "안녕하세요", start: 27.0,  end: 31.15, correctIndex: 0 },
  { word: "안녕",     start: 31.16, end: 34.12, correctIndex: 1 },
];

const PRAISE = ["Yay! 🎉", "Great! ✨", "You got it!", "Amazing! 🌟"];

const TIERS = [
  { minAccuracy: 0.88, stars: 5, message: "You're a SUPER STAR! 🌟" },
  { minAccuracy: 0.63, stars: 4, message: "Excellent! 🎉" },
  { minAccuracy: 0.38, stars: 3, message: "Good job! 👍" },
  { minAccuracy: 0.0,  stars: 2, message: "Nice try! 💪" },
];

type Phase = "ready" | "practice" | "playing" | "ended";
type PracticePhase = "idle" | "speaking" | "done";

interface CueResult {
  tapped: boolean;
  correct: boolean;
  chosenIndex: number | null;
}

const freshResults = (): CueResult[] =>
  CUES.map(() => ({ tapped: false, correct: false, chosenIndex: null }));

export default function SongChallengePage() {
  const { profile } = useChildProfile();
  const childId = useChildId();
  const { mutate: saveProgress } = useSaveChildProgress();
  const { mutate: tts } = useTextToSpeech();
  const { markToday } = useStreakTracker(childId);
  const name = profile?.name ?? "Friend";

  const [phase, setPhase] = useState<Phase>("ready");
  const [practicePhase, setPracticePhase] = useState<PracticePhase>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [cueResults, setCueResults] = useState<CueResult[]>(freshResults);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [activeCueIdx, setActiveCueIdx] = useState<number | null>(null);

  const songRef = useRef<HTMLAudioElement | null>(null);
  const streakRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef(0);
  const cueResultsRef = useRef(cueResults);
  const phaseRef = useRef<Phase>("ready");
  const progressSavedRef = useRef(false);
  const answeredCuesRef = useRef<Set<number>>(new Set());
  const practiceAudioRef = useRef<(() => void) | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  useEffect(() => { cueResultsRef.current = cueResults; }, [cueResults]);

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Build audio once
  useEffect(() => {
    const audio = new Audio(SONG_URL);
    audio.preload = "auto";
    songRef.current = audio;

    const onTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);

      // Find the currently active cue
      const idx = CUES.findIndex(c => t >= c.start && t < c.end);
      setActiveCueIdx(idx >= 0 ? idx : null);
    };

    const onEnded = () => {
      if (phaseRef.current === "playing") {
        setPhaseSync("ended");
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Save progress when song ends
  useEffect(() => {
    if (phase !== "ended" || progressSavedRef.current) return;
    progressSavedRef.current = true;

    const correct = cueResultsRef.current.filter(r => r.correct).length;
    const accuracy = correct / CUES.length;
    const tier = TIERS.find(t => accuracy >= t.minAccuracy) ?? TIERS[TIERS.length - 1];

    saveProgress({
      childId,
      data: {
        episodeId: "ep-01",
        sceneId: "song-challenge",
        stars: tier.stars,
      },
    });
    markToday();
  }, [phase, childId, saveProgress]);

  const showFeedback = (text: string, good: boolean) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const id = ++feedbackIdRef.current;
    setFeedback({ text, good, id });
    feedbackTimer.current = setTimeout(() => {
      setFeedback(f => f?.id === id ? null : f);
    }, 900);
  };

  const speakPracticeCue = useCallback((index: number) => {
    const cue = CUES[index];
    setPracticePhase("speaking");
    tts(
      { data: { text: cue.word, character: "drColi" } },
      {
        onSuccess: (res) => {
          const stop = playBase64Mp3(res.audio, () => {
            if (practiceAudioRef.current === stop) practiceAudioRef.current = null;
            const next = index + 1;
            if (next < CUES.length) {
              speakPracticeCue(next);
            } else {
              setPracticePhase("done");
            }
          });
          practiceAudioRef.current = stop;
        },
        onError: () => setPracticePhase("done"),
      }
    );
  }, [tts]);

  const handleChoice = useCallback((chosenIdx: number) => {
    if (phaseRef.current !== "playing") return;
    if (activeCueIdx === null) return;
    if (answeredCuesRef.current.has(activeCueIdx)) return;

    answeredCuesRef.current.add(activeCueIdx);

    const cue = CUES[activeCueIdx];
    const isCorrect = chosenIdx === cue.correctIndex;

    setCueResults(prev => {
      const next = [...prev];
      next[activeCueIdx] = { tapped: true, correct: isCorrect, chosenIndex: chosenIdx };
      return next;
    });

    if (isCorrect) {
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      showFeedback(PRAISE[Math.floor(Math.random() * PRAISE.length)], true);
    } else {
      streakRef.current = 0;
      setStreak(0);
      showFeedback("Try again! 🎵", false);
    }
  }, [activeCueIdx]);

  const handleStart = () => {
    answeredCuesRef.current = new Set();
    progressSavedRef.current = false;
    setCueResults(freshResults());
    setStreak(0);
    streakRef.current = 0;
    setFeedback(null);
    setCurrentTime(0);
    setActiveCueIdx(null);
    const audio = songRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    setPhaseSync("playing");
  };

  const handlePractice = () => {
    practiceAudioRef.current?.();
    practiceAudioRef.current = null;
    setPlayingWord(null);
    setPhaseSync("practice");
  };

  const playWord = useCallback((word: string) => {
    practiceAudioRef.current?.();
    practiceAudioRef.current = null;
    setPlayingWord(word);
    tts(
      { data: { text: word, character: "drColi" } },
      {
        onSuccess: (res) => {
          const stop = playBase64Mp3(res.audio, () => {
            if (practiceAudioRef.current === stop) practiceAudioRef.current = null;
            setPlayingWord(null);
          });
          practiceAudioRef.current = stop;
        },
        onError: () => setPlayingWord(null),
      },
    );
  }, [tts]);

  const handlePlayAgain = () => {
    setPhaseSync("ready");
  };

  const correctCount = cueResults.filter(r => r.correct).length;
  const accuracy = correctCount / CUES.length;
  const tier = TIERS.find(t => accuracy >= t.minAccuracy) ?? TIERS[TIERS.length - 1];
  const isActiveCue = activeCueIdx !== null && phase === "playing";
  const drColiTalking = phase === "ready"
    || phase === "practice"
    || (phase === "playing" && (isActiveCue || feedback !== null))
    || phase === "ended";

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-[#e8e4f5] to-[#f0eefb] overflow-hidden select-none">

      {/* Song progress bar */}
      <div className="h-1.5 bg-violet-200 w-full flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-r-full transition-all duration-300"
          style={{ width: `${(currentTime / SONG_DURATION) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
        <Link
          href="/?skipSetup=1"
          onClick={() => songRef.current?.pause()}
          className="bg-white/70 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm text-muted-foreground border border-white/80 hover:scale-105 transition-transform"
          aria-label="Close"
        >
          ✕
        </Link>

        {/* Score: correct hits / total cues */}
        <div className="bg-white/80 backdrop-blur px-5 py-2 rounded-full font-black text-base text-foreground shadow-sm">
          {correctCount} / {CUES.length} 🎯
        </div>

        {/* Streak */}
        <div className={`px-4 py-2 rounded-full font-black text-sm min-w-[70px] text-center transition-all ${streak >= 2 ? "bg-yellow-400 text-white shadow-md scale-110" : "opacity-0 pointer-events-none"}`}>
          ✨{streak}×
        </div>
      </header>

      {/* ── READY SCREEN ── */}
      {phase === "ready" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="bg-white/90 rounded-3xl px-8 py-6 shadow-xl border-4 border-primary/10 text-center max-w-sm w-full">
            <p className="text-4xl mb-2">🎵</p>
            <p className="text-2xl font-black text-foreground mb-1">Song Challenge!</p>
            <p className="text-base text-muted-foreground leading-snug">
              Listen for <span className="font-black text-primary">안녕</span> (wave 👋) and{" "}
              <span className="font-black text-primary">안녕하세요</span> (bow 🙇‍♀️). Tap the right move!
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handlePractice}
              className="bg-white text-primary font-black text-xl px-8 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border-2 border-primary/20 disabled:opacity-50"
            >
              {practicePhase === "speaking" ? "Listening..." : practicePhase === "done" ? "Practice Again" : "Practice"}
            </button>
            <button
              onClick={handleStart}
              className="bg-primary text-white font-black text-2xl px-14 py-5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border-b-4 border-primary-foreground/20"
            >
              🎶 Start!
            </button>
          </div>
          <div className="flex items-end justify-between w-full max-w-xs">
            <div className="w-[48%] max-w-[180px]"><DrColiSprite isTalking={drColiTalking} /></div>
            <div className="w-[38%] max-w-[150px]"><BoriSprite isAnimating={true} /></div>
          </div>
        </div>
      )}

      {/* ── PRACTICE SCREEN ── */}
      {phase === "practice" && (
        <div className="flex-1 flex flex-col items-center justify-between px-5 py-4 overflow-y-auto">

          {/* Title */}
          <div className="text-center pt-2 pb-1">
            <p className="text-2xl font-black text-violet-700">Let's Practice! 🎓</p>
            <p className="text-sm font-bold text-violet-400 mt-0.5">Hear the words before you play</p>
          </div>

          {/* Word cards */}
          <div className="flex flex-col gap-4 w-full max-w-sm flex-1 justify-center">

            {/* 안녕 card */}
            <div className="bg-white/95 rounded-3xl shadow-xl border-4 border-violet-100 p-6 flex flex-col items-center gap-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <p className="text-xs font-black text-violet-300 uppercase tracking-widest mb-1">Word 1</p>
                  <p className="text-5xl font-black text-violet-700 leading-none">안녕</p>
                  <p className="text-sm font-bold text-muted-foreground mt-1">an-nyeong</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-6xl">👋</span>
                  <span className="text-xs font-black text-violet-400 uppercase tracking-wide">Wave!</span>
                </div>
              </div>
              <button
                onClick={() => playWord("안녕")}
                disabled={playingWord !== null}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-lg border-2 transition-all active:scale-95 ${
                  playingWord === "안녕"
                    ? "bg-violet-500 text-white border-violet-500 shadow-lg scale-105 animate-pulse"
                    : "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                }`}
              >
                {playingWord === "안녕" ? "🔊 Playing..." : "🔊 Hear Dr. Coli say it"}
              </button>
            </div>

            {/* 안녕하세요 card */}
            <div className="bg-white/95 rounded-3xl shadow-xl border-4 border-pink-100 p-6 flex flex-col items-center gap-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <p className="text-xs font-black text-pink-300 uppercase tracking-widest mb-1">Word 2</p>
                  <p className="text-4xl font-black text-violet-700 leading-none">안녕하세요</p>
                  <p className="text-sm font-bold text-muted-foreground mt-1">an-nyeong-ha-se-yo</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-6xl">🙇</span>
                  <span className="text-xs font-black text-pink-400 uppercase tracking-wide">Bow!</span>
                </div>
              </div>
              <button
                onClick={() => playWord("안녕하세요")}
                disabled={playingWord !== null}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-lg border-2 transition-all active:scale-95 ${
                  playingWord === "안녕하세요"
                    ? "bg-pink-500 text-white border-pink-500 shadow-lg scale-105 animate-pulse"
                    : "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                }`}
              >
                {playingWord === "안녕하세요" ? "🔊 Playing..." : "🔊 Hear Dr. Coli say it"}
              </button>
            </div>
          </div>

          {/* Dr. Coli small */}
          <div className="flex items-end justify-center gap-3 w-full max-w-sm pt-2">
            <div className="w-[38%] max-w-[140px]"><DrColiSprite isTalking={true} /></div>
            <div className="flex flex-col gap-2 flex-1 pb-2">
              <button
                onClick={handleStart}
                className="w-full bg-primary text-white font-black text-xl py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border-b-4 border-primary-foreground/20"
              >
                🎶 Start Challenge!
              </button>
              <button
                onClick={() => {
                  practiceAudioRef.current?.(); practiceAudioRef.current = null;
                  setPlayingWord(null);
                  setPhaseSync("ready");
                }}
                className="w-full bg-white/70 text-muted-foreground font-bold text-base py-2.5 rounded-full border-2 border-white/80 hover:scale-105 transition-all"
              >
                ← Back
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── PLAYING SCREEN ── */}
      {phase === "playing" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4">

            {/* Feedback flash */}
            <div className="flex items-center justify-center h-14 w-full">
              {feedback && (
                <div
                  key={feedback.id}
                  className={`px-7 py-2.5 rounded-full font-black text-xl text-white shadow-md animate-in zoom-in duration-150 ${feedback.good ? "bg-green-500" : "bg-red-400"}`}
                >
                  {feedback.text}
                </div>
              )}
            </div>

            {/* Current cue display */}
            <div className="flex flex-col items-center gap-1 min-h-[90px] justify-center">
              {isActiveCue ? (
                <>
                  <p className="text-5xl font-black text-violet-700 animate-in zoom-in duration-200">
                    {CUES[activeCueIdx!].word}
                  </p>
                  <p className="text-base font-bold text-violet-400">What does it mean?</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-violet-300">🎵 Listen...</p>
              )}
            </div>

            {/* Choice buttons */}
            <div className="flex justify-center items-end gap-4 w-full max-w-xs">
              {CHOICES.map((emoji, idx) => {
                const active = isActiveCue && !answeredCuesRef.current.has(activeCueIdx!);
                return (
                  <button
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    disabled={!active}
                    className={`flex-1 h-[140px] flex flex-col items-center justify-center gap-2 rounded-3xl border-4 font-bold transition-all duration-200
                      ${active
                        ? "bg-white border-violet-400 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                        : "bg-white/50 border-white/60 opacity-40 cursor-default"
                      }`}
                    aria-label={CHOICE_LABELS[idx]}
                  >
                    <span className="text-[54px] leading-none">{emoji}</span>
                    <span className="text-muted-foreground text-xs font-black uppercase tracking-wide">{CHOICE_LABELS[idx]}</span>
                  </button>
                );
              })}
            </div>

            {/* Cue progress dots */}
            <div className="flex gap-1.5 mt-2">
              {CUES.map((_, i) => {
                const r = cueResults[i];
                return (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      r.tapped
                        ? r.correct ? "bg-green-500 scale-125" : "bg-red-400"
                        : i === activeCueIdx ? "bg-violet-500 animate-pulse scale-125" : "bg-violet-200"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Characters */}
          <div className="flex-shrink-0 flex items-end justify-between px-6 pb-2">
            <div className="w-[44%] max-w-[200px]"><DrColiSprite isTalking={drColiTalking} /></div>
            <div className="w-[36%] max-w-[160px]"><BoriSprite isAnimating={isActiveCue} /></div>
          </div>
        </>
      )}

      {/* ── END SCREEN ── */}
      {phase === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-between py-6 px-6 animate-in fade-in duration-500">

          <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
            <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">Song Complete!</p>

            {/* Stars */}
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-5xl inline-block ${i < tier.stars ? "animate-in zoom-in duration-300" : "opacity-15"}`}
                  style={i < tier.stars ? { animationDelay: `${i * 150}ms`, animationFillMode: "both" } : undefined}
                >
                  {i < tier.stars ? "⭐" : "☆"}
                </span>
              ))}
            </div>

            {/* Message */}
            <div className="bg-white rounded-3xl px-8 py-5 shadow-xl border-4 border-primary/10 text-center max-w-xs w-full">
              <p className="text-xl font-black text-foreground">
                {name}, {tier.message}
              </p>
              <p className="text-base text-muted-foreground mt-1">
                {correctCount} / {CUES.length} correct
              </p>
            </div>

            {/* Score dots */}
            <div className="flex gap-2 flex-wrap justify-center">
              {cueResults.map((r, i) => (
                <span key={i} className={`text-2xl ${r.correct ? "opacity-100" : "opacity-25"}`}>
                  {r.correct ? "⭐" : "☆"}
                </span>
              ))}
            </div>
          </div>

          {/* Characters */}
          <div className="flex items-end justify-center gap-4 w-full max-w-xs mb-4">
            <div style={{ width: "42%", maxWidth: "160px" }}><DrColiSprite isTalking={true} /></div>
            <div style={{ width: "34%", maxWidth: "130px" }}><BoriSprite isAnimating={true} /></div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handlePlayAgain}
              className="bg-primary text-white font-black text-xl px-8 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              ↻ Play Again
            </button>
            <Link
              href="/?skipSetup=1"
              className="text-primary font-bold text-base px-8 py-3 rounded-full border-2 border-primary/20 hover:scale-105 transition-all text-center bg-white/70 backdrop-blur"
            >
              ← Back Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
