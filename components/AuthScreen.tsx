"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau password salah.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("password should be at least")) return "Password minimal 6 karakter.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (m.includes("rate limit")) return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  if (m.includes("failed to fetch")) return "Tidak bisa terhubung ke server. Periksa koneksi internet.";
  return message;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Isi email dan password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setBusy(true);
    try {
      const sb = getSupabase();
      if (mode === "login") {
        const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError(friendlyError(err.message));
      } else {
        const { data, error: err } = await sb.auth.signUp({ email: email.trim(), password });
        if (err) setError(friendlyError(err.message));
        else if (!data.session) {
          setInfo("Akun dibuat. Buka email Anda dan klik tautan konfirmasi, lalu masuk di sini.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Terjadi kesalahan."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <header className="auth-hero">
        <h1>Keuangan Pribadi</h1>
        <p>{mode === "login" ? "Masuk untuk melihat uangmu." : "Buat akun untuk mulai mencatat."}</p>
      </header>

      <section className="auth-card">
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "Minimal 6 karakter" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {info && <div className="notice">{info}</div>}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn-main" disabled={busy}>
            {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Buat akun"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setInfo("");
            }}
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </section>
    </main>
  );
}