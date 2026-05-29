import { useEffect, useRef, useState } from "react";
import drColiTalkSrc from "@assets/Dr.Coli_Talk_1777770172647.webp";
import drColiWave0Src from "@assets/Dr.Coli_Wave-0.png";
import drColiWave1Src from "@assets/Dr.Coli_Wave-1.png";
import drColiBowSrc from "@assets/Dr.Coli_Bow.png";

// ── Wave frames (34 total, frames 000–033 split across two sheets) ─────────

type WaveFrame = { sheet: 0 | 1; x: number; y: number; w: number; h: number; sx: number; sy: number; sw: number; sh: number };

const WAVE_FRAMES: WaveFrame[] = [
  { sheet: 0, x: 1944, y: 2,    w: 650, h: 812, sx: 669, sy: 155, sw: 650, sh: 812 }, // 000
  { sheet: 0, x: 2598, y: 2,    w: 649, h: 813, sx: 674, sy: 155, sw: 649, sh: 813 }, // 001
  { sheet: 0, x: 1290, y: 2,    w: 650, h: 813, sx: 675, sy: 155, sw: 650, sh: 813 }, // 002
  { sheet: 1, x: 1309, y: 2,    w: 648, h: 810, sx: 671, sy: 157, sw: 648, sh: 810 }, // 003
  { sheet: 1, x: 2,    y: 816,  w: 648, h: 810, sx: 668, sy: 157, sw: 648, sh: 810 }, // 004
  { sheet: 0, x: 3168, y: 837,  w: 648, h: 813, sx: 665, sy: 154, sw: 648, sh: 813 }, // 005
  { sheet: 1, x: 1961, y: 2,    w: 644, h: 818, sx: 657, sy: 149, sw: 644, sh: 818 }, // 006
  { sheet: 0, x: 644,  y: 2,    w: 642, h: 822, sx: 651, sy: 145, sw: 642, sh: 822 }, // 007
  { sheet: 0, x: 642,  y: 834,  w: 630, h: 828, sx: 638, sy: 139, sw: 630, sh: 828 }, // 008
  { sheet: 0, x: 1934, y: 1654, w: 632, h: 830, sx: 632, sy: 137, sw: 632, sh: 830 }, // 009
  { sheet: 0, x: 3251, y: 2,    w: 628, h: 831, sx: 629, sy: 136, sw: 628, sh: 831 }, // 010
  { sheet: 0, x: 1907, y: 819,  w: 629, h: 831, sx: 629, sy: 136, sw: 629, sh: 831 }, // 011
  { sheet: 0, x: 2570, y: 1654, w: 629, h: 830, sx: 633, sy: 137, sw: 629, sh: 830 }, // 012
  { sheet: 0, x: 2,    y: 834,  w: 636, h: 828, sx: 641, sy: 139, sw: 636, sh: 828 }, // 013
  { sheet: 0, x: 2,    y: 2,    w: 638, h: 828, sx: 642, sy: 139, sw: 638, sh: 828 }, // 014
  { sheet: 0, x: 2,    y: 2497, w: 641, h: 822, sx: 651, sy: 145, sw: 641, sh: 822 }, // 015
  { sheet: 0, x: 647,  y: 2495, w: 644, h: 819, sx: 657, sy: 148, sw: 644, sh: 819 }, // 016
  { sheet: 1, x: 2609, y: 2,    w: 647, h: 813, sx: 663, sy: 154, sw: 647, sh: 813 }, // 017
  { sheet: 1, x: 2609, y: 819,  w: 647, h: 813, sx: 663, sy: 154, sw: 647, sh: 813 }, // 018
  { sheet: 1, x: 654,  y: 816,  w: 648, h: 810, sx: 668, sy: 157, sw: 648, sh: 810 }, // 019
  { sheet: 1, x: 2,    y: 2,    w: 650, h: 810, sx: 672, sy: 157, sw: 650, sh: 810 }, // 020
  { sheet: 1, x: 656,  y: 2,    w: 649, h: 810, sx: 671, sy: 157, sw: 649, sh: 810 }, // 021
  { sheet: 1, x: 1956, y: 824,  w: 647, h: 810, sx: 669, sy: 157, sw: 647, sh: 810 }, // 022
  { sheet: 1, x: 1306, y: 816,  w: 646, h: 811, sx: 665, sy: 156, sw: 646, sh: 811 }, // 023
  { sheet: 0, x: 1286, y: 1664, w: 644, h: 819, sx: 657, sy: 148, sw: 644, sh: 819 }, // 024
  { sheet: 0, x: 643,  y: 1666, w: 639, h: 825, sx: 647, sy: 142, sw: 639, sh: 825 }, // 025
  { sheet: 0, x: 3203, y: 1654, w: 633, h: 828, sx: 641, sy: 139, sw: 633, sh: 828 }, // 026
  { sheet: 0, x: 1924, y: 2488, w: 630, h: 831, sx: 636, sy: 137, sw: 630, sh: 831 }, // 027
  { sheet: 0, x: 2558, y: 2488, w: 628, h: 831, sx: 632, sy: 137, sw: 628, sh: 831 }, // 028
  { sheet: 0, x: 1276, y: 828,  w: 627, h: 832, sx: 629, sy: 136, sw: 627, sh: 832 }, // 029
  { sheet: 0, x: 1295, y: 2487, w: 625, h: 832, sx: 629, sy: 136, sw: 625, sh: 832 }, // 030
  { sheet: 0, x: 2540, y: 819,  w: 624, h: 831, sx: 629, sy: 136, sw: 624, sh: 831 }, // 031
  { sheet: 0, x: 3190, y: 2488, w: 624, h: 831, sx: 629, sy: 136, sw: 624, sh: 831 }, // 032
  { sheet: 0, x: 2,    y: 1666, w: 637, h: 827, sx: 642, sy: 141, sw: 637, sh: 827 }, // 033
];

// ── Bow frames (22 total, frames 13–34) ────────────────────────────────────

type Frame = { x: number; y: number; w: number; h: number; sx: number; sy: number; sw: number; sh: number };

const BOW_FRAMES: Frame[] = [
  { x: 2609, y: 2,    w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 13
  { x: 2,    y: 2,    w: 642, h: 804, sx: 672, sy: 161, sw: 642, sh: 804 }, // 14
  { x: 2,    y: 810,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 15
  { x: 648,  y: 810,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 16
  { x: 1294, y: 810,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 17
  { x: 1940, y: 810,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 18
  { x: 2586, y: 811,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 19
  { x: 3232, y: 811,  w: 642, h: 805, sx: 672, sy: 160, sw: 642, sh: 805 }, // 20
  { x: 2,    y: 1619, w: 642, h: 805, sx: 674, sy: 160, sw: 642, sh: 805 }, // 21
  { x: 648,  y: 1619, w: 640, h: 805, sx: 674, sy: 160, sw: 640, sh: 805 }, // 22
  { x: 1292, y: 1619, w: 642, h: 805, sx: 677, sy: 160, sw: 642, sh: 805 }, // 23
  { x: 1938, y: 1619, w: 642, h: 805, sx: 677, sy: 160, sw: 642, sh: 805 }, // 24
  { x: 2584, y: 1620, w: 647, h: 805, sx: 681, sy: 160, sw: 647, sh: 805 }, // 25
  { x: 648,  y: 2,    w: 647, h: 804, sx: 681, sy: 160, sw: 647, sh: 804 }, // 26
  { x: 3235, y: 1620, w: 648, h: 806, sx: 690, sy: 158, sw: 648, sh: 806 }, // 27
  { x: 2620, y: 2430, w: 650, h: 808, sx: 690, sy: 157, sw: 650, sh: 808 }, // 28
  { x: 1312, y: 2428, w: 651, h: 807, sx: 696, sy: 157, sw: 651, sh: 807 }, // 29
  { x: 1967, y: 2429, w: 649, h: 807, sx: 698, sy: 157, sw: 649, sh: 807 }, // 30
  { x: 2,    y: 2428, w: 651, h: 806, sx: 704, sy: 158, sw: 651, sh: 806 }, // 31
  { x: 657,  y: 2428, w: 651, h: 806, sx: 704, sy: 158, sw: 651, sh: 806 }, // 32
  { x: 1299, y: 2,    w: 651, h: 804, sx: 707, sy: 160, sw: 651, sh: 804 }, // 33
  { x: 1954, y: 2,    w: 651, h: 804, sx: 707, sy: 160, sw: 651, sh: 804 }, // 34
];

// ── Crop regions over 1920×1080 source space ──────────────────────────────
const WAVE_CROP = { left: 610, top: 125, w: 730, h: 880 };
const BOW_CROP  = { left: 660, top: 145, w: 710, h: 835 };

const CANVAS_W = 300;
const WAVE_H   = Math.round(CANVAS_W * (WAVE_CROP.h / WAVE_CROP.w)); // ≈ 361
const BOW_H    = Math.round(CANVAS_W * (BOW_CROP.h  / BOW_CROP.w));  // ≈ 353

// ── Talk animation (grid sprite sheet, 6 cols × 5 rows = 30 frames) ────────
const TALK_COLS        = 6;
const TALK_TOTAL       = 30;
const TALK_FRAME_W     = 3914 / 6;
const TALK_FRAME_H     = 4082 / 5;

export type DrColiAnimation = "talk" | "idle" | "wave" | "bow";

interface DrColiSpriteProps {
  animation?: DrColiAnimation;
  isTalking?: boolean;
  className?: string;
}

export function DrColiSprite({ animation = "talk", isTalking = false, className = "" }: DrColiSpriteProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const frameRef    = useRef(0);
  const img0Ref     = useRef<HTMLImageElement | null>(null);
  const img1Ref     = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Talk frame state (CSS approach)
  const [talkFrame, setTalkFrame] = useState(0);
  const talkTimerRef = useRef<number | null>(null);

  const isCanvas = animation === "wave" || animation === "bow";

  // Load sprite images for canvas animations
  useEffect(() => {
    if (!isCanvas) return;
    setLoaded(false);
    frameRef.current = 0;

    if (animation === "wave") {
      let n = 0;
      const check = () => { if (++n === 2) setLoaded(true); };
      const i0 = new Image(); i0.onload = check; i0.src = drColiWave0Src; img0Ref.current = i0;
      const i1 = new Image(); i1.onload = check; i1.src = drColiWave1Src; img1Ref.current = i1;
    } else {
      const i = new Image(); i.onload = () => setLoaded(true); i.src = drColiBowSrc; img0Ref.current = i;
    }
  }, [animation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas animation loop
  useEffect(() => {
    if (!isCanvas || !loaded) return;

    const frames  = animation === "wave" ? WAVE_FRAMES : BOW_FRAMES;
    const crop    = animation === "wave" ? WAVE_CROP   : BOW_CROP;
    const canvasH = animation === "wave" ? WAVE_H      : BOW_H;
    const scaleX  = CANVAS_W / crop.w;
    const scaleY  = canvasH  / crop.h;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_W, canvasH);

      const f = frames[frameRef.current] as WaveFrame & Frame;
      const img = (animation === "wave" && f.sheet === 1) ? img1Ref.current : img0Ref.current;
      if (!img) return;

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
    const id = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length;
      draw();
    }, 80);

    return () => window.clearInterval(id);
  }, [isCanvas, loaded, animation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Talk animation loop (CSS)
  useEffect(() => {
    if (isCanvas) return;
    if (talkTimerRef.current) { clearInterval(talkTimerRef.current); talkTimerRef.current = null; }

    if (isTalking && animation === "talk") {
      talkTimerRef.current = window.setInterval(() => {
        setTalkFrame(prev => (prev + 1) % TALK_TOTAL);
      }, 100);
    } else {
      setTalkFrame(0);
    }

    return () => {
      if (talkTimerRef.current) clearInterval(talkTimerRef.current);
    };
  }, [isTalking, animation, isCanvas]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (isCanvas) {
    const canvasH = animation === "wave" ? WAVE_H : BOW_H;
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

  const col = talkFrame % TALK_COLS;
  const row = Math.floor(talkFrame / TALK_COLS);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", maxWidth: "300px", aspectRatio: "652/816" }}
    >
      <div
        className="absolute w-full h-full"
        style={{
          backgroundImage: `url(${drColiTalkSrc})`,
          backgroundSize: "600% 500%",
          backgroundPosition: `${(col / (TALK_COLS - 1)) * 100}% ${(row / 4) * 100}%`,
        }}
      />
    </div>
  );
}
