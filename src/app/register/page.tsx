"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ClassOption {
  id: number;
  name: string;
  major: string;
  subjects?: {
    id: number;
    name: string;
    teacher_id: number | null;
  }[];
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teacherType, setTeacherType] = useState<"subject" | "bk" | "wali_kelas">("subject");
  const [teacherClassId, setTeacherClassId] = useState("");
  const [teacherSubjectId, setTeacherSubjectId] = useState("");

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
      payload.specialization = "";
      payload.position = teacherType === "bk"
        ? "Guru Bimbingan Konseling"
        : teacherType === "wali_kelas"
        ? "Wali Kelas"
        : "Guru Mata Pelajaran";
      payload.phone_number = phoneNumber;
      payload.teacher_type = teacherType;
      if (teacherType === "subject") {
        payload.teacher_class_id = teacherClassId;
        payload.teacher_subject_id = teacherSubjectId;
      } else if (teacherType === "wali_kelas" || teacherType === "bk") {
        payload.teacher_class_id = teacherClassId;
      }
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
      setPhoneNumber("");
      setTeacherClassId("");
      setTeacherSubjectId("");

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
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        
        {/* Left Section: 50% Form Area */}
        <div className="flex flex-col justify-center items-center px-6 py-10 sm:px-12 md:px-16 w-full max-w-xl mx-auto lg:max-w-none">
          <div className="w-full max-w-lg">
            
            {/* App Title */}
            <div className="mb-6 text-center flex flex-col items-center">
              <img src="/logo.png" alt="DigiMind Logo" className="h-16 sm:h-20 w-auto object-contain mb-2" />
              <p className="text-xs text-zinc-600 font-medium">
                Pendaftaran Akun Baru Platform Digimind
              </p>
            </div>

            <h2 className="text-xl font-bold text-center text-zinc-900 mb-6">
              Daftar Akun Baru
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
                Registrasi Siswa
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
                Registrasi Guru
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-pulse font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form Inputs (Original Indonesian language) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 2-Column Layout for Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nama Lengkap Anda"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Username unik"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="contoh@sekolah.sch.id"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
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
                    placeholder="Min. 6 karakter"
                    minLength={6}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                  />
                </div>
              </div>

              {/* Dynamic Role Fields */}
              {role === "student" ? (
                <div className="pt-3 border-t border-zinc-200 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        NIS (Nomor Induk Siswa)
                      </label>
                      <input
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        required
                        placeholder="Masukkan NIS Anda"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        Kelas
                      </label>
                      {loadingClasses ? (
                        <div className="text-sm text-zinc-500 py-2.5">Memuat daftar kelas...</div>
                      ) : (
                        <select
                          value={classId}
                          onChange={(e) => setClassId(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 cursor-pointer"
                        >
                          <option value="" className="text-zinc-500">-- Pilih Kelas Anda --</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.major})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-zinc-200 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                      Jabatan Guru *
                    </label>
                    <select
                      value={teacherType}
                      onChange={(e) => setTeacherType(e.target.value as "subject" | "bk" | "wali_kelas")}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 cursor-pointer"
                    >
                      <option value="subject">Guru Mata Pelajaran</option>
                      <option value="wali_kelas">Wali Kelas</option>
                      <option value="bk">Guru Bimbingan Konseling (BK)</option>
                    </select>
                  </div>

                  {teacherType === "bk" && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        Kelas Binaan Utama Guru BK
                      </label>
                      <select
                        value={teacherClassId}
                        onChange={(e) => setTeacherClassId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 cursor-pointer"
                      >
                        <option value="" className="text-zinc-500">-- Semua Kelas / Pilih Kelas Utama --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.major})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {teacherType === "wali_kelas" && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        Kelas yang Diampu (Wali Kelas) *
                      </label>
                      <select
                        value={teacherClassId}
                        onChange={(e) => setTeacherClassId(e.target.value)}
                        required
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 cursor-pointer"
                      >
                        <option value="" className="text-zinc-500">-- Pilih Kelas Binaan --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.major})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {teacherType === "subject" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                          Kelas Awal yang Diampu
                        </label>
                        <select
                          value={teacherClassId}
                          onChange={(e) => {
                            setTeacherClassId(e.target.value);
                            setTeacherSubjectId("");
                          }}
                          required
                          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 cursor-pointer"
                        >
                          <option value="" className="text-zinc-500">-- Pilih Kelas --</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.major})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                          Mata Pelajaran Awal
                        </label>
                        <select
                          value={teacherSubjectId}
                          onChange={(e) => setTeacherSubjectId(e.target.value)}
                          required
                          disabled={!teacherClassId}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="" className="text-zinc-500">-- Pilih Mata Pelajaran --</option>
                          {(classes.find(c => c.id.toString() === teacherClassId)?.subjects || []).map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} {sub.teacher_id ? "(Sudah ada guru)" : "(Tersedia)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        NIP / NUPTK
                      </label>
                      <input
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        required
                        placeholder="Nomor Induk Pegawai"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                        No. Telp / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-hidden transition-all focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20"
                      />
                    </div>
                  </div>

                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5A77DF]/25 transition-all duration-300 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
            <div className="mt-6 text-center text-xs text-zinc-600">
              Sudah memiliki akun?{" "}
              <Link
                href="/"
                className="font-semibold text-[#5A77DF] hover:text-[#3E53A2] transition-colors"
              >
                Masuk di sini
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
