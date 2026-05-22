import crypto from "node:crypto";
import { Router } from "express";
import {
  createSession,
  deleteSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../../lib/auth";

const router = Router();

router.get("/admin/me", (req, res) => {
  if (!req.isAuthenticated() || req.sessionRole !== "admin") {
    res.status(401).json({ admin: false });
    return;
  }
  res.json({ admin: true });
});

router.post("/admin/login", async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: "Admin access not configured — set ADMIN_PASSWORD" });
    return;
  }

  const { password } = req.body as { password?: unknown };
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))
  ) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: `admin-${crypto.randomUUID()}`,
      email: null,
      firstName: "Admin",
      lastName: null,
      profileImageUrl: null,
    },
    access_token: "admin",
    role: "admin",
  };

  const sid = await createSession(sessionData);

  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });

  res.json({ ok: true, sessionId: sid });
});

router.post("/admin/logout", async (req, res) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

export default router;
