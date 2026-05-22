import { useEffect, useRef, useState } from "react";
import ottiyaIcon from "@assets/Ottiya_Korean_Icon_1778037715251.png";

interface SplashScreenProps {
  onDone: () => void;
  readyToExit: boolean;
}

export function SplashScreen({ onDone, readyToExit }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Fade in the logo after mount
  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 600);
    return () => clearTimeout(holdTimer);
  }, []);

  // When the parent signals ready, fade out then hand off
  useEffect(() => {
    if (!readyToExit) return;
    setPhase("out");
    const doneTimer = setTimeout(() => onDoneRef.current(), 500);
    return () => clearTimeout(doneTimer);
  }, [readyToExit]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #f5f0ff 0%, #fef9ec 60%, #eaf6ff 100%)",
        transition: "opacity 0.5s ease",
        opacity: phase === "out" ? 0 : 1,
      }}
    >
      {/* Logo */}
      <div
        style={{
          transition: phase === "in"
            ? "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease"
            : "transform 0.35s ease, opacity 0.35s ease",
          transform: phase === "in" ? "scale(0.78)" : "scale(1)",
          opacity: phase === "in" ? 0 : 1,
        }}
      >
        <img
          src={ottiyaIcon}
          alt="Ottiya Korean"
          style={{
            width: 148,
            height: 148,
            borderRadius: 36,
            boxShadow: "0 16px 48px rgba(110,80,200,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      {/* App name */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          transition: "opacity 0.5s ease 0.2s",
          opacity: phase === "in" ? 0 : 1,
        }}
      >
        <p
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#5b21b6",
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          Ottiya Korean
        </p>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#a78bfa",
            marginTop: 4,
            letterSpacing: "0.02em",
          }}
        >
          배워요! Let's learn! 🇰🇷
        </p>
      </div>

      {/* Subtle loading dots */}
      <div
        style={{
          marginTop: 48,
          display: "flex",
          gap: 8,
          transition: "opacity 0.4s ease 0.5s",
          opacity: phase === "in" ? 0 : 1,
        }}
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#c4b5fd",
              animation: `bounce 1.1s ${i * 0.18}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
