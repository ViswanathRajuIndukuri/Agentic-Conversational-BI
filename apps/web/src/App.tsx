import { useState } from "react";
import ChatPanel from "./components/ChatPanel";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import { useAuth } from "./context/AuthContext";

type GuestView = "landing" | "auth";

function BrandMark() {
  return (
    <span className="app-brand-mark" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 16L10 8L14 14L18 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function App() {
  const { loading, recoveryMode, session, user, signOut } = useAuth();
  const [guestView, setGuestView] = useState<GuestView>("landing");

  if (loading) {
    return (
      <div className="app-shell">
        <div className="auth-loading">
          <span className="spinner" aria-hidden />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div className="app-shell">
        <main className="auth-screen">
          <ResetPasswordPage />
        </main>
      </div>
    );
  }

  if (!session) {
    if (guestView === "landing") {
      return (
        <LandingPage
          onSignIn={() => setGuestView("auth")}
          onGetStarted={() => setGuestView("auth")}
        />
      );
    }
    return (
      <div className="app-shell">
        <main className="auth-screen">
          <LoginPage onBack={() => setGuestView("landing")} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header frosted">
        <div className="app-header-inner">
          <div className="app-brand">
            <BrandMark />
            <div className="app-brand-text">
              <h1>Graphtic BI</h1>
              <p>Governed metrics. Deterministic answers.</p>
            </div>
          </div>
          <div className="app-header-actions">
            {user?.email ? (
              <span className="auth-email" title={user.email}>
                {user.email}
              </span>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ChatPanel />
      </main>
    </div>
  );
}
