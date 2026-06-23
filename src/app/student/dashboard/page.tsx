"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: number;
  name: string;
  username: string;
  nis: string;
  class: string;
  avatar: string | null;
  literacy_level: string;
  mental_level: string;
  module_progress: number;
  risk_flag: boolean;
}

interface ModuleCategory {
  id: number;
  name: string;
}

interface Module {
  id: number;
  title: string;
  content: string;
  category: ModuleCategory;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
}

interface BadgesState {
  all: Badge[];
  unlocked: Badge[];
}

interface Journal {
  id: number;
  mood_score: number;
  notes: string | null;
  activities: string | null;
  ai_feedback: string | null;
  logged_at: string;
}

interface Leaderboard {
  rank: number;
  total: number;
}

interface DashboardData {
  success: boolean;
  student: Student;
  modules: Module[];
  completedModuleIds: number[];
  badges: BadgesState;
  journals: Journal[];
  leaderboard: Leaderboard;
}

// Emojis for mood
const MOOD_EMOJIS = [
  { score: 1, char: "😢", label: "Buruk" },
  { score: 2, char: "😕", label: "Cemas" },
  { score: 3, char: "😐", label: "Biasa" },
  { score: 4, char: "🙂", label: "Baik" },
  { score: 5, char: "😄", label: "Sangat Baik" },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "modul" | "jurnal" | "badge" | "profil">("home");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Journal form state
  const [moodScore, setMoodScore] = useState<number>(3);
  const [journalNotes, setJournalNotes] = useState("");
  const [journalActivities, setJournalActivities] = useState("");
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [journalMessage, setJournalMessage] = useState<string | null>(null);

  // AI Feedback states
  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Record<number, boolean>>({});

  const toggleFeedback = (journalId: number) => {
    setExpandedFeedbacks((prev) => ({
      ...prev,
      [journalId]: !prev[journalId],
    }));
  };

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Selamat datang di DigiMind! Diagnosis awal Anda berhasil disimpan.",
    "Lencana baru terbuka! 'Cyber Pioneer' telah ditambahkan ke profil Anda."
  ]);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const handleOpenEditProfile = () => {
    if (!student) return;
    setEditName(student.name);
    setEditUsername(student.username);
    setEditAvatar(student.avatar || "");
    setIsEditingProfile(true);
    setProfileMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          avatar: editAvatar,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setProfileMessage("Profil berhasil diperbarui!");
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            student: {
              ...prev.student,
              name: json.student.name,
              username: json.student.username,
              avatar: json.student.avatar
            }
          };
        });
        setIsEditingProfile(false);
      } else {
        setProfileMessage(`Gagal: ${json.message}`);
      }
    } catch {
      setProfileMessage("Terjadi kesalahan koneksi.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.message || "Gagal memuat data dashboard.");
        if (res.status === 401) {
          router.push("/");
        }
      }
    } catch {
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  // Submit journal
  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJournal(true);
    setJournalMessage(null);
    setLatestFeedback(null);
    try {
      const res = await fetch("/api/student/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodScore,
          notes: journalNotes,
          activities: journalActivities
        })
      });
      const json = await res.json();
      if (json.success) {
        setJournalNotes("");
        setJournalActivities("");
        setJournalMessage("Jurnal harian berhasil disimpan!");
        if (json.journal && json.journal.ai_feedback) {
          setLatestFeedback(json.journal.ai_feedback);
        }
        if (json.badgeAwarded) {
          setNotifications(prev => [
            `Lencana Baru! Anda membuka lencana '${json.badgeAwarded}' karena menulis jurnal pertama Anda.`,
            ...prev
          ]);
        }
        await fetchDashboardData();
      } else {
        setJournalMessage(`Gagal: ${json.message}`);
      }
    } catch {
      setJournalMessage("Gagal mengirim data jurnal.");
    } finally {
      setSubmittingJournal(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", { method: "DELETE" }); // Assuming DELETE logs out
      localStorage.removeItem("user");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  // Generate ASCII block progress bar (e.g. ████▒▒ 40%)
  const getProgressBlocks = (percent: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.round(percent / 10);
    const emptyBlocks = totalBlocks - filledBlocks;
    return "".repeat(filledBlocks) + "".repeat(emptyBlocks) + ` ${percent}%`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] text-white">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Menyelaraskan Dashboard Anda...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#03000a] text-white p-6">
        <div className="max-w-md w-full bg-red-950/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold">Koneksi Gagal</h2>
          <p className="text-xs text-zinc-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.student) {
    return null;
  }

  const { student, modules, completedModuleIds, badges, journals, leaderboard } = data;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#03000a] text-white font-sans pb-24 md:pb-8">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      {/* TOP NAVBAR (Notification & Title) */}
      <header className="z-10 w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            D
          </div>
          <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 uppercase text-xs">
            DigiMind
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Student Profile Info on Navbar */}
          {student && (
            <button
              type="button"
              onClick={() => setActiveTab("profil")}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition cursor-pointer"
            >
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-zinc-100 line-clamp-1">{student.name}</div>
              </div>
              {student.avatar ? (
                <div className="h-9 w-9 rounded-xl overflow-hidden border border-violet-500/20 bg-violet-600/5 flex items-center justify-center text-lg select-none">
                  {student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                    <img src={student.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    student.avatar
                  )}
                </div>
              ) : (
                <div className="h-9 w-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-xs">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-9 w-9 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition cursor-pointer"
            >
              🔔
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-violet-500 animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#090514]/95 p-4 shadow-2xl backdrop-blur-xl z-50 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pemberitahuan</h3>
                <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                  {notifications.map((notif, i) => (
                    <div key={i} className="py-2.5 text-2xs text-zinc-300 leading-normal">
                      {notif}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        
        {/* ========================================================
            TAB 1: HOME (DASHBOARD UTAMA)
            ======================================================== */}
        {activeTab === "home" && (
          <div className="space-y-6">
            
            {/* Header Profile Card */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  {student.avatar ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-violet-500/20 bg-violet-600/5 flex items-center justify-center text-2xl select-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      {student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                        <img src={student.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        student.avatar
                      )}
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-extrabold text-zinc-100">{student.name}</h2>
                    <p className="text-2xs text-zinc-400">NIS: {student.nis} • Kelas: {student.class}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full text-3xs font-extrabold tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase">
                    Literasi: {student.literacy_level}
                  </span>
                  <span className="px-3 py-1 rounded-full text-3xs font-extrabold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                    Mental: {student.mental_level}
                  </span>
                  {student.risk_flag && (
                    <span className="px-3 py-1 rounded-full text-3xs font-extrabold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                      ⚠️ Butuh Pendampingan
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar widget */}
              <div className="w-full md:w-72 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-zinc-400 font-bold uppercase tracking-wider">Progres Belajar</span>
                  <span className="text-2xs font-semibold text-zinc-300">
                    {completedModuleIds.length} / {modules.length} Modul
                  </span>
                </div>
                <div className="font-mono text-xs text-violet-400 tracking-wider">
                  {getProgressBlocks(student.module_progress)}
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${student.module_progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grid Layout for Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Recommendation Widget */}
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">Rekomendasi AI Untuk Anda</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Berdasarkan asesmen literasi dan mental digital Anda, berikut modul yang disarankan untuk diselesaikan terlebih dahulu:
                  </p>
                  
                  {modules.length > 0 ? (
                    <div className="space-y-2.5">
                      {modules.slice(0, 2).map((m) => {
                        const isDone = completedModuleIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              router.push(`/student/module/${m.id}`);
                            }}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:border-violet-500/40 hover:bg-white/[0.03] transition cursor-pointer"
                          >
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-zinc-100">{m.title}</h4>
                              <span className="text-3xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                                {m.category.name}
                              </span>
                            </div>
                            <span className={`text-2xs font-extrabold px-2.5 py-1 rounded-lg ${
                              isDone ? "text-emerald-400 bg-emerald-400/15" : "text-violet-400 bg-violet-400/15"
                            }`}>
                              {isDone ? "Selesai" : "Mulai"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-2xs text-zinc-500 italic">Belum ada modul yang ditambahkan ke level ini.</p>
                  )}
                </div>
              </div>

              {/* Badges and Leaderboard Widget */}
              <div className="flex flex-col gap-6">
                
                {/* Badge Terbaru */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl text-center space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-left pb-1.5 border-b border-white/5">
                    Lencana Terbaru
                  </h3>
                  
                  {badges.unlocked.length > 0 ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="h-16 w-16 bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 rounded-full border border-violet-500/40 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                        🏆
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200">
                        {badges.unlocked[badges.unlocked.length - 1].name}
                      </h4>
                      <p className="text-3xs text-zinc-400 px-4">
                        {badges.unlocked[badges.unlocked.length - 1].description}
                      </p>
                    </div>
                  ) : (
                    <div className="py-4 text-3xs text-zinc-500 italic">Belum ada lencana yang terbuka.</div>
                  )}
                </div>

                {/* Leaderboard Sehat */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-white/5">
                      Peringkat Sehat
                    </h3>
                    <p className="text-3xs text-zinc-400 pt-2 leading-relaxed">
                      Mengukur progres belajar adaptif Anda dibandingkan teman-teman seangkatan.
                    </p>
                  </div>
                  <div className="py-2 text-center">
                    <span className="text-3xl font-extrabold text-indigo-400 tracking-tight">
                      #{leaderboard.rank}
                    </span>
                    <span className="text-zinc-500 text-xs"> dari {leaderboard.total}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: MODUL (BELAJAR LEVEL-ADAPTIF)
            ======================================================= */}
        {activeTab === "modul" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Modul Belajar Adaptif</h2>
              <p className="text-2xs text-zinc-400">
                Modul-modul ini disajikan khusus untuk membantu Anda di level <strong className="text-violet-400 uppercase">{student.literacy_level}</strong>.
              </p>
            </div>

            {modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((m) => {
                  const isDone = completedModuleIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-6 flex flex-col justify-between gap-4 transition duration-200 ${
                        isDone 
                          ? "border-emerald-500/20 bg-emerald-950/[0.02] shadow-[inset_0_0_20px_rgba(16,185,129,0.02)]" 
                          : "border-white/10 bg-white/[0.02] hover:border-violet-500/30"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-extrabold tracking-wider text-violet-400 uppercase bg-violet-400/5 px-2 py-0.5 rounded-full border border-violet-500/10">
                            {m.category.name}
                          </span>
                          {isDone && (
                            <span className="text-3xs font-extrabold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase">
                              ✓ Selesai
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-zinc-100">{m.title}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                          {m.content}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/student/module/${m.id}`)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] py-2.5 text-2xs font-bold text-zinc-300 transition text-center"
                        >
                          Pelajari Modul
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.01]">
                <p className="text-xs text-zinc-500 italic">Belum ada modul yang disiapkan untuk tingkat {student.literacy_level}.</p>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            TAB 3: JURNAL (REFLEKSI HARIAN)
            ======================================================== */}
        {activeTab === "jurnal" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Jurnal Refleksi Harian</h2>
              <p className="text-2xs text-zinc-400">
                Tuliskan kondisi emosi dan durasi screen time Anda untuk membantu AI DigiMind menganalisis kondisi kesehatan mental Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Journal Form */}
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
                <form onSubmit={handleSubmitJournal} className="space-y-5">
                  {journalMessage && (
                    <div className={`p-4 rounded-xl text-xs font-semibold ${
                      journalMessage.includes("berhasil") 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {journalMessage}
                    </div>
                  )}

                  {latestFeedback && (
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-600/5 p-5 shadow-lg backdrop-blur-xl relative animate-fadeIn space-y-3 text-left">
                      <button
                        type="button"
                        onClick={() => setLatestFeedback(null)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                          Analisis AI DigiMind
                        </h4>
                      </div>
                      <p className="text-2xs text-zinc-300 leading-relaxed text-justify">
                        {latestFeedback}
                      </p>
                    </div>
                  )}

                  {/* Mood Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Bagaimana perasaanmu hari ini?
                    </label>
                    <div className="flex items-center justify-between gap-2 py-2">
                      {MOOD_EMOJIS.map((emoji) => (
                        <button
                          key={emoji.score}
                          type="button"
                          onClick={() => setMoodScore(emoji.score)}
                          className={`flex-1 rounded-xl border py-3 px-1.5 sm:px-2 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                            moodScore === emoji.score 
                              ? "border-violet-500 bg-violet-600/15 text-white font-bold" 
                              : "border-white/5 bg-white/[0.01] text-zinc-500 hover:border-white/10 hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className="text-2xl">{emoji.char}</span>
                          <span className="text-[9px] sm:text-3xs uppercase tracking-normal whitespace-nowrap">{emoji.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screen Time / Activities */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Aktivitas Layar Hari Ini (Screen Time)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Belajar online 3 jam, scrolling tiktok 2 jam, gaming 1 jam"
                      value={journalActivities}
                      onChange={(e) => setJournalActivities(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  {/* Reflective Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Catatan Refleksi Emosi
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Bagaimana perasaanmu setelah scrolling hari ini? Apakah cemas, terhibur, stres, atau tenang? Tuliskan refleksimu di sini..."
                      value={journalNotes}
                      onChange={(e) => setJournalNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingJournal}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {submittingJournal ? "Menyimpan Jurnal..." : "Simpan Catatan Jurnal"}
                  </button>
                </form>
              </div>

              {/* Journal History Sidebar */}
              <div className="md:col-span-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-4 max-h-[480px] overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/5">
                  Riwayat Jurnal Refleksi
                </h3>
                
                {journals && journals.length > 0 ? (
                  <div className="space-y-3">
                    {journals.map((j) => {
                      const moodObj = MOOD_EMOJIS.find(m => m.score === j.mood_score);
                      const formattedDate = new Date(j.logged_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short"
                      });
                      
                      return (
                        <div key={j.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{moodObj?.char} {moodObj?.label}</span>
                            <span className="text-3xs text-zinc-500">{formattedDate}</span>
                          </div>
                          {j.activities && (
                            <p className="text-3xs text-zinc-400 italic">
                              <strong>Gawai:</strong> {j.activities}
                            </p>
                          )}
                          {j.notes && (
                            <p className="text-3xs text-zinc-400 leading-normal line-clamp-2">
                              {j.notes}
                            </p>
                          )}
                          {j.ai_feedback && (
                            <div className="pt-1.5 border-t border-white/5 mt-2">
                              <button
                                type="button"
                                onClick={() => toggleFeedback(j.id)}
                                className="text-4xs uppercase tracking-wider font-extrabold text-violet-400 hover:text-violet-300 transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>💡</span>
                                <span>{expandedFeedbacks[j.id] ? "Tutup Analisis AI" : "Lihat Analisis AI"}</span>
                              </button>
                              
                              {expandedFeedbacks[j.id] && (
                                <p className="text-4xs text-zinc-300 mt-2 leading-relaxed bg-violet-950/10 border border-violet-500/10 rounded-lg p-2 animate-fadeIn text-justify">
                                  {j.ai_feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-3xs text-zinc-600 italic">
                    Belum ada jurnal yang disimpan sebelumnya.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: BADGE (GRID KOLEKSI LENCANA)
            ======================================================== */}
        {activeTab === "badge" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Koleksi Lencana Gamifikasi</h2>
              <p className="text-2xs text-zinc-400">
                Selesaikan modul-modul belajar dan buat jurnal refleksi untuk membuka lencana baru!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.all.map((badge) => {
                const isUnlocked = badges.unlocked.some((ub) => ub.name === badge.name);
                
                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition ${
                      isUnlocked 
                        ? "border-violet-500/20 bg-violet-950/[0.02] shadow-[0_0_20px_rgba(139,92,246,0.05)]" 
                        : "border-white/5 bg-white/[0.01] opacity-40 grayscale"
                    }`}
                  >
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl border ${
                      isUnlocked 
                        ? "bg-violet-600/10 border-violet-500/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                        : "bg-white/5 border-white/10"
                    }`}>
                      {badge.name === "Fact-Checker" ? "🔍" : badge.name === "Screen Guard" ? "🛡️" : badge.name === "Cyber Pioneer" ? "🚀" : "🎓"}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-200">{badge.name}</h3>
                      <p className="text-3xs text-zinc-500 mt-1 leading-relaxed px-2">
                        {badge.description}
                      </p>
                    </div>
                    <span className={`text-3xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      isUnlocked 
                        ? "bg-violet-500/10 text-violet-400 border-violet-500/25" 
                        : "bg-white/5 text-zinc-600 border-white/5"
                    }`}>
                      {isUnlocked ? "Terbuka" : "Terkunci"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: PROFIL (INFORMASI DIRI & LOGOUT)
            ======================================================== */}
        {activeTab === "profil" && (
          <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-extrabold tracking-tight">
                Profil Pengguna DigiMind
              </h2>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="rounded-xl border border-violet-500/30 bg-violet-600/10 px-4 py-2 text-2xs font-bold text-violet-400 hover:bg-violet-600/20 transition cursor-pointer"
                >
                  Edit Profil
                </button>
              )}
            </div>

            {profileMessage && (
              <div className={`p-4 rounded-xl text-xs font-semibold ${
                profileMessage.includes("berhasil") 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {profileMessage}
              </div>
            )}

            {isEditingProfile ? (
              /* Edit Profile Mode */
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Avatar Uploader & Presets */}
                <div className="space-y-3 flex flex-col items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 self-start">
                    Pilih Foto Profil
                  </label>
                  
                  {/* Current Avatar Preview */}
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-violet-500/30 bg-violet-600/5 flex items-center justify-center text-5xl shadow-lg shadow-violet-500/10 select-none">
                    {editAvatar ? (
                      editAvatar.startsWith("data:") || editAvatar.startsWith("http") ? (
                        <img src={editAvatar} alt="Edit Avatar" className="h-full w-full object-cover" />
                      ) : (
                        editAvatar
                      )
                    ) : (
                      <span className="text-violet-400 font-bold text-xl">{editName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* File Input Uploader */}
                  <div className="flex gap-2 justify-center pt-2">
                    <label className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 px-3 py-1.5 text-3xs font-bold text-zinc-300 transition cursor-pointer">
                      📂 Unggah Foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar("")}
                        className="rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 px-3 py-1.5 text-3xs font-bold text-red-400 transition cursor-pointer"
                      >
                        ✕ Hapus
                      </button>
                    )}
                  </div>

                  {/* Preset Emojis Picker */}
                  <div className="w-full pt-3 space-y-2">
                    <span className="text-4xs font-bold uppercase tracking-wider text-zinc-500">
                      Atau pilih Avatar Preset:
                    </span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["🧑‍🚀", "👾", "🤖", "🕵️", "🦊", "🦄", "🐼", "⭐"].map((avatarPreset) => (
                        <button
                          key={avatarPreset}
                          type="button"
                          onClick={() => setEditAvatar(avatarPreset)}
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg transition cursor-pointer ${
                            editAvatar === avatarPreset 
                              ? "border-violet-500 bg-violet-600/20" 
                              : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/5"
                          }`}
                        >
                          {avatarPreset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Name Input */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                </div>

                {/* Edit Username Input */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Nama Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                </div>

                {/* Edit Form Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/5 text-zinc-400 text-xs font-semibold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>

              </form>
            ) : (
              /* View Profile Mode */
              <div className="space-y-6">
                
                {/* Profile Header Avatar */}
                <div className="flex flex-col items-center space-y-3 pb-2">
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-violet-500/20 bg-violet-600/5 flex items-center justify-center text-5xl shadow-lg shadow-violet-500/5 select-none">
                    {student.avatar ? (
                      student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                        <img src={student.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        student.avatar
                      )
                    ) : (
                      <span className="text-violet-400 font-bold text-xl">{student.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-extrabold text-zinc-100">{student.name}</h3>
                    <p className="text-3xs text-violet-400 font-semibold mt-0.5">@{student.username}</p>
                    <p className="text-3xs text-zinc-500 font-mono mt-0.5">Siswa • NIS: {student.nis}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">Kelas</div>
                    <div className="font-bold text-zinc-100">{student.class}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">Tingkat Literasi Digital</div>
                    <div className="font-bold text-violet-400 uppercase">{student.literacy_level}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">Kondisi Kesehatan Mental</div>
                    <div className="font-bold text-indigo-400 uppercase">{student.mental_level}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">Total Lencana Terbuka</div>
                    <div className="font-bold text-emerald-400">{badges.unlocked.length} / {badges.all.length}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-xs font-semibold tracking-wide transition active:scale-[0.98] cursor-pointer"
                  >
                    Keluar dari Akun (Logout)
                  </button>
                </div>

              </div>
            )}
            
          </div>
        )}

      </main>

      {/* BOTTOM NAV BAR (5 ICONS) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#060310]/90 backdrop-blur-xl border-t border-white/10 py-2.5 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.5)] md:max-w-md md:mx-auto md:bottom-4 md:rounded-2xl md:border">
        <div className="flex items-center justify-around">
          
          {/* Home */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "home" ? "text-violet-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-3xs uppercase tracking-wider font-medium">Home</span>
          </button>

          {/* Modul */}
          <button
            type="button"
            onClick={() => setActiveTab("modul")}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "modul" ? "text-violet-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg">📘</span>
            <span className="text-3xs uppercase tracking-wider font-medium">Modul</span>
          </button>

          {/* Jurnal */}
          <button
            type="button"
            onClick={() => setActiveTab("jurnal")}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "jurnal" ? "text-violet-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg">📝</span>
            <span className="text-3xs uppercase tracking-wider font-medium">Jurnal</span>
          </button>

          {/* Badge */}
          <button
            type="button"
            onClick={() => setActiveTab("badge")}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "badge" ? "text-violet-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg">🏆</span>
            <span className="text-3xs uppercase tracking-wider font-medium">Badge</span>
          </button>

          {/* Profil */}
          <button
            type="button"
            onClick={() => setActiveTab("profil")}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === "profil" ? "text-violet-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg">👤</span>
            <span className="text-3xs uppercase tracking-wider font-medium">Profil</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
