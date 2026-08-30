"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
      
      localStorage.setItem("user", JSON.stringify(data.user));

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
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        
        {/* Left Section: 50% Form Area */}
        <div className="flex flex-col justify-center items-center px-6 py-12 sm:px-12 md:px-16 w-full max-w-xl mx-auto lg:max-w-none">
          <div className="w-full max-w-md">
            
            {/* App Logo & Subtitle */}
            <div className="mb-8 text-center flex flex-col items-center">
              <img src="/logo.png" alt="DigiMind Logo" className="h-20 sm:h-24 w-auto object-contain mb-3" />
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Platform Literasi &amp; Kesehatan Mental Adaptif
              </p>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center text-zinc-900 mb-6">
              Masuk ke Akun Anda
            </h2>

            {/* Sliding Role Toggle */}
            <div className="relative mb-6 flex rounded-full bg-zinc-100 p-1 border border-zinc-200">
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] transition-all duration-300 ease-out shadow-sm ${
                  role === "teacher" ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setError(null);
                }}
                className={`relative z-10 w-1/2 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                  role === "student" ? "text-white" : "text-zinc-600 hover:text-zinc-900"
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
                className={`relative z-10 w-1/2 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                  role === "teacher" ? "text-white" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Guru
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-pulse font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form Inputs (Original style and language) */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  {role === "student" ? "NIS / Email" : "NIP / Email"}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder={role === "student" ? "Masukkan NIS atau email" : "Masukkan NIP atau email"}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all duration-200 focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all duration-200 focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5A77DF]/25 transition-all duration-300 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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

            {/* Bottom link */}
            <div className="mt-8 text-center text-xs text-zinc-600">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#5A77DF] hover:text-[#3E53A2] transition-colors"
              >
                Daftar di sini
              </Link>
            </div>

            {/* Admin link */}
            <div className="mt-6 text-center text-xs text-zinc-500">
              <Link href="/admin" className="hover:text-[#5A77DF] transition-colors font-medium">
                Masuk sebagai Admin Sistem →
              </Link>
            </div>

          </div>
        </div>

        {/* Right Section: 50% Full-Bleed Image Area */}
        <div className="hidden lg:block w-full h-screen relative overflow-hidden bg-[#edf2fe]">
          <img
            src="/auth-illustration.jpg"
            alt="Digimind Dashboard Illustration"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
}
