"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
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
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal masuk sebagai admin.");
      }

      setSuccess(data.message);

      // Store user details in localStorage (temporary UI-only helper)
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to admin dashboard after 1.5 seconds
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12 font-sans text-zinc-900">
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#5A77DF]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#3E53A2]/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <img src="/logo.png" alt="DigiMind Logo" className="h-20 sm:h-24 w-auto object-contain mb-2" />
          <p className="text-xs text-zinc-500 font-medium">
            Portal Akses Administrator Digimind
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100">
            <span className="h-2.5 w-2.5 rounded-full bg-[#5A77DF] animate-ping" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-[#3E53A2]">
              Autentikasi Sistem Admin
            </h2>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700 animate-pulse flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                Email / Username Admin
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="admin@digimind.com"
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
              className="w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#5A77DF]/25 transition-all duration-300 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Menghubungkan...
                </span>
              ) : (
                "Masuk Admin"
              )}
            </button>
          </form>

          {/* Bottom link to default login */}
          <div className="mt-8 text-center text-xs text-zinc-500">
            <Link
              href="/"
              className="hover:text-[#5A77DF] transition-all font-medium"
            >
              ← Kembali ke Portal Standar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
