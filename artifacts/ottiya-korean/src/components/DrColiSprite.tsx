import drColiSprite from "@assets/Dr.Coli_Talk_1777770172647.webp";
import { useEffect, useRef, useState } from "react";

interface DrColiSpriteProps {
  isTalking: boolean;
  className?: string;
}

export function DrColiSprite({ isTalking, className = "" }: DrColiSpriteProps) {
  // Sprite sheet is 3914x4082, 30 frames. Assuming 6 columns x 5 rows for 30 frames.
  // 3914 / 6 = ~652.33px wide, 4082 / 5 = ~816.4px tall
  const frameWidth = 3914 / 6;
  const frameHeight = 4082 / 5;
  const totalFrames = 30;
  const cols = 6;
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (isTalking) {
      timerRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % totalFrames);
      }, 100); // 10fps
    } else {
      setCurrentFrame(0); // Idle frame
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTalking]);

  const col = currentFrame % cols;
  const row = Math.floor(currentFrame / cols);

  const backgroundPositionX = -col * frameWidth;
  const backgroundPositionY = -row * frameHeight;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        width: '100%',
        maxWidth: '300px',
        aspectRatio: '652/816',
      }}
    >
      <div 
        className="absolute w-full h-full"
        style={{
          backgroundImage: `url(${drColiSprite})`,
          backgroundSize: '600% 500%', // 6 cols, 5 rows -> 600% width, 500% height of the container
          backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (4)) * 100}%`,
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }}
      />
    </div>
  );
}
