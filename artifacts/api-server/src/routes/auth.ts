import crypto from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";
import { passwordLoginRateLimiter } from "../lib/rateLimiter";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post(
  "/password-login",
  passwordLoginRateLimiter,
  async (req: Request, res: Response) => {
    const betaPassword = process.env.BETA_PASSWORD;
    if (!betaPassword) {
      res.status(503).json({ error: "Beta access not configured" });
      return;
    }

    const { password } = req.body as { password?: unknown };
    if (
      typeof password !== "string" ||
      !crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(betaPassword),
      )
    ) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const userId = `beta-${crypto.randomUUID()}`;
    const sessionData: SessionData = {
      user: {
        id: userId,
        email: null,
        firstName: "Tester",
        lastName: null,
        profileImageUrl: null,
      },
      access_token: "beta",
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ ok: true, sessionId: sid });
  },
);

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

export default router;
