import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const msg = await updatePassword(password);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Set a new password</h2>
      <p className="auth-hint">Choose a new password for your account.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
      <p className="auth-switch">
        <button type="button" className="link-btn" onClick={() => signOut()}>
          Cancel and sign out
        </button>
      </p>
    </div>
  );
}
