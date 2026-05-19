import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Mode = "signin" | "signup" | "forgot";

interface Props {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: Props) {
  const { configured, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="auth-card">
        <h2>Sign-in unavailable</h2>
        <p className="auth-hint">
          Authentication is not configured for this deployment. Add your sign-in URL and public key
          to the environment file, then rebuild and redeploy.
        </p>
        {onBack ? (
          <p className="auth-switch">
            <button type="button" className="link-btn" onClick={onBack}>
              Back to home
            </button>
          </p>
        ) : null}
      </div>
    );
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const msg = await requestPasswordReset(email.trim());
        if (msg) setError(msg);
        else setInfo("If that email is registered, you will receive a reset link shortly.");
        return;
      }
      const msg =
        mode === "signin"
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);
      if (msg) {
        if (mode === "signup" && msg.includes("confirm")) setInfo(msg);
        else setError(msg);
      } else if (mode === "signup") {
        setInfo("Account created. You can sign in now.");
        switchMode("signin");
      }
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <div className="auth-card">
      {onBack ? (
        <p className="auth-back">
          <button type="button" className="link-btn" onClick={onBack}>
            ← Back
          </button>
        </p>
      ) : null}
      <h2>{title}</h2>
      <p className="auth-hint">
        {mode === "forgot"
          ? "Enter your email and we will send you a link to set a new password."
          : "Sign in with your work email to open your workspace."}
      </p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode !== "forgot" ? (
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        ) : null}
        {mode === "signin" ? (
          <p className="auth-forgot">
            <button type="button" className="link-btn" onClick={() => switchMode("forgot")}>
              Forgot password?
            </button>
          </p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        {info ? <p className="auth-info">{info}</p> : null}
        <button type="submit" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Sign up"
                : "Send reset link"}
        </button>
      </form>
      <p className="auth-switch">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button type="button" className="link-btn" onClick={() => switchMode("signup")}>
              Sign up
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
              Sign in
            </button>
          </>
        ) : (
          <>
            Remember your password?{" "}
            <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
