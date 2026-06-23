"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070b19] px-4 py-12 font-mono text-emerald-400">
      
      {/* Background Matrix-like Subtle Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      
      {/* Tech corner lines */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-emerald-500/30 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        
        {/* Terminal Header */}
        <div className="mb-6 text-center">
          <div className="inline-block px-3 py-1 mb-2 text-2xs uppercase tracking-widest border border-emerald-500/30 rounded-md bg-emerald-950/20 animate-pulse">
            Secure Access Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-widest text-white uppercase">
            Digimind // Admin
          </h1>
          <p className="mt-1 text-2xs text-emerald-500/60 uppercase">
            Authorized Personnel Only
          </p>
        </div>

        {/* Cyberpunk Card */}
        <div className="rounded-xl border border-emerald-500/20 bg-slate-950/60 p-8 shadow-[0_0_50px_rgba(16,185,129,0.05)] backdrop-blur-md">
          
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/10">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-emerald-300">
              System Authentication
            </h2>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/25 p-4 text-xs text-red-400">
              [ERROR]: {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/25 p-4 text-xs text-emerald-300 animate-pulse">
              [SUCCESS]: {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-3xs font-semibold uppercase tracking-widest text-emerald-500/70 mb-2">
                &gt; Identifier_ (Email / Username)
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="root@digimind.sys"
                className="w-full rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-4 py-3 text-xs text-white placeholder-emerald-950 outline-hidden transition-all duration-200 focus:border-emerald-400 focus:bg-emerald-950/20 focus:ring-1 focus:ring-emerald-400/30"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold uppercase tracking-widest text-emerald-500/70 mb-2">
                &gt; Security_Key_ (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-4 py-3 text-xs text-white placeholder-emerald-950 outline-hidden transition-all duration-200 focus:border-emerald-400 focus:bg-emerald-950/20 focus:ring-1 focus:ring-emerald-400/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-3.5 text-xs font-bold uppercase tracking-widest text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-300 hover:bg-emerald-500 hover:text-black active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Establishing Connection...
                </span>
              ) : (
                "Initialize Session"
              )}
            </button>
          </form>

          {/* Bottom link to default login */}
          <div className="mt-8 text-center text-3xs text-emerald-500/40">
            <Link
              href="/"
              className="hover:text-emerald-400 hover:underline transition-all"
            >
              &lt; Return to Standard Portal
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
