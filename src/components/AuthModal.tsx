"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

export default function AuthModal({ open, initialMode = "signin", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset transient state whenever the modal opens (or its mode changes from outside)
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
      setPassword("");
      const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, initialMode]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll while modal is open.
  // We also compensate for the width of the page's scrollbar with
  // padding-right, so the content doesn't shift/jump horizontally when
  // the scrollbar disappears (and reappears) as the modal opens/closes.
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "signup" && !agree) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        setNotice("Account created — check your email to confirm it before signing in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then tap Forgot password.");
      return;
    }
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) setError(resetError.message);
    else setNotice("Password reset link sent — check your email.");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(28,24,21,0.55)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-sm overflow-hidden max-h-[92vh] overflow-y-auto modal-scroll"
        style={{ background: "var(--stone-light)", boxShadow: "0 24px 60px rgba(28,24,21,0.35)" }}
      >
        <style>{`
          .modal-scroll {
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }
          .modal-scroll:hover {
            scrollbar-color: rgba(43, 58, 42, 0.35) transparent;
          }
          .modal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .modal-scroll::-webkit-scrollbar-thumb {
            background-color: transparent;
            border-radius: 3px;
            transition: background-color 0.3s ease;
          }
          .modal-scroll:hover::-webkit-scrollbar-thumb {
            background-color: rgba(43, 58, 42, 0.35);
          }
          .modal-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(43, 58, 42, 0.55) !important;
          }

          /* Google sign-in button, styled to Google's own brand guidelines
             so it reads as an authentic, trustworthy Google button rather
             than a generic outlined button. */
          .google-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            height: 44px;
            background: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #3c4043;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.15px;
            cursor: pointer;
            transition: box-shadow 0.15s ease, background-color 0.15s ease;
          }
          .google-btn:hover {
            background-color: #f8f9fa;
            box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
          }
          .google-btn:active {
            background-color: #f1f3f4;
          }
          .google-btn:focus-visible {
            outline: 2px solid #4285f4;
            outline-offset: 2px;
          }
          .google-btn:disabled {
            opacity: 0.6;
            cursor: default;
            box-shadow: none;
          }
          .google-btn-icon {
            display: flex;
            width: 18px;
            height: 18px;
            flex-shrink: 0;
          }
          .google-btn-icon svg {
            width: 100%;
            height: 100%;
          }
        `}</style>
        <div className="flex items-center justify-between px-7 pt-6">
          <p className="eyebrow">House of Romano</p>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-60" style={{ color: "var(--ink)" }}>
            <X size={20} />
          </button>
        </div>

        <div className="px-7 pt-3 pb-8">
          <h2 id="auth-modal-title" className="font-display text-2xl mb-1" style={{ color: "var(--ink)" }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm opacity-70 mb-6">
            {mode === "signin"
              ? "Sign in to track orders and check out faster."
              : "Save your details once for faster checkout every time."}
          </p>

          {/* Mode toggle */}
          <div className="flex mb-6 text-sm" style={{ borderBottom: "1px solid rgba(28,24,21,0.12)" }}>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="flex-1 pb-3 font-medium transition-opacity"
              style={{
                color: "var(--verde)",
                opacity: mode === "signin" ? 1 : 0.45,
                borderBottom: mode === "signin" ? "2px solid var(--verde)" : "2px solid transparent",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="flex-1 pb-3 font-medium transition-opacity"
              style={{
                color: "var(--verde)",
                opacity: mode === "signup" ? 1 : 0.45,
                borderBottom: mode === "signup" ? "2px solid var(--verde)" : "2px solid transparent",
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="fullName" className="block text-xs uppercase tracking-widest opacity-60 mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullName"
                  ref={firstFieldRef}
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 text-sm rounded-sm bg-transparent border outline-none"
                  style={{ borderColor: "rgba(28,24,21,0.2)" }}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest opacity-60 mb-1.5">
                Email
              </label>
              <input
                id="email"
                ref={mode === "signin" ? firstFieldRef : undefined}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 text-sm rounded-sm bg-transparent border outline-none"
                style={{ borderColor: "rgba(28,24,21,0.2)" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest opacity-60 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm rounded-sm bg-transparent border outline-none pr-11"
                  style={{ borderColor: "rgba(28,24,21,0.2)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "signin" && (
                <button
                  type="button"
                  className="text-xs mt-2 underline underline-offset-4 opacity-60 hover:opacity-100"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === "signup" && (
              <label className="flex items-start gap-2.5 text-xs opacity-70 leading-relaxed">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                I agree to the Terms of Service and Privacy Policy.
              </label>
            )}

            {error && (
              <p
                className="text-xs rounded-sm px-3 py-2"
                style={{ background: "rgba(138,59,42,0.1)", color: "var(--oxide)" }}
                role="alert"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                className="text-xs rounded-sm px-3 py-2"
                style={{ background: "rgba(43,58,42,0.1)", color: "var(--verde)" }}
                role="status"
              >
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(28,24,21,0.12)" }} />
            <span className="text-xs opacity-50 uppercase tracking-widest">Or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(28,24,21,0.12)" }} />
          </div>

          <button type="button" onClick={handleGoogle} className="google-btn" disabled={loading}>
            <span className="google-btn-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.4 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.4 6 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.4 0 10.2-1.8 13.9-5l-6.4-5.4c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.6 5c3.4 6.6 10 11.2 17.9 11.2z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.4 5.4C40.9 36.4 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
            </span>
            <span className="google-btn-label">Continue with Google</span>
          </button>

          <p className="text-center text-sm mt-6 opacity-70">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  style={{ color: "var(--verde)" }}
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  style={{ color: "var(--verde)" }}
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
