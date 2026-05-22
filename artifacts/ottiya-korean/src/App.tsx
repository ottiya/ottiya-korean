import { useState, useCallback, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/SplashScreen";
import { SetupOverlay } from "@/components/SetupOverlay";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ProfilesProvider, useProfilesContext } from "@/contexts/ProfilesContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminPage from "@/pages/AdminPage";

// ── Session keys ──────────────────────────────────────────────────────────────
export const SESSION_KEY = "ottiya-sid";
export const ADMIN_SESSION_KEY = "ottiya-admin-sid";

// Inject Bearer token into every React Query / customFetch call (main app).
// Runs once at module load — sessionStorage is synchronous.
setAuthTokenGetter(() => sessionStorage.getItem(SESSION_KEY));

// Preload character sprites during splash so they appear instantly on home
import drColiSrc from "@assets/Dr.Coli_Talk_1777770172647.webp";
import boriSrc from "@assets/Bori_Wave_1777772929700.webp";

import HomePage from "@/pages/HomePage";
import EpisodePlayerPage from "@/pages/EpisodePlayerPage";
import LogbookPage from "@/pages/LogbookPage";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";
import SongChallengePage from "@/pages/SongChallengePage";
import ParentReportPage from "@/pages/ParentReportPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function preloadImage(src: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

// ── Admin section — standalone, never shown to kids ───────────────────────────

type AdminStatus = "loading" | "unauthenticated" | "authenticated";

function AdminSection() {
  const [status, setStatus] = useState<AdminStatus>("loading");

  useEffect(() => {
    const sid = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sid) {
      setStatus("unauthenticated");
      return;
    }
    fetch("/api/admin/me", { headers: { Authorization: `Bearer ${sid}` } })
      .then(r => r.ok ? r.json() as Promise<{ admin: boolean }> : Promise.reject())
      .then(d => setStatus(d.admin ? "authenticated" : "unauthenticated"))
      .catch(() => setStatus("unauthenticated"));
  }, []);

  const handleAuthenticated = (sessionId: string) => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, sessionId);
    setStatus("authenticated");
  };

  const handleLogout = () => {
    const sid = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (sid) {
      fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${sid}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setStatus("unauthenticated");
  };

  if (status === "loading") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100dvh", background: "#0f172a",
      }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid #334155", borderTopColor: "#6366f1",
          borderRadius: "50%", animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <AdminLoginPage onAuthenticated={handleAuthenticated} />;
  }

  return <AdminPage onLogout={handleLogout} />;
}

// ── Main child-facing app ─────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/episode/:id" component={EpisodePlayerPage} />
      <Route path="/song-challenge" component={SongChallengePage} />
      <Route path="/logbook" component={LogbookPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/parent-report" component={ParentReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

type LaunchPhase = "splash" | "onboarding" | "app";

const MIN_SPLASH_MS = 3500;

function LaunchController() {
  const { profiles, isLoaded, addProfile } = useProfilesContext();
  const [phase, setPhase] = useState<LaunchPhase>("splash");
  const [appVisible, setAppVisible] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const splashReadyToExit = minTimePassed && imagesLoaded;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    Promise.all([preloadImage(drColiSrc), preloadImage(boriSrc)])
      .then(() => setImagesLoaded(true));
    return () => clearTimeout(timer);
  }, []);

  const goToApp = useCallback(() => {
    window.history.replaceState(null, "", import.meta.env.BASE_URL || "/");
    setPhase("app");
    setTimeout(() => setAppVisible(true), 20);
  }, []);

  const handleSplashDone = useCallback(() => {
    const hasProfile = profiles.length > 0
      || !!localStorage.getItem("ottiya-child-profile");
    const skipSetup = new URLSearchParams(window.location.search).has("skipSetup");
    if (hasProfile || skipSetup) {
      goToApp();
    } else {
      setPhase("onboarding");
    }
  }, [profiles, isLoaded, goToApp]);

  const handleOnboardingComplete = useCallback(
    (p: { name: string; favorite: import("@/hooks/useChildProfile").FavoriteChar; yearOfBirth?: number }) => {
      addProfile(p);
      goToApp();
    },
    [addProfile, goToApp],
  );

  return (
    <>
      {phase === "splash" && (
        <SplashScreen onDone={handleSplashDone} readyToExit={splashReadyToExit} />
      )}

      {phase === "onboarding" && (
        <div style={{
          position: "fixed", inset: 0,
          animation: "fadeSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <SetupOverlay onComplete={handleOnboardingComplete} />
          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {phase === "app" && (
        <div style={{
          minHeight: "100dvh",
          opacity: appVisible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </div>
      )}
    </>
  );
}

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

function LoginGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const sid = sessionStorage.getItem(SESSION_KEY);
    const headers: Record<string, string> = {};
    if (sid) headers["Authorization"] = `Bearer ${sid}`;
    fetch("/api/auth/user", { credentials: "include", headers })
      .then(res => res.ok ? res.json() as Promise<{ user: { id: string } | null }> : Promise.reject())
      .then(data => setStatus(data.user ? "authenticated" : "unauthenticated"))
      .catch(() => setStatus("unauthenticated"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 60%, #fef9c3 100%)",
      }}>
        <div style={{
          width: 48, height: 48,
          border: "4px solid #e2e8f0", borderTopColor: "#38bdf8",
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <PasswordGate onAuthenticated={() => setStatus("authenticated")} />;
  }

  return <>{children}</>;
}

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; sessionId?: string };
        if (data.sessionId) {
          sessionStorage.setItem(SESSION_KEY, data.sessionId);
        }
        onAuthenticated();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Incorrect password — try again!");
      }
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100dvh", padding: "32px 24px",
      background: "linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 60%, #fef9c3 100%)",
      fontFamily: "'Nunito', 'Fredoka One', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 28,
        boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        padding: "40px 32px 36px", maxWidth: 360, width: "100%",
        textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🌿🐶</div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, color: "#0c4a6e",
          margin: "0 0 6px", letterSpacing: "-0.3px",
        }}>
          Ottiya Korean
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 28px", lineHeight: 1.5 }}>
          Enter the secret password to join Dr. Coli and Bori on their Korean adventure!
        </p>

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Secret password..."
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              autoComplete="current-password"
              disabled={loading}
              style={{
                width: "100%", padding: "14px 48px 14px 18px", fontSize: 16,
                borderRadius: 14,
                border: error ? "2px solid #f87171" : "2px solid #e2e8f0",
                outline: "none", boxSizing: "border-box",
                background: "#f8fafc", color: "#0f172a", transition: "border-color 0.15s",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, color: "#94a3b8", padding: 0, lineHeight: 1,
              }}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: 0, textAlign: "left" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              padding: "15px 0",
              background: loading || !password.trim() ? "#cbd5e1" : "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              color: "#fff", border: "none", borderRadius: 14,
              fontSize: 17, fontWeight: 700,
              cursor: loading || !password.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s", letterSpacing: "0.2px",
            }}
          >
            {loading ? "Checking..." : "Let's Go! 🚀"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#94a3b8", margin: "20px 0 0", lineHeight: 1.6, textAlign: "center" }}>
          By using Ottiya Korean, you confirm that you are the parent or legal guardian of the child user and agree to the{" "}
          <a
            href="https://docs.google.com/document/d/10JIfA1tLklmHv4L-7EpHuhk3ZxMmcrrpn5N4-RVa_nY/edit?usp=drivesdk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            Terms &amp; Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ── Root: route /admin separately from the child app ─────────────────────────

function App() {
  const isAdmin =
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/");

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdminSection />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoginGate>
          <ProfilesProvider>
            <LaunchController />
            <Toaster />
          </ProfilesProvider>
        </LoginGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
