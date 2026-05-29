import { useEffect, useRef, useState } from "react";
import waveSrc from "@assets/Bori_Wave_1777772929700.webp";
import bowSrc  from "@assets/Bori_Bow.png";

// ── Wave frames (21 total) ─────────────────────────────────────────────────

type Frame = { x: number; y: number; w: number; h: number; sx: number; sy: number; sw: number; sh: number };

const WAVE_FRAMES: Frame[] = [
  { x: 609,  y: 2094, w: 602, h: 684, sx: 660, sy: 214, sw: 602, sh: 684 }, // 00
  { x: 1281, y: 1404, w: 602, h: 686, sx: 660, sy: 212, sw: 602, sh: 686 }, // 01
  { x: 2,    y: 2073, w: 603, h: 686, sx: 659, sy: 212, sw: 603, sh: 686 }, // 02
  { x: 1358, y: 2,    w: 603, h: 686, sx: 659, sy: 212, sw: 603, sh: 686 }, // 03
  { x: 1965, y: 2,    w: 603, h: 686, sx: 659, sy: 212, sw: 603, sh: 686 }, // 04
  { x: 2572, y: 2,    w: 603, h: 686, sx: 659, sy: 212, sw: 603, sh: 686 }, // 05
  { x: 674,  y: 1404, w: 603, h: 686, sx: 659, sy: 212, sw: 603, sh: 686 }, // 06
  { x: 1215, y: 2094, w: 602, h: 684, sx: 660, sy: 214, sw: 602, sh: 684 }, // 07
  { x: 701,  y: 720,  w: 605, h: 680, sx: 660, sy: 218, sw: 605, sh: 680 }, // 08
  { x: 1310, y: 720,  w: 603, h: 678, sx: 662, sy: 220, sw: 603, sh: 678 }, // 09
  { x: 2520, y: 692,  w: 602, h: 674, sx: 663, sy: 224, sw: 602, sh: 674 }, // 10
  { x: 1887, y: 1402, w: 594, h: 668, sx: 668, sy: 230, sw: 594, sh: 668 }, // 11
  { x: 2485, y: 1385, w: 586, h: 667, sx: 671, sy: 231, sw: 586, sh: 667 }, // 12
  { x: 1821, y: 2094, w: 578, h: 683, sx: 675, sy: 215, sw: 578, sh: 683 }, // 13
  { x: 2403, y: 2074, w: 575, h: 695, sx: 675, sy: 201, sw: 575, sh: 695 }, // 14
  { x: 2982, y: 2056, w: 581, h: 690, sx: 672, sy: 175, sw: 581, sh: 690 }, // 15
  { x: 1917, y: 692,  w: 599, h: 689, sx: 660, sy: 154, sw: 599, sh: 689 }, // 16
  { x: 719,  y: 2,    w: 635, h: 714, sx: 641, sy: 142, sw: 635, sh: 714 }, // 17
  { x: 2,    y: 1376, w: 668, h: 693, sx: 625, sy: 143, sw: 668, sh: 693 }, // 18
  { x: 2,    y: 691,  w: 695, h: 681, sx: 612, sy: 148, sw: 695, sh: 681 }, // 19
  { x: 2,    y: 2,    w: 713, h: 685, sx: 606, sy: 157, sw: 713, sh: 685 }, // 20
];

// ── Bow frames (21 total) ──────────────────────────────────────────────────

const BOW_FRAMES: Frame[] = [
  { x: 2,    y: 2028, w: 596, h: 678, sx: 660, sy: 214, sw: 596, sh: 678 }, // 00
  { x: 1833, y: 2036, w: 595, h: 678, sx: 661, sy: 214, sw: 595, sh: 678 }, // 01
  { x: 2,    y: 2710, w: 595, h: 678, sx: 661, sy: 214, sw: 595, sh: 678 }, // 02
  { x: 2,    y: 666,  w: 596, h: 677, sx: 660, sy: 215, sw: 596, sh: 677 }, // 03
  { x: 601,  y: 2710, w: 596, h: 678, sx: 660, sy: 214, sw: 596, sh: 678 }, // 04
  { x: 2,    y: 1347, w: 596, h: 677, sx: 660, sy: 215, sw: 596, sh: 677 }, // 05
  { x: 602,  y: 1348, w: 597, h: 677, sx: 659, sy: 215, sw: 597, sh: 677 }, // 06
  { x: 1203, y: 1355, w: 597, h: 677, sx: 659, sy: 215, sw: 597, sh: 677 }, // 07
  { x: 1804, y: 1355, w: 597, h: 677, sx: 659, sy: 215, sw: 597, sh: 677 }, // 08
  { x: 602,  y: 2029, w: 597, h: 677, sx: 659, sy: 215, sw: 597, sh: 677 }, // 09
  { x: 1201, y: 2717, w: 598, h: 678, sx: 658, sy: 214, sw: 598, sh: 678 }, // 10
  { x: 1803, y: 2718, w: 599, h: 678, sx: 658, sy: 214, sw: 599, sh: 678 }, // 11
  { x: 2,    y: 3392, w: 604, h: 678, sx: 655, sy: 214, sw: 604, sh: 678 }, // 12
  { x: 610,  y: 3399, w: 610, h: 678, sx: 652, sy: 214, sw: 610, sh: 678 }, // 13
  { x: 1224, y: 3400, w: 619, h: 678, sx: 647, sy: 214, sw: 619, sh: 678 }, // 14
  { x: 1203, y: 2036, w: 626, h: 677, sx: 645, sy: 215, sw: 626, sh: 677 }, // 15
  { x: 1238, y: 675,  w: 632, h: 676, sx: 642, sy: 216, sw: 632, sh: 676 }, // 16
  { x: 602,  y: 671,  w: 632, h: 673, sx: 642, sy: 219, sw: 632, sh: 673 }, // 17
  { x: 1255, y: 2,    w: 629, h: 669, sx: 643, sy: 223, sw: 629, sh: 669 }, // 18
  { x: 626,  y: 2,    w: 625, h: 665, sx: 646, sy: 227, sw: 625, sh: 665 }, // 19
  { x: 2,    y: 2,    w: 620, h: 660, sx: 648, sy: 232, sw: 620, sh: 660 }, // 20
];

// ── Crop regions ──────────────────────────────────────────────────────────
const WAVE_CROP = { left: 588, top: 128, w: 750, h: 790 };
const BOW_CROP  = { left: 625, top: 200, w: 680, h: 720 };

const CANVAS_W  = 266;
const WAVE_H    = Math.round(CANVAS_W * (WAVE_CROP.h / WAVE_CROP.w)); // ≈ 280
const BOW_H     = Math.round(CANVAS_W * (BOW_CROP.h  / BOW_CROP.w));  // ≈ 281

export type BoriAnimation = "wave" | "bow" | "look";

interface BoriSpriteProps {
  animation?: BoriAnimation;
  isAnimating?: boolean;
  className?: string;
}

export function BoriSprite({ animation = "wave", isAnimating = true, className = "" }: BoriSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load the correct sprite sheet when animation changes
  useEffect(() => {
    setLoaded(false);
    frameRef.current = 0;
    const src = animation === "bow" ? bowSrc : waveSrc;
    const img = new Image();
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.src = src;
    return () => { img.onload = null; };
  }, [animation]);

  // Animation loop
  useEffect(() => {
    if (!loaded) return;

    const frames  = animation === "bow" ? BOW_FRAMES : WAVE_FRAMES;
    const crop    = animation === "bow" ? BOW_CROP   : WAVE_CROP;
    const canvasH = animation === "bow" ? BOW_H      : WAVE_H;
    const scaleX  = CANVAS_W / crop.w;
    const scaleY  = canvasH  / crop.h;

    const draw = () => {
      const canvas = canvasRef.current;
      const img    = imgRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_W, canvasH);
      const f = frames[frameRef.current];
      ctx.drawImage(
        img,
        f.x, f.y, f.w, f.h,
        (f.sx - crop.left) * scaleX,
        (f.sy - crop.top)  * scaleY,
        f.sw * scaleX,
        f.sh * scaleY,
      );
    };

    draw();

    // "bow" always loops; "wave" respects isAnimating; "look" freezes on frame 0
    const shouldAnimate = animation === "bow" || (animation === "wave" && isAnimating);
    if (!shouldAnimate) return;

    const id = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length;
      draw();
    }, 80);

    return () => window.clearInterval(id);
  }, [loaded, animation, isAnimating]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasH = animation === "bow" ? BOW_H : WAVE_H;

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={canvasH}
      className={`w-full object-contain ${className}`}
      style={{ maxWidth: `${CANVAS_W}px` }}
    />
  );
}
