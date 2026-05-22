import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const IS_DEV = process.env.NODE_ENV !== "production";

const windowMs = 60 * 1000;

export const passwordLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_DEV ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts — please try again in 15 minutes." },
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
});

export const ttsRateLimiter = rateLimit({
  windowMs,
  max: IS_DEV ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many TTS requests — please wait a moment before trying again." },
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
});

export const sttRateLimiter = rateLimit({
  windowMs,
  max: IS_DEV ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many STT requests — please wait a moment before trying again." },
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
});

export const chatRateLimiter = rateLimit({
  windowMs,
  max: IS_DEV ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat requests — please wait a moment before trying again." },
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
});

export const openaiStreamRateLimiter = rateLimit({
  windowMs,
  max: IS_DEV ? 200 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment before trying again." },
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
});
