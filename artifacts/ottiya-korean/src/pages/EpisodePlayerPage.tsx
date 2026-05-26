import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import {
  useGetEpisode,
  useTextToSpeech,
  useSpeechToText,
  useAddLogbookEntry,
  useSaveChildProgress,
  customFetch,
} from "@workspace/api-client-react";
import { useVoiceRecorder } from "@workspace/integrations-openai-ai-react";
import { useChildId } from "@/hooks/useChildId";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useStreakTracker } from "@/hooks/useStreakTracker";

import { DrColiSprite } from "@/components/DrColiSprite";
import { BoriSprite } from "@/components/BoriSprite";
import { ConfettiOverlay } from "@/components/ConfettiOverlay";
import { playBase64Mp3, unlockAudioCtx } from "@/lib/audioContext";

import bubbleBg from "@assets/dialogue-bubble_1777770240170.png";
import micBtnBg from "@assets/mic-button_1777770240170.png";

import bgPuppies from "@assets/bg-puppies_1777800269106.webp";
import bgDinos from "@assets/bg-dinos_1777800269106.webp";
import bgPlanes from "@assets/bg-planes_1777800269106.webp";
import kidsYay from "@assets/kids-yay_1777801036430.wav";

// Star rating messages shown on the end screen (index = stars - 1)
const STAR_MESSAGES = [
  "Keep going! You can do it! 💪",
  "Good try! Keep practicing! 🌱",
  "Nice job! You're learning! 🌟",
  "Great job! Almost perfect! ✨",
  "Perfect! You're a star! 🏆",
];
// What Dr. Coli actually speaks aloud on completion (fallback when no completionMessage)
const STAR_VOICE = [
  "Keep going! You can do it!",
  "Good try! Keep practicing!",
  "Nice job! You are learning so fast!",
  "Great job! Almost perfect!",
  "Perfect! You are a superstar!",
];
// Rotating openers — one is picked at random when the episode ends
const COMPLETION_OPENERS = [
  "Nice job, {name}!",
  "You're a superstar, {name}!",
  "Great work, {name}!",
  "Excellent, {name}!",
  "Amazing, {name}!",
  "You did it, {name}!",
];

// Module-level TTS audio cache — persists for the whole browser session.
// Key: "${text}::${character}", Value: base64 mp3 string.
// The same Korean word spoken multiple times (e.g. "선생님" in s0, s1, s5)
// will only ever hit the API once per session.
const ttsCache = new Map<string, string>();
const DR_COLI_CHARACTER = "drColi" as const;

function normalizeKoreanText(text: string) {
  return text
    .trim()
    .replace(/\s+/g, "")
    .replace(/[.,!?~"'“”‘’]/g, "");
}

function transcriptMatchesTarget(transcript: string, target: string) {
  const normalizedTranscript = normalizeKoreanText(transcript);
  const normalizedTarget = normalizeKoreanText(target);
  return normalizedTranscript.includes(normalizedTarget) || normalizedTarget.includes(normalizedTranscript);
}

function interpolateName(text: string, name: string | undefined): string {
  return name ? text.replace(/\{name\}/g, name) : text.replace(/\{name\}/g, "friend");
}

// Replace ㄱ with 기역 before sending to TTS so voices pronounce it correctly.
// Also strips emoji (surrogate pairs) that would be read aloud as e.g. "eggplant".
// Display text is never touched — only the API payload changes.
function prepareForTts(text: string): string {
  return text
    .replace(/ㄱ/g, "기역")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .trim();
}

// Replace spaces between Korean characters with non-breaking spaces so Korean
// phrases (e.g. 이게 뭐예요?) always render on a single line.
function formatDisplayText(text: string): string {
  return text.replace(
    /([\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]) ([\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F])/g,
    "$1\u00A0$2"
  );
}

export default function EpisodePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const childId = useChildId();
  const { profile } = useChildProfile();
  const childName = profile?.name;
  const { data: episode, isLoading } = useGetEpisode(id || "");

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [interactionResult, setInteractionResult] = useState<"correct" | "wrong" | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [episodeStars, setEpisodeStars] = useState(1);
  const [micBusy, setMicBusy] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(bgPuppies);
  const [celebrate, setCelebrate] = useState(false);
  const [waveCheckActive, setWaveCheckActive] = useState(false);
  const [completionMsg, setCompletionMsg] = useState("");
  // Track first-try accuracy via refs so advanceScene always reads the current value
  const firstTryCorrectRef = useRef(0);
  const failedSceneIdsRef = useRef(new Set<string>());
  // Wrong attempt counter — resets each scene. After 2 failures Dr. Coli gently explains and moves on.
  const wrongAttemptsRef = useRef(0);

  // Bori's spoken line — set while she's speaking, cleared when audio ends
  const [boriLine, setBoriLine] = useState<string | null>(null);
  const [isBoriSpeaking, setIsBoriSpeaking] = useState(false);
  const stopBoriRef = useRef<(() => void) | null>(null);

  const { mutate: tts } = useTextToSpeech();
  const { mutate: stt } = useSpeechToText();
  const { mutate: saveProgress } = useSaveChildProgress();
  const { mutate: addLogbook } = useAddLogbookEntry();

  const { state: voiceState, startRecording, stopRecording } = useVoiceRecorder();
  const { markToday } = useStreakTracker();

  const postWordAttempt = (korean: string, correct: boolean) => {
    customFetch(`/api/children/${childId}/word-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ korean, correct }),
    }).catch(() => {});
  };

  const postEpisodeCompletion = () => {
    customFetch(`/api/children/${childId}/episode-completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ episodeId: id }),
    }).catch(() => {});
  };

  const stopDrColiRef = useRef<(() => void) | null>(null);
  const prefetchKeyRef = useRef<string>("");
  // Callback fired after the current audio finishes — used to reset wrong-answer state
  const afterSpeakRef = useRef<(() => void) | null>(null);
  // Hint timer — whispers the target word if the mic sits idle too long
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintCountRef = useRef(0);
  // Stable refs so setTimeout callbacks read current values without stale closures
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const voiceStateRef = useRef<string>("idle");
  const currentInteractionRef = useRef<any>(null);

  const currentScene = episode?.scenes?.[currentSceneIndex] as any;
  const rawDialogueLine = currentScene?.drColi?.say?.[currentDialogueIndex] as string | undefined;
  const currentDialogue = rawDialogueLine ? interpolateName(rawDialogueLine, childName) : undefined;
  const isOnLastDialogue = currentDialogueIndex === (currentScene?.drColi?.say?.length ?? 1) - 1;

  // What shows in the bubble: response text takes priority over scene dialogue
  const displayedText = responseText ?? currentDialogue;

  // Interaction is "active" when we're on the last dialogue, no pending answer, and Bori has finished speaking
  const showingInteraction = currentScene?.interaction?.type !== "none" && isOnLastDialogue && !interactionResult && !boriLine;

  // Show hand pointer whenever dialogue is visible, Dr. Coli isn't speaking/processing, and no pending interaction


  // Dr. Coli animated whenever speaking, processing, or an interaction is active
  const drColiTalking = isSpeaking || isProcessing || showingInteraction;

  // Play current scene dialogue when scene/dialogue index changes.
  // Non-last lines auto-advance as soon as audio ends — no tap needed between lines.
  // On the last line, if the scene has a bori.say, Bori speaks before the interaction appears.
  useEffect(() => {
    if (!lessonStarted) return undefined;
    if (currentDialogue && !interactionResult) {
      setResponseText(null);
      setBoriLine(null);
      const t = setTimeout(() => {
        playDialogue(currentDialogue);
        if (!isOnLastDialogue) {
          afterSpeakRef.current = () => setCurrentDialogueIndex(prev => prev + 1);
        } else {
          const boriSay = currentScene?.bori?.say
            ? interpolateName(currentScene.bori.say as string, childName)
            : undefined;
          if (boriSay) {
            afterSpeakRef.current = () => playBoriLine(boriSay);
          }
        }
      }, 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [lessonStarted, currentSceneIndex, currentDialogueIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fetch ALL TTS audio for the current scene the moment it loads.
  // This ensures every play() is a synchronous cache hit — browsers block play()
  // inside async TTS callbacks (autoplay policy), but allow it on cache hits.
  useEffect(() => {
    if (!lessonStarted || !currentScene) return;

    const sayLines: string[] = currentScene?.drColi?.say ?? [];
    sayLines.forEach((rawLine: string) => {
      const line = interpolateName(rawLine, childName);
      const cacheKey = `${line}::drColi`;
      if (!ttsCache.has(cacheKey)) {
        tts({ data: { text: prepareForTts(line), character: DR_COLI_CHARACTER } }, {
          onSuccess: (res) => ttsCache.set(cacheKey, res.audio),
        });
      }
    });

    const rawBoriSay = currentScene?.bori?.say as string | undefined;
    if (rawBoriSay) {
      const boriSay = interpolateName(rawBoriSay, childName);
      const cacheKey = `${boriSay}::bori`;
      if (!ttsCache.has(cacheKey)) {
        tts({ data: { text: prepareForTts(boriSay), character: "bori" } }, {
          onSuccess: (res) => ttsCache.set(cacheKey, res.audio),
        });
      }
    }
  }, [lessonStarted, currentSceneIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch the mic scene's correct-answer TTS into ttsCache as soon as the mic
  // button appears. speakText() will get an instant cache hit when the answer is correct.
  useEffect(() => {
    if (!lessonStarted) return;
    if (currentScene?.interaction?.type !== "mic" || !isOnLastDialogue) return;
    const rawCorrectText = currentScene.interaction?.onCorrectSay?.[0] as string | undefined;
    if (!rawCorrectText) return;
    const correctText = interpolateName(rawCorrectText, childName);

    const key = `${currentSceneIndex}-${currentDialogueIndex}-correct`;
    if (prefetchKeyRef.current === key) return;
    prefetchKeyRef.current = key;

    const cacheKey = `${correctText}::drColi`;
    if (ttsCache.has(cacheKey)) return;

    tts({ data: { text: prepareForTts(correctText), character: DR_COLI_CHARACTER } }, {
      onSuccess: (res) => { ttsCache.set(cacheKey, res.audio); }
    });
  }, [lessonStarted, currentSceneIndex, currentDialogueIndex, isOnLastDialogue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep refs in sync so setTimeout callbacks always read fresh values
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { currentInteractionRef.current = currentScene?.interaction; });

  // Whisper hint: if the mic sits idle for 5 s, Dr. Coli gently repeats the
  // target word. Fires a second time 8 s later if still unanswered (max 2 hints).
  useEffect(() => {
    if (!lessonStarted) return;
    const clearHint = () => {
      if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    };
    clearHint();
    hintCountRef.current = 0;

    if (!showingInteraction || currentScene?.interaction?.type !== "mic") return clearHint;

    const scheduleHint = (delayMs: number) => {
      hintTimerRef.current = setTimeout(() => {
        hintTimerRef.current = null;
        // Only play if still idle — don't interrupt recording or speaking
        if (isSpeakingRef.current || isProcessingRef.current || voiceStateRef.current !== "idle") return;
        if (currentInteractionRef.current?.type !== "mic") return;

        hintCountRef.current += 1;
        const word = currentInteractionRef.current?.targetWord as string | undefined;
        if (word) speakText(word); // cache hit — instant, no API call
        if (hintCountRef.current < 2) scheduleHint(8000);
      }, delayMs);
    };

    scheduleHint(5000);
    return clearHint;
  }, [lessonStarted, showingInteraction, currentSceneIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Number of scenes in this episode that actually have an interaction
  const totalInteractiveScenes = (episode?.scenes as any[] ?? []).filter(
    (s: any) => s.interaction?.type !== "none"
  ).length || 1;

  // When the episode finishes: mark today as active in the streak, then Dr. Coli speaks
  useEffect(() => {
    if (!lessonStarted) return;
    if (!isCompleted) return;
    markToday();
    const vocabPart = (episode as any)?.completionMessage ?? STAR_VOICE[episodeStars - 1];
    const openerTemplate = COMPLETION_OPENERS[Math.floor(Math.random() * COMPLETION_OPENERS.length)];
    const opener = interpolateName(openerTemplate, childName);
    const msg = `${opener} ${vocabPart}`;
    setCompletionMsg(msg);
    const t = setTimeout(() => speakText(msg), 900);
    return () => clearTimeout(t);
  }, [lessonStarted, isCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop all audio when the component unmounts (e.g. user navigates home mid-lesson).
  useEffect(() => {
    return () => {
      stopDrColiRef.current?.();
      stopDrColiRef.current = null;
      stopBoriRef.current?.();
      stopBoriRef.current = null;
      afterSpeakRef.current = null;
    };
  }, []);

  const stopCurrentAudio = () => {
    stopDrColiRef.current?.();
    stopDrColiRef.current = null;
  };

  // Core: play a base64 mp3 string via AudioContext (never blocked by autoplay policy),
  // manage isSpeaking, and fire afterSpeakRef when done.
  const playBase64Audio = (base64: string) => {
    stopCurrentAudio();
    const stop = playBase64Mp3(base64, () => {
      if (stopDrColiRef.current === stop) stopDrColiRef.current = null;
      setIsSpeaking(false);
      const cb = afterSpeakRef.current;
      afterSpeakRef.current = null;
      cb?.();
    });
    stopDrColiRef.current = stop;
  };

  // Speak any text through Dr. Coli, checking the cache before calling the API.
  // If already cached this session (same text + character), plays instantly.
  const speakText = (text: string, character: typeof DR_COLI_CHARACTER = DR_COLI_CHARACTER) => {
    stopCurrentAudio();
    setIsProcessing(false);
    setIsSpeaking(true);

    const cacheKey = `${text}::${character}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      playBase64Audio(cached);
      return;
    }

    tts({ data: { text: prepareForTts(text), character } }, {
      onSuccess: (res) => {
        ttsCache.set(cacheKey, res.audio); // store for future replays
        playBase64Audio(res.audio);
      },
      onError: () => setIsSpeaking(false)
    });
  };

  // Play a scene dialogue line (clears any response text first)
  const playDialogue = (text: string) => {
    speakText(text);
  };

  // Play Bori's vocalization using her echo voice — separate audio track so it
  // doesn't interfere with Dr. Coli's audio or afterSpeakRef.
  const playBoriLine = (text: string, afterBori?: () => void) => {
    stopBoriRef.current?.();
    stopBoriRef.current = null;
    setBoriLine(text);
    setIsBoriSpeaking(true);
    const onEnd = () => { setIsBoriSpeaking(false); setBoriLine(null); afterBori?.(); };
    const cacheKey = `${text}::bori`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      stopBoriRef.current = playBase64Mp3(cached, onEnd);
      return;
    }
    tts({ data: { text: prepareForTts(text), character: "bori" } }, {
      onSuccess: (res) => {
        ttsCache.set(cacheKey, res.audio);
        stopBoriRef.current = playBase64Mp3(res.audio, onEnd);
      },
      onError: onEnd,
    });
  };

  // Play a correct/wrong response. The ttsCache already holds the audio from the
  // prefetch effect, so speakText() gets an instant cache hit most of the time.
  const playResponse = (text: string) => {
    stopCurrentAudio();
    setResponseText(text);
    setIsProcessing(false);
    speakText(text);
  };

  const celebrateCorrectAnswer = () => {
    const audio = new Audio(kidsYay);
    audio.play().catch(() => {});
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2200);
  };

  const handleNextDialogue = () => {
    if (isSpeaking || isProcessing) return;
    if (showingInteraction) return;

    stopCurrentAudio();
    setIsSpeaking(false);
    setResponseText(null);

    const sayArray = currentScene?.drColi?.say;
    if (sayArray && currentDialogueIndex < sayArray.length - 1) {
      setCurrentDialogueIndex(prev => prev + 1);
    } else if (currentScene?.interaction?.type === "none" || interactionResult === "correct") {
      advanceScene();
    }
  };

  const advanceScene = () => {
    setInteractionResult(null);
    setResponseText(null);
    setCurrentDialogueIndex(0);
    prefetchKeyRef.current = "";
    afterSpeakRef.current = null;
    setWaveCheckActive(false);
    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    hintCountRef.current = 0;
    wrongAttemptsRef.current = 0;
    stopBoriRef.current?.();
    stopBoriRef.current = null;
    setBoriLine(null);
    setIsBoriSpeaking(false);

    if (episode && currentSceneIndex < (episode.scenes?.length || 0) - 1) {
      saveProgress({ childId, data: { episodeId: id!, sceneId: currentScene.id, stars: 1 } });
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      const totalInteractive = (episode?.scenes as any[] ?? []).filter(
        (s: any) => s.interaction?.type !== "none"
      ).length || 1;
      const stars = Math.max(1, Math.round((firstTryCorrectRef.current / totalInteractive) * 5));
      setEpisodeStars(stars);
      saveProgress({ childId, data: { episodeId: id!, sceneId: currentScene?.id || "", stars } });
      postEpisodeCompletion();
      setIsCompleted(true);
    }
  };

  const handleEmojiChoice = (index: number) => {
    const isCorrect = index === currentScene?.interaction?.correctIndex;
    setInteractionResult(isCorrect ? "correct" : "wrong");
    const emojiWord: string =
      (currentScene?.taughtWord as any)?.korean ??
      currentScene?.interaction?.choices?.[currentScene?.interaction?.correctIndex] ??
      "";

    if (isCorrect) {
      if (!failedSceneIdsRef.current.has(currentScene.id)) firstTryCorrectRef.current += 1;
      if (emojiWord) postWordAttempt(emojiWord, true);
      const text = interpolateName(currentScene?.interaction?.onCorrectSay?.[0] || "Great job!", childName);
      if (currentScene?.taughtWord) {
        addLogbook({ childId, data: { ...currentScene.taughtWord, episodeId: id } });
      }
      celebrateCorrectAnswer();
      playResponse(text); // uses prefetch if available
    } else {
      if (emojiWord) postWordAttempt(emojiWord, false);
      failedSceneIdsRef.current.add(currentScene.id);
      const text = interpolateName(currentScene?.interaction?.onWrongSay?.[0] || "Try again!", childName);
      // Set afterSpeakRef BEFORE speaking so it fires when audio ends
      afterSpeakRef.current = () => {
        setInteractionResult(null); // emoji choices reappear for another attempt
        setResponseText(null);
      };
      setResponseText(text);
      setIsProcessing(false);
      speakText(text); // use speakText directly — don't consume the correct-answer prefetch
    }
  };

  const handleWaveChoice = (index: number) => {
    const isCorrect = index === 0;
    setInteractionResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      if (!failedSceneIdsRef.current.has(currentScene.id)) firstTryCorrectRef.current += 1;
      celebrateCorrectAnswer();
      playResponse("Great job!");
      window.setTimeout(() => {
        setWaveCheckActive(false);
        setInteractionResult(null);
        setResponseText(null);
      }, 1200);
    } else {
      setResponseText("Try waving!");
      speakText("Try waving!");
    }
  };

  const handleMicClick = async () => {
    if (micBusy) return;

    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    setMicBusy(true);

    try {
      if (voiceState === "recording") {
        setIsProcessing(true);
        const blob = await stopRecording();
        setIsProcessing(false);
        if (!blob || blob.size === 0) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(",")[1];
          stt({ data: { audio: base64Audio } }, {
            onSuccess: (res) => {
              const transcript = res.transcript?.trim() ?? "";
              const targetWord = currentScene?.interaction?.targetWord as string | undefined;
              const targets = (currentScene?.interaction?.targets as string[] | undefined) ?? [];
              const micWord: string = (currentScene?.taughtWord as any)?.korean ?? targetWord ?? "";
              const matched =
                transcript.length > 0 &&
                (
                  (targetWord ? transcriptMatchesTarget(transcript, targetWord) : false) ||
                  targets.some((target) => transcriptMatchesTarget(transcript, target))
                );

              if (matched) {
                setInteractionResult("correct");
                if (!failedSceneIdsRef.current.has(currentScene.id)) firstTryCorrectRef.current += 1;
                if (micWord) postWordAttempt(micWord, true);
                if (currentScene?.taughtWord) {
                  addLogbook({ childId, data: { ...currentScene.taughtWord, episodeId: id } });
                }
                const correctText = interpolateName(currentScene?.interaction?.onCorrectSay?.[0] || "You said it!", childName);
                celebrateCorrectAnswer();
                const rawBoriAfter = (currentScene?.interaction as any)?.boriOnCorrect as string | undefined;
                if (rawBoriAfter) {
                  afterSpeakRef.current = () => {
                    playBoriLine(interpolateName(rawBoriAfter, childName), advanceScene);
                  };
                }
                playResponse(correctText);
              } else {
                wrongAttemptsRef.current += 1;
                if (micWord) postWordAttempt(micWord, false);
                failedSceneIdsRef.current.add(currentScene.id);
                setInteractionResult("wrong");
                setIsProcessing(false);

                if (wrongAttemptsRef.current >= 2) {
                  // 2nd failure — gently explain and move on
                  const tw = currentScene?.taughtWord as any;
                  const gentleText = tw
                    ? `That's okay! ${tw.korean} means ${tw.english} in Korean. Let's keep going!`
                    : "That's okay! Let's keep going!";
                  setResponseText(gentleText);
                  afterSpeakRef.current = advanceScene;
                  speakText(gentleText);
                } else {
                  const wrongText = interpolateName(currentScene?.interaction?.onWrongSay?.[0] || "I couldn't hear you — try again!", childName);
                  afterSpeakRef.current = () => {
                    setInteractionResult(null);
                    setResponseText(null);
                  };
                  setResponseText(wrongText);
                  speakText(wrongText);
                }
              }
            },
            onError: () => {
              const micWord: string = (currentScene?.taughtWord as any)?.korean ??
                (currentScene?.interaction?.targetWord as string | undefined) ?? "";
              if (micWord) postWordAttempt(micWord, false);
              wrongAttemptsRef.current += 1;
              setInteractionResult("wrong");
              setIsProcessing(false);

              if (wrongAttemptsRef.current >= 2) {
                const tw = currentScene?.taughtWord as any;
                const gentleText = tw
                  ? `That's okay! ${tw.korean} means ${tw.english} in Korean. Let's keep going!`
                  : "That's okay! Let's keep going!";
                setResponseText(gentleText);
                afterSpeakRef.current = advanceScene;
                speakText(gentleText);
              } else {
                afterSpeakRef.current = () => {
                  setInteractionResult(null);
                  setResponseText(null);
                };
                setResponseText("I couldn't hear you — try again!");
                speakText("I couldn't hear you — try again!");
              }
            }
          });
        };
        return;
      }
      setInteractionResult(null);
      setResponseText(null);
      setIsProcessing(false);
      await startRecording();
    } finally {
      setMicBusy(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-primary text-2xl font-bold animate-pulse">Loading...</div>;
  }

  if (!episode) return <div className="p-8 text-center text-xl">Episode not found.</div>;

  const backgroundChoices = [
    { label: "Puppies", src: bgPuppies },
    { label: "Dinos", src: bgDinos },
    { label: "Planes", src: bgPlanes },
  ];

  return (
    <div
      className="h-[100dvh] w-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: episode.background || "var(--color-background)",
        backgroundImage: `linear-gradient(rgba(255,255,255,.10), rgba(255,255,255,.10)), url(${selectedBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ConfettiOverlay active={isCompleted || celebrate} />

      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-center px-4 pt-4 pb-2 z-50">
        <Link
          href="/?skipSetup=1"
          className="bg-white/80 backdrop-blur rounded-full px-5 py-2.5 font-bold text-primary shadow-sm hover:scale-105 transition-transform text-sm"
          data-testid="btn-back"
        >
          ← Back
        </Link>
        <div className="bg-white/80 backdrop-blur rounded-full px-5 py-2.5 font-bold text-foreground shadow-sm text-sm">
          Scene {currentSceneIndex + 1} / {episode.scenes?.length}
        </div>
      </header>

      {!lessonStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
          <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-[2rem] p-5 shadow-lg">
            <p className="text-center text-sm font-black uppercase tracking-widest text-foreground/40">Choose a background</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {backgroundChoices.map((choice) => (
                <button
                  key={choice.label}
                  onClick={() => setSelectedBackground(choice.src)}
                  className={`rounded-2xl overflow-hidden border-4 transition-all ${selectedBackground === choice.src ? "border-primary scale-105" : "border-transparent opacity-90"}`}
                >
                  <img src={choice.src} alt={choice.label} className="w-full h-24 object-cover" />
                  <div className="bg-white/90 text-xs font-black py-2">{choice.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { unlockAudioCtx(); setLessonStarted(true); }}
              className="mt-5 w-full bg-primary text-primary-foreground font-black text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Start Lesson
            </button>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="flex-1 flex flex-col items-center justify-between py-6 px-6 animate-in fade-in duration-500">

          {/* Stars + message */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
            <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">Episode Complete!</p>

            {/* Animated stars — each pops in with a staggered delay */}
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-6xl inline-block ${i < episodeStars ? "animate-in zoom-in duration-300" : "opacity-15"}`}
                  style={i < episodeStars ? { animationDelay: `${i * 180}ms`, animationFillMode: "both" } : undefined}
                >
                  {i < episodeStars ? "⭐" : "☆"}
                </span>
              ))}
            </div>

            {/* Message bubble */}
            <div
              className="relative px-10 py-5 flex items-center justify-center w-full max-w-sm"
              style={{
                backgroundImage: `url(${bubbleBg})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                minHeight: "90px",
              }}
            >
              <p className="text-lg font-black text-foreground text-center leading-snug">
                {completionMsg || ((episode as any)?.completionMessage ?? STAR_MESSAGES[episodeStars - 1])}
              </p>
            </div>

            {/* Score detail */}
            <p className="text-sm font-bold text-foreground/40">
              {firstTryCorrectRef.current} / {totalInteractiveScenes} perfect on first try
            </p>
          </div>

          {/* Characters celebrating at bottom */}
          <div className="flex items-end justify-center gap-4 w-full max-w-xs mb-4">
            <div style={{ width: "38%", maxWidth: "160px" }}>
              <DrColiSprite isTalking={isSpeaking} />
            </div>
            <div style={{ width: "28%", maxWidth: "120px" }}>
              <BoriSprite isAnimating={true} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground font-black text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
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
      ) : (
        <>
          {/* ── MAIN CONTENT ZONE — dialogue + interactions, centered ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 pb-3 gap-4 min-h-0">

            {/* character_intro badge — subtle label on introduction scenes */}
            {currentScene?.type === "character_intro" && !interactionResult && !displayedText && (
              <div className="bg-white/90 backdrop-blur rounded-full px-5 py-2 animate-in fade-in duration-400">
                <p className="text-xs font-black text-primary uppercase tracking-widest">✨ Meet the characters!</p>
              </div>
            )}

            {/* teach_word card — tappable to hear Dr. Coli say the word */}
            {currentScene?.type === "teach_word" && currentScene?.taughtWord && isOnLastDialogue && !interactionResult && (
              <button
                onClick={() => speakText((currentScene.taughtWord as any).korean)}
                disabled={isSpeaking}
                className="bg-white/95 rounded-3xl shadow-xl border-4 border-primary/25 px-8 py-4 text-center animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm active:scale-95 transition-transform disabled:opacity-80 group"
              >
                <p className="text-xs font-black text-primary/50 uppercase tracking-widest mb-1.5">✨ New Word!</p>
                <p className="text-5xl font-black text-foreground leading-tight">
                  {(currentScene.taughtWord as any).emoji} {(currentScene.taughtWord as any).korean}
                </p>
                <p className="text-sm font-bold text-muted-foreground mt-1">
                  {(currentScene.taughtWord as any).romanization}
                </p>
                <p className="text-base font-bold text-foreground/70 mt-0.5">
                  {(currentScene.taughtWord as any).english}
                </p>
                <p className="text-xs font-black text-primary mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {isSpeaking ? "🔊 Playing..." : "🔊 Tap to hear it!"}
                </p>
              </button>
            )}

            {/* Dialogue bubble — clickable to advance */}
            {displayedText && (
              <div
                className="relative w-full max-w-xl px-6 py-5 sm:px-10 sm:py-7 flex items-center justify-center cursor-pointer"
                onClick={handleNextDialogue}
                data-testid="dialogue-bubble"
                style={{
                  backgroundImage: `url(${bubbleBg})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  minHeight: "90px",
                }}
              >
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground text-center leading-snug break-keep">
                  {isProcessing ? "Hmm..." : formatDisplayText(displayedText)}
                </p>
              </div>
            )}

            {waveCheckActive && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <p className="text-sm font-bold text-foreground/60 bg-white/70 px-4 py-1.5 rounded-full">
                  Wave your hand!
                </p>
                <div
                  className="relative px-4 py-3 flex justify-around items-center gap-3 w-full max-w-sm"
                  style={{
                    background: "rgba(101, 211, 211, 0.55)",
                    border: "4px solid rgba(101, 211, 211, 0.8)",
                    borderRadius: "9999px",
                    boxShadow: "0 8px 20px rgba(80, 180, 180, 0.22)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {["👋", "✋", "🤚"].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWaveChoice(idx)}
                      className="text-4xl bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                      data-testid={`wave-choice-${idx}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mic interaction */}
            {currentScene?.interaction?.type === "mic" && isOnLastDialogue && !interactionResult && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {currentScene.interaction.hint && (
                  <p className="text-sm font-bold text-foreground/60 bg-white/70 px-4 py-1.5 rounded-full">
                    ({currentScene.interaction.hint})
                  </p>
                )}
                <button
                  onClick={handleMicClick}
                  disabled={isProcessing}
                  className={`w-24 h-24 rounded-full shadow-xl transition-all select-none
                    cursor-pointer
                    ${voiceState === "recording"
                      ? "ring-4 ring-violet-400 ring-offset-2 animate-pulse"
                      : isProcessing
                      ? "opacity-60 scale-95"
                      : "hover:scale-105 active:scale-95"
                    }`}
                  style={{ backgroundImage: `url(${micBtnBg})`, backgroundSize: "cover" }}
                  data-testid="mic-button"
                />
                {voiceState === "recording" && (
                  <div className="flex items-end gap-1 h-6">
                    <span className="voice-wave h-3" />
                    <span className="voice-wave h-5" />
                    <span className="voice-wave h-4" />
                    <span className="voice-wave h-6" />
                    <span className="voice-wave h-3" />
                  </div>
                )}
                <p className="text-sm font-black bg-white/90 px-5 py-1.5 rounded-full shadow-sm text-primary">
                  {isProcessing
                    ? "Thinking... 🤔"
                    : voiceState === "recording"
                    ? "🔴 Tap to finish talking!"
                    : "Tap to speak!"}
                </p>
              </div>
            )}

            {/* Emoji interaction */}
            {currentScene?.interaction?.type === "emoji" && isOnLastDialogue && !interactionResult && (
              <div
                className="relative px-4 py-3 flex justify-around items-center gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300"
                style={{
                  background: "rgba(101, 211, 211, 0.55)",
                  border: "4px solid rgba(101, 211, 211, 0.8)",
                  borderRadius: "9999px",
                  boxShadow: "0 8px 20px rgba(80, 180, 180, 0.22)",
                  backdropFilter: "blur(6px)",
                }}
              >
                {currentScene.interaction.choices?.map((emoji: string, idx: number) => {
                  const imgSrc: string | null | undefined =
                    (currentScene.interaction as any).choiceImages?.[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleEmojiChoice(idx)}
                      className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                      data-testid={`emoji-choice-${idx}`}
                    >
                      {imgSrc
                        ? <img src={imgSrc} alt={emoji} className="w-10 h-10 object-contain" />
                        : <span className="text-4xl">{emoji}</span>
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CHARACTERS STRIP — fixed tall band at bottom ── */}
          <div className="flex-shrink-0 flex items-end justify-between px-2 pb-2 h-[42vh]">
            <div className="w-[55%] max-w-[280px]">
              <DrColiSprite isTalking={drColiTalking || isCompleted} />
            </div>
            <div className="w-[40%] max-w-[200px] relative">
              {/* Bori speech bubble — appears when she vocalises */}
              {boriLine && (
                <div className="absolute -top-2 right-0 -translate-y-full max-w-[160px] bg-white/95 rounded-2xl px-3 py-2 shadow-lg border-2 border-secondary/30 animate-in fade-in zoom-in-95 duration-200 text-center">
                  <p className="text-sm font-black text-foreground leading-snug">{formatDisplayText(boriLine)}</p>
                  <div className="absolute bottom-0 right-6 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95" />
                </div>
              )}
              <BoriSprite isAnimating={isBoriSpeaking || currentScene?.bori?.animation !== "look" || showingInteraction} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
