"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Terjadi kesalahan saat login.");
      }

      setSuccess(data.message);
      
      // Store user details in localStorage (temporary UI-only helper)
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect after 1.5 seconds
      setTimeout(() => {
        if (role === "student") {
          if (data.user.hasCompletedPretest) {
            router.push("/student/dashboard");
          } else {
            router.push("/student/pretest");
          }
        } else {
          router.push("/teacher/dashboard");
        }
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-radial from-[#1e1b4b] via-[#090514] to-[#03000a] px-4 py-12 font-sans text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      
      {/* Main Form Container */}
      <div className="w-full max-w-md z-10">
        
        {/* App Logo & Title */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Digimind
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Platform Literasi & Kesehatan Mental Adaptif
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
          
          <h2 className="text-xl font-bold text-center text-zinc-100 mb-6">
            Masuk ke Akun Anda
          </h2>

          {/* Sliding Role Toggle */}
          <div className="relative mb-6 flex rounded-full bg-zinc-950 p-1 border border-white/5">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 ease-out ${
                role === "teacher" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setRole("student");
                setError(null);
              }}
              className={`relative z-10 w-1/2 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                role === "student" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Siswa
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("teacher");
                setError(null);
              }}
              className={`relative z-10 w-1/2 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                role === "teacher" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Guru
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-pulse">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              ✅ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                {role === "student" ? "NIS / Email" : "NIP / Email"}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={role === "student" ? "Masukkan NIS atau email" : "Masukkan NIP atau email"}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all duration-200 focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all duration-200 focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div className="mt-8 text-center text-xs text-zinc-400">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Daftar di sini
            </Link>
          </div>

        </div>

        {/* Footer Link to Admin Login */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/admin" className="hover:text-zinc-300 transition-colors">
            Masuk sebagai Admin Sistem →
          </Link>
        </div>

      </div>
    </div>
  );
}
