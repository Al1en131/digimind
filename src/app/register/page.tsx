"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ClassOption {
  id: number;
  name: string;
  major: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  
  // Common Form States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Student specific States
  const [classId, setClassId] = useState("");
  const [nis, setNis] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Teacher specific States
  const [nip, setNip] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    async function fetchClasses() {
      setLoadingClasses(true);
      try {
        const res = await fetch("/api/classes");
        const data = await res.json();
        if (data.success) {
          setClasses(data.classes);
        } else {
          console.error("Gagal mengambil data kelas:", data.message);
        }
      } catch (err) {
        console.error("Kesalahan jaringan mengambil kelas:", err);
      } finally {
        setLoadingClasses(false);
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Prepare payload based on selected role
    const payload: any = {
      role,
      username,
      email,
      password,
    };

    if (role === "student") {
      payload.name = name;
      payload.class_id = classId;
      payload.nis = nis;
    } else {
      payload.name = name;
      payload.nip = nip;
      payload.specialization = specialization;
      payload.position = position;
      payload.phone_number = phoneNumber;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal melakukan registrasi.");
      }

      setSuccess(data.message);

      // Reset form states
      setUsername("");
      setEmail("");
      setPassword("");
      setName("");
      setClassId("");
      setNis("");
      setNip("");
      setSpecialization("");
      setPosition("");
      setPhoneNumber("");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-radial from-[#1e1b4b] via-[#090514] to-[#03000a] px-4 py-12 font-sans text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Main Container */}
      <div className="w-full max-w-lg z-10">
        
        {/* App Title */}
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Digimind
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Pendaftaran Akun Baru Platform Digimind
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
          
          <h2 className="text-xl font-bold text-center text-zinc-100 mb-6">
            Daftar Akun Baru
          </h2>

          {/* Sliding Toggle */}
          <div className="relative mb-8 flex rounded-full bg-zinc-950 p-1 border border-white/5">
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
              Registrasi Siswa
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
              Registrasi Guru
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-pulse">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              ✅ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 2-Column Layout for Basic Info */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nama Lengkap Anda"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Username unik"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contoh@sekolah.sch.id"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
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
                  placeholder="Min. 6 karakter"
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Dynamic Role Fields */}
            {role === "student" ? (
              <div className="pt-4 border-t border-white/5 space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      NIS (Nomor Induk Siswa)
                    </label>
                    <input
                      type="text"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      required
                      placeholder="Masukkan NIS Anda"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Kelas
                    </label>
                    {loadingClasses ? (
                      <div className="text-sm text-zinc-500 py-3">Memuat daftar kelas...</div>
                    ) : (
                      <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        required
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-hidden transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      >
                        <option value="" className="text-zinc-600">-- Pilih Kelas Anda --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.major})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-2xs text-zinc-500">
                  *Pilihan kelas di atas didapat dari basis data sekolah lokal Anda.
                </p>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/5 space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      required
                      placeholder="Nomor Induk Pegawai"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      No. Telp / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Spesialisasi
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Literasi Media"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Wali Kelas / Guru BK"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition-all focus:border-violet-500 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Membuat Akun...
                </span>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          {/* Bottom Link */}
          <div className="mt-8 text-center text-xs text-zinc-400">
            Sudah memiliki akun?{" "}
            <Link
              href="/"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Masuk di sini
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
