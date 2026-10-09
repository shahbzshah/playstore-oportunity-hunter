import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";

/* Shared Stitch-styled auth shell: branding, card, error banner.
   The state-preview toggle bar from the Stitch mockup is dropped —
   mode switching uses the real /login and /register routes. */

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="mb-5 p-3 rounded-[12px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] flex items-start gap-2.5 text-xs text-red-200">
      <span className="material-symbols-outlined text-[#ef4444] text-[18px] shrink-0 mt-0.5">
        error
      </span>
      <div className="flex-1 leading-snug">{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-400 hover:text-red-200 transition-colors p-0.5"
        aria-label="Dismiss error"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

function Field({ label, icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-300">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] pointer-events-none">
          {icon}
        </span>
        {children(error)}
      </div>
    </div>
  );
}

const inputClass = (error) =>
  `w-full pl-11 pr-3.5 py-2.5 text-sm placeholder:text-slate-600 bg-[#11131a] border rounded-[12px] text-slate-100 transition-all duration-150 focus:outline-none ${
    error
      ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
      : "border-[#2a2f42] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] focus:shadow-[0_0_12px_rgba(108,140,255,0.2)]"
  }`;

function PasswordInput({ id, value, onChange, placeholder, autoComplete, error }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass(error) + " pr-10"}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <span className="material-symbols-outlined text-[18px]">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </>
  );
}

function SubmitButton({ busy, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full mt-2 bg-[#6c8cff] hover:bg-[#5876e6] text-white font-medium py-2.5 px-4 rounded-[12px] text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {busy && (
        <span className="material-symbols-outlined text-[18px] animate-spin">
          progress_activity
        </span>
      )}
      {busy ? busyLabel : children}
    </button>
  );
}

function AuthShell({ error, onDismissError, children }) {
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4 relative font-[Inter]">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(108,140,255,0.08) 0%, rgba(15,17,23,0) 70%)",
        }}
      />
      <main className="w-full max-w-[420px] relative z-10 py-10 my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#171a23] border border-[#2a2f42] mb-3">
            <span className="material-symbols-outlined text-[#6c8cff] text-[28px]">
              radar
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Opportunity Hunter
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[320px] mx-auto leading-relaxed">
            Discover underrated Play Store apps before the market notices.
          </p>
        </div>
        <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-6 sm:p-7 shadow-2xl">
          <ErrorBanner message={error} onDismiss={onDismissError} />
          {children}
        </div>
      </main>
    </div>
  );
}

function SwitchMode({ prompt, to, label }) {
  return (
    <div className="pt-3 text-center border-t border-[#2a2f42]/60 mt-4">
      <p className="text-xs text-slate-400">
        {prompt}{" "}
        <Link to={to} className="text-[#6c8cff] hover:underline font-medium ml-1">
          {label}
        </Link>
      </p>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell error={error} onDismissError={() => setError("")}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email address" icon="mail" error={!!error}>
          {(err) => (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              autoComplete="email"
              className={inputClass(err)}
            />
          )}
        </Field>
        <Field label="Password" icon="lock" error={!!error}>
          {(err) => (
            <PasswordInput
              id="signin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              error={err}
            />
          )}
        </Field>
        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
        <SwitchMode prompt="No account?" to="/register" label="Create one" />
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password, confirm);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell error={error} onDismissError={() => setError("")}>
      <form className="space-y-3.5" onSubmit={submit}>
        <Field label="Full name" icon="person" error={!!error}>
          {(err) => (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Alex Chen"
              autoComplete="name"
              className={inputClass(err)}
            />
          )}
        </Field>
        <Field label="Email address" icon="mail" error={!!error}>
          {(err) => (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              autoComplete="email"
              className={inputClass(err)}
            />
          )}
        </Field>
        <Field label="Password" icon="lock" error={!!error}>
          {(err) => (
            <PasswordInput
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={err}
            />
          )}
        </Field>
        <Field label="Confirm password" icon="lock_reset" error={!!error}>
          {(err) => (
            <PasswordInput
              id="reg-password-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              error={err}
            />
          )}
        </Field>
        <SubmitButton busy={busy} busyLabel="Creating account…">
          Create account
        </SubmitButton>
        <SwitchMode
          prompt="Already have an account?"
          to="/login"
          label="Sign in"
        />
      </form>
    </AuthShell>
  );
}
