import { useEffect, useState } from "react";
import confettiStar from "@assets/confetti-star_1777770240170.png";
import confettiPinkTwirl from "@assets/confetti-pink-twirl_1777801047275.png";
import confettiGreenRibbon from "@assets/confetti-green-ribbon_1777801047275.png";
import confettiGoldenRibbon from "@assets/confetti-golden-ribbon_1777801047275.png";
import confettiBlueRibbon from "@assets/confetti-blue-ribbon_1777801047275.png";

const CONFETTI_TYPES = [
  confettiStar,
  confettiPinkTwirl,
  confettiGreenRibbon,
  confettiGoldenRibbon,
  confettiBlueRibbon
];

export function ConfettiOverlay({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number, type: string, left: string, animationDuration: string, delay: string }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 90 }).map((_, i) => ({
        id: i,
        type: CONFETTI_TYPES[Math.floor(Math.random() * CONFETTI_TYPES.length)],
        left: `${Math.random() * 100}%`,
        animationDuration: `${1.8 + Math.random() * 1.8}s`,
        delay: `${Math.random() * 0.5}s`
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <img 
          key={p.id}
          src={p.type}
          alt="confetti"
          className="absolute top-[-50px] animate-in slide-in-from-top-[100vh] fade-in"
          style={{
            left: p.left,
            width: '14px',
            height: '14px',
            animationName: 'fall',
            animationDuration: p.animationDuration,
            animationDelay: p.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear'
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
