import { useEffect, useRef, useState } from "react";
import sheetSrc from "@assets/Bori_Wave_1777772929700.webp";

// All 21 frames from Bori_Wave JSON (no rotation in this sheet)
// sx/sy/sw/sh = spriteSourceSize (position within 1920×1080 source frame)
// x/y/w/h = position within the atlas image
const FRAMES = [
  { x:609,  y:2094, w:602, h:684, sx:660, sy:214, sw:602, sh:684 }, // 00
  { x:1281, y:1404, w:602, h:686, sx:660, sy:212, sw:602, sh:686 }, // 01
  { x:2,    y:2073, w:603, h:686, sx:659, sy:212, sw:603, sh:686 }, // 02
  { x:1358, y:2,    w:603, h:686, sx:659, sy:212, sw:603, sh:686 }, // 03
  { x:1965, y:2,    w:603, h:686, sx:659, sy:212, sw:603, sh:686 }, // 04
  { x:2572, y:2,    w:603, h:686, sx:659, sy:212, sw:603, sh:686 }, // 05
  { x:674,  y:1404, w:603, h:686, sx:659, sy:212, sw:603, sh:686 }, // 06
  { x:1215, y:2094, w:602, h:684, sx:660, sy:214, sw:602, sh:684 }, // 07
  { x:701,  y:720,  w:605, h:680, sx:660, sy:218, sw:605, sh:680 }, // 08
  { x:1310, y:720,  w:603, h:678, sx:662, sy:220, sw:603, sh:678 }, // 09
  { x:2520, y:692,  w:602, h:674, sx:663, sy:224, sw:602, sh:674 }, // 10
  { x:1887, y:1402, w:594, h:668, sx:668, sy:230, sw:594, sh:668 }, // 11
  { x:2485, y:1385, w:586, h:667, sx:671, sy:231, sw:586, sh:667 }, // 12
  { x:1821, y:2094, w:578, h:683, sx:675, sy:215, sw:578, sh:683 }, // 13
  { x:2403, y:2074, w:575, h:695, sx:675, sy:201, sw:575, sh:695 }, // 14
  { x:2982, y:2056, w:581, h:690, sx:672, sy:175, sw:581, sh:690 }, // 15
  { x:1917, y:692,  w:599, h:689, sx:660, sy:154, sw:599, sh:689 }, // 16
  { x:719,  y:2,    w:635, h:714, sx:641, sy:142, sw:635, sh:714 }, // 17
  { x:2,    y:1376, w:668, h:693, sx:625, sy:143, sw:668, sh:693 }, // 18
  { x:2,    y:691,  w:695, h:681, sx:612, sy:148, sw:695, sh:681 }, // 19
  { x:2,    y:2,    w:713, h:685, sx:606, sy:157, sw:713, sh:685 }, // 20
];

// Tight crop region covering all character positions (with small padding)
// Character spans x=[606,1319], y=[142,898] across all frames
const CROP_LEFT = 588;
const CROP_TOP  = 128;
const CROP_W    = 750;   // 1338 - 588
const CROP_H    = 790;   // 918 - 128

// Canvas display dimensions (maintain 750:790 aspect ratio)
const CANVAS_W = 266;
const CANVAS_H = 280;

interface BoriSpriteProps {
  isAnimating?: boolean;
  className?: string;
}

export function BoriSprite({ isAnimating = true, className = "" }: BoriSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = sheetSrc;
    return () => { img.onload = null; };
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;

    const scaleX = CANVAS_W / CROP_W;
    const scaleY = CANVAS_H / CROP_H;

    const drawFrame = () => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const f = FRAMES[frameRef.current];
      const dstX = (f.sx - CROP_LEFT) * scaleX;
      const dstY = (f.sy - CROP_TOP)  * scaleY;
      const dstW = f.sw * scaleX;
      const dstH = f.sh * scaleY;

      ctx.drawImage(img, f.x, f.y, f.w, f.h, dstX, dstY, dstW, dstH);
    };

    drawFrame();
    if (!isAnimating) return;

    const interval = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % FRAMES.length;
      drawFrame();
    }, 80); // ~12 fps

    return () => window.clearInterval(interval);
  }, [imageLoaded, isAnimating]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className={`w-full object-contain ${className}`}
      style={{ maxWidth: `${CANVAS_W}px` }}
    />
  );
}
