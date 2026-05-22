import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useTextToSpeech, useGetChildProgress, useChatWithCharacter } from "@workspace/api-client-react";
import type { ChildProgress, ChatResponse } from "@workspace/api-client-react";
import { useChildId } from "@/hooks/useChildId";
import { useChildProfile } from "@/hooks/useChildProfile";
import { DrColiSprite } from "@/components/DrColiSprite";
import { BoriSprite } from "@/components/BoriSprite";
import { ParentGateOverlay } from "@/components/ParentGateOverlay";
import { LESSON_1 } from "@/data/lessons";
import { playBase64Mp3, unlockAudioCtx } from "@/lib/audioContext";

function buildProgressSummary(progress: ChildProgress | undefined): string {
  if (!progress || progress.completedScenes.length === 0) {
    return "No lessons completed yet.";
  }
  const { completedScenes, totalStars } = progress;
  const recent = completedScenes.slice(-5);
  const recentAvg = recent.reduce((s, c) => s + c.stars, 0) / recent.length;
  return `Completed ${completedScenes.length} scene(s) across ${progress.episodesStarted} episode(s). Total stars: ${totalStars}. Recent avg stars (last ${recent.length}): ${recentAvg.toFixed(1)}.`;
}

type Character = "drColi" | "bori";
type PageMode  = "practice" | "talk";

// ── Lesson data from the registry ─────────────────────────────────────────────
// To add a new lesson's words, add a LessonDefinition in src/data/lessons.ts.
// This page automatically picks up chatWords, prompts, and greetings from there.
const LESSON_WORDS = LESSON_1.chatWords;
const WORD_PROMPT  = LESSON_1.characterPrompts as Record<Character, string[]>;
const START_IDX    = LESSON_1.chatStartIndex   as Record<Character, number>;
const GREETING     = LESSON_1.greeting         as Record<Character, (name: string) => string>;

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const childId     = useChildId();
  const { profile } = useChildProfile();
  const childName   = profile?.name ?? "Friend";

  const { data: progress }       = useGetChildProgress(childId);
  const { mutate: chatMutate }   = useChatWithCharacter();

  const [pageMode, setPageMode]       = useState<PageMode>("practice");
  const [activeChar, setActiveChar]   = useState<Character>("drColi");
  const [selectedIdx, setSelectedIdx] = useState(0);     // practice mode word index
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [wordKey, setWordKey]         = useState(0);     // forces animate-in re-trigger

  // Talk mode
  const [parentVerified, setParentVerified] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [talkWordIdx, setTalkWordIdx]       = useState(0);  // which word we're on in talk mode
  const [bubbleText, setBubbleText]         = useState("");
  const [feedback, setFeedback]             = useState<string | null>(null);
  const [micError, setMicError]             = useState(false);
  const [isRecording, setIsRecording]       = useState(false);

  const stopFnRef      = useRef<(() => void) | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);

  useEffect(() => { return () => stopAudio(); }, []);

  // ── Audio ──────────────────────────────────────────────────────────────────

  const { mutate: tts } = useTextToSpeech();

  const stopAudio = useCallback(() => {
    stopFnRef.current?.();
    stopFnRef.current = null;
    setIsSpeaking(false);
  }, []);

  const playTTS = useCallback((text: string, char: Character, onEnd?: () => void) => {
    stopAudio();
    setIsSpeaking(true);
    tts(
      { data: { text, character: char } },
      {
        onSuccess: (res) => {
          const stop = playBase64Mp3(res.audio, () => {
            if (stopFnRef.current === stop) stopFnRef.current = null;
            setIsSpeaking(false);
            onEnd?.();
          });
          stopFnRef.current = stop;
        },
        onError: () => setIsSpeaking(false),
      },
    );
  }, [tts, stopAudio]);

  // ── Practice mode ──────────────────────────────────────────────────────────

  const handleSelectWord = (idx: number) => {
    unlockAudioCtx();
    stopAudio();
    setSelectedIdx(idx);
    setWordKey(k => k + 1);
    setTimeout(() => playTTS(LESSON_WORDS[idx].korean, activeChar), 120);
  };

  const handleListen = () => { unlockAudioCtx(); playTTS(LESSON_WORDS[selectedIdx].korean, activeChar); };

  const switchCharacter = (char: Character) => {
    if (char === activeChar) return;
    stopAudio();
    setActiveChar(char);
    if (pageMode === "talk") resetTalk(char);
  };

  // ── Talk mode ──────────────────────────────────────────────────────────────

  const speakWordPrompt = useCallback((char: Character, wordIdx: number) => {
    const prompt = WORD_PROMPT[char][wordIdx];
    const word   = LESSON_WORDS[wordIdx].korean;
    setBubbleText(prompt);
    // Say the prompt, then immediately say the Korean word clearly
    playTTS(prompt, char, () => playTTS(word, char));
  }, [playTTS]);

  const resetTalk = useCallback((char: Character) => {
    stopAudio();
    setFeedback(null);
    setMicError(false);
    const idx = START_IDX[char];
    setTalkWordIdx(idx);
    setBubbleText("...");

    const fallback = () => {
      const greeting = GREETING[char](childName);
      const prompt   = WORD_PROMPT[char][idx];
      const word     = LESSON_WORDS[idx].korean;
      setBubbleText(`${greeting} ${prompt}`);
      playTTS(`${greeting} ${prompt}`, char, () => playTTS(word, char));
    };

    chatMutate(
      {
        childId,
        data: {
          message: "[SESSION_START]",
          character: char,
          childName,
          progressSummary: buildProgressSummary(progress),
        },
      },
      {
        onSuccess: (res: ChatResponse) => {
          const word = LESSON_WORDS[idx].korean;
          setBubbleText(res.reply);
          playTTS(res.reply, char, () => playTTS(word, char));
        },
        onError: fallback,
      },
    );
  }, [stopAudio, playTTS, childId, childName, chatMutate, progress]);

  const enterTalkMode = useCallback((char: Character) => {
    setPageMode("talk");
    resetTalk(char);
  }, [resetTalk]);

  const handleTalkButton = () => {
    if (!parentVerified) setShowParentGate(true);
    else enterTalkMode(activeChar);
  };

  const handleHearAgain = () => {
    setFeedback(null);
    playTTS(LESSON_WORDS[talkWordIdx].korean, activeChar);
  };

  const handleNextWord = () => {
    setFeedback(null);
    const next = (talkWordIdx + 1) % LESSON_WORDS.length;
    setTalkWordIdx(next);
    speakWordPrompt(activeChar, next);
  };

  const handleISaidIt = () => {
    // Dr. Coli: warm teacher praise with some Korean
    // Bori: short excited puppy reactions — no fluent English sentences
    const drColiPraises = [
      { display: "잘했어요! ⭐",           speak: "잘했어요!" },
      { display: "Great job! 🌟",          speak: "Great job!" },
      { display: "Awesome! Keep going! ✨", speak: "Awesome! Keep going!" },
      { display: "You did it! 🎉",          speak: "You did it!" },
    ];
    const boriPraises = [
      { display: "Woof woof! 🐾",           speak: "Woof woof!" },
      { display: "안녕! 안녕! 🐾",          speak: "안녕! 안녕!" },
      { display: "Woof! 잘했어요! 🐾",      speak: "Woof! 잘했어요!" },
      { display: "야호! Woof! 🎉",          speak: "야호! 우!" },
    ];
    const praises = activeChar === "drColi" ? drColiPraises : boriPraises;
    const praise = praises[Math.floor(Math.random() * praises.length)];
    setFeedback(praise.display);
    playTTS(praise.speak, activeChar, () => {
      const next = (talkWordIdx + 1) % LESSON_WORDS.length;
      setTalkWordIdx(next);
      speakWordPrompt(activeChar, next);
      setFeedback(null);
    });
  };

  // ── Mic (safe, graceful degradation) ──────────────────────────────────────

  const handleMicToggle = async () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // For now, just acknowledge — STT can be wired in later
        setFeedback("잘했어요! ⭐ (Speech recognition coming soon!)");
        setTimeout(() => setFeedback(null), 2500);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError(true);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedWord  = LESSON_WORDS[selectedIdx];
  const talkWord      = LESSON_WORDS[talkWordIdx];
  const charLabel     = activeChar === "drColi" ? "Dr. Coli" : "Bori";

  // ── Parent gate ────────────────────────────────────────────────────────────

  if (showParentGate) {
    return (
      <ParentGateOverlay
        onVerified={() => {
          setParentVerified(true);
          setShowParentGate(false);
          enterTalkMode(activeChar);
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        {pageMode === "talk" ? (
          <button
            onClick={() => { stopAudio(); setPageMode("practice"); setFeedback(null); setMicError(false); setIsRecording(false); }}
            className="bg-white px-5 py-3 rounded-full font-bold text-primary shadow-sm hover:scale-105 transition-transform border-2 border-primary/10"
          >
            ← Practice
          </button>
        ) : (
          <Link
            href="/"
            className="bg-white px-5 py-3 rounded-full font-bold text-primary shadow-sm hover:scale-105 transition-transform border-2 border-primary/10"
          >
            Back
          </Link>
        )}

        <div className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-md border-2 border-border">
          {(["drColi", "bori"] as Character[]).map(char => (
            <button
              key={char}
              onClick={() => switchCharacter(char)}
              className={`px-5 py-2.5 rounded-full font-black text-lg transition-all ${
                activeChar === char
                  ? (char === "drColi" ? "bg-primary" : "bg-secondary") + " text-white shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {char === "drColi" ? "Dr. Coli" : "Bori"}
            </button>
          ))}
        </div>

        <div className="w-16" />
      </header>

      {/* ══════════════════════ PRACTICE MODE ══════════════════════ */}
      {pageMode === "practice" && (
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Character + context bubble */}
            <div className="flex items-center gap-3">
              <div className="w-20 flex-shrink-0">
                {activeChar === "drColi"
                  ? <DrColiSprite isTalking={isSpeaking} />
                  : <BoriSprite isAnimating={isSpeaking} />}
              </div>
              <div className="bg-white rounded-3xl px-5 py-4 shadow-md border-2 border-primary/10 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Episode 1 · 안녕하세요! 안녕!
                </p>
                <p className="text-base font-black text-foreground leading-snug">
                  {activeChar === "drColi"
                    ? "Practice with Dr. Coli — your warm Korean teacher!"
                    : "Practice alongside Bori — she's learning too! 🐾"}
                </p>
              </div>
            </div>

            {/* Main practice card */}
            <div
              key={wordKey}
              className="bg-[#f5f0e0] rounded-[2rem] shadow-lg border-4 border-[#e8e0c8] p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <p className="text-6xl leading-none">{selectedWord.emoji}</p>
              <p className="text-5xl font-black text-foreground text-center leading-tight">
                {selectedWord.korean}
              </p>
              <p className="text-sm font-bold text-foreground/50 tracking-wide">
                {selectedWord.romanization}
              </p>
              <p className="text-xl font-bold text-foreground/70">{selectedWord.english}</p>

              <button
                onClick={handleListen}
                disabled={isSpeaking}
                className={`mt-1 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base border-2 transition-all active:scale-95 ${
                  isSpeaking
                    ? "bg-primary text-white border-primary animate-pulse"
                    : "bg-white text-primary border-primary/30 hover:border-primary hover:shadow-md hover:scale-105"
                }`}
              >
                {isSpeaking ? "🔊 Playing..." : `🔊 Hear ${charLabel} say it`}
              </button>
            </div>

            {/* Practice action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleListen}
                disabled={isSpeaking}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white border-2 border-primary/20 shadow-sm font-black text-sm text-primary hover:border-primary hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="text-2xl">👂</span>
                Listen
              </button>
              <button
                disabled
                title="Coming soon"
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white border-2 border-muted shadow-sm font-black text-sm text-muted-foreground opacity-50 cursor-default"
              >
                <span className="text-2xl">🎤</span>
                Say It
              </button>
              <button
                disabled
                title="Coming soon"
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white border-2 border-muted shadow-sm font-black text-sm text-muted-foreground opacity-50 cursor-default"
              >
                <span className="text-2xl">🎯</span>
                Mini Quiz
              </button>
            </div>

            {/* Today's Words */}
            <div className="bg-white rounded-[2rem] shadow-md border-4 border-primary/10 p-5 flex flex-col gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Today's Words
              </p>
              <div className="grid grid-cols-2 gap-3">
                {LESSON_WORDS.map((w, i) => {
                  const isActive = i === selectedIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectWord(i)}
                      className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                          : "border-primary/10 hover:border-primary/30 hover:bg-muted/20"
                      }`}
                    >
                      <p className="text-xl font-black text-foreground leading-tight">{w.korean}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{w.english}</p>
                      {isActive && <p className="text-xs font-black text-primary mt-1">▶ selected</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Talk button */}
            <button
              onClick={handleTalkButton}
              className="mx-auto w-full max-w-sm bg-accent text-accent-foreground font-black text-xl py-4 rounded-3xl shadow-md border-b-4 border-accent-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              🎤 Talk with {charLabel}
            </button>

          </div>
        </div>
      )}

      {/* ══════════════════════ TALK MODE ══════════════════════ */}
      {pageMode === "talk" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">

              {/* Character sprite */}
              <div className="flex justify-center">
                <div className="w-32">
                  {activeChar === "drColi"
                    ? <DrColiSprite isTalking={isSpeaking} />
                    : <BoriSprite isAnimating={isSpeaking} />}
                </div>
              </div>

              {/* Speech bubble — always matches current word */}
              {bubbleText && (
                <div className="bg-white rounded-3xl px-5 py-4 shadow-md border-2 border-primary/10 animate-in fade-in duration-300">
                  <p className="font-bold text-base text-foreground leading-relaxed">{bubbleText}</p>
                </div>
              )}

              {/* Feedback toast */}
              {feedback && (
                <div className="bg-green-100 border-2 border-green-300 rounded-2xl px-5 py-3 text-center animate-in zoom-in duration-200">
                  <p className="font-black text-lg text-green-700">{feedback}</p>
                </div>
              )}

              {/* ── Beige word card — always matches talkWordIdx ── */}
              <div className="bg-[#f5f0e0] rounded-[2rem] border-4 border-[#e8e0c8] p-6 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-5xl leading-none">{talkWord.emoji}</p>
                <p className="text-4xl font-black text-foreground text-center leading-tight">
                  {talkWord.korean}
                </p>
                <p className="text-sm font-bold text-foreground/50 tracking-wide">
                  {talkWord.romanization}
                </p>
                <p className="text-lg font-bold text-foreground/70">{talkWord.english}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleHearAgain}
                  disabled={isSpeaking}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border-2 border-primary/20 font-black text-primary text-sm shadow-sm hover:border-primary active:scale-95 transition-all disabled:opacity-50"
                >
                  🔊 Hear it again
                </button>
                <button
                  onClick={handleISaidIt}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 border-2 border-primary/30 font-black text-primary text-sm shadow-sm hover:bg-primary/20 active:scale-95 transition-all"
                >
                  ✅ I said it!
                </button>
                <button
                  onClick={handleNextWord}
                  disabled={isSpeaking}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border-2 border-muted font-black text-muted-foreground text-sm shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all disabled:opacity-50"
                >
                  ▶ Next word
                </button>
              </div>

            </div>
          </div>

          {/* Mic bar */}
          <div className="flex-shrink-0 p-4 bg-background border-t-2 border-muted/30">
            <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
              {micError ? (
                <div className="w-full max-w-sm py-4 rounded-3xl bg-muted/30 border-2 border-muted text-center font-bold text-muted-foreground text-base">
                  🎤 Speech practice coming soon!
                </div>
              ) : (
                <button
                  onClick={handleMicToggle}
                  className={`w-full max-w-sm py-4 rounded-3xl font-black text-xl shadow-md border-b-4 transition-all active:scale-95 ${
                    isRecording
                      ? "bg-red-500 text-white border-red-700 animate-pulse"
                      : "bg-accent text-accent-foreground border-accent-foreground/20 hover:scale-[1.02]"
                  }`}
                >
                  {isRecording ? "🔴 Tap to stop" : "🎤 Tap to speak"}
                </button>
              )}
              <p className="text-xs font-bold text-muted-foreground text-center">
                {activeChar === "drColi"
                  ? `Dr. Coli is listening — say the word out loud!`
                  : `Bori wants to practice with you — say it together! 🐾`}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
