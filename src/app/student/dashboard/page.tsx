"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

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
  subjects: any[];
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

type DashboardTab = "home" | "modul" | "pelajaran" | "jurnal" | "chat_bk" | "badge" | "profil";

const NAV_ITEMS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "modul", label: "Modul", icon: "📘" },
  { id: "pelajaran", label: "Modul Pelajaran", icon: "📚" },
  { id: "jurnal", label: "Jurnal", icon: "📝" },
  { id: "chat_bk", label: "Chat BK", icon: "💬" },
  { id: "badge", label: "Badge", icon: "🏆" },
  { id: "profil", label: "Profil", icon: "👤" },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [selectedAI, setSelectedAI] = useState<Journal | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Journal form state
  const [journalDate, setJournalDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [moodScore, setMoodScore] = useState<number>(3);
  const [journalNotes, setJournalNotes] = useState("");
  const [journalActivities, setJournalActivities] = useState("");
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [journalMessage, setJournalMessage] = useState<string | null>(null);

  // Chat BK states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [bkTeachers, setBkTeachers] = useState<any[]>([]);
  const [activeTeacherId, setActiveTeacherId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const fetchChatMessages = async (teacherId: number) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/chat?teacherId=${teacherId}`);
      const json = await res.json();
      if (json.success) {
        setChatMessages(json.messages || []);
        setBkTeachers(json.bkTeachers || []);
        setActiveTeacherId(json.activeTeacherId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (activeTab === "chat_bk") {
      fetchChatMessages(activeTeacherId || 0);
    }
  }, [activeTab, activeTeacherId]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTeacherId) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          teacherId: activeTeacherId
        })
      });
      const json = await res.json();
      if (json.success) {
        setChatInput("");
        fetchChatMessages(activeTeacherId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Feedback states
  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<
    Record<number, boolean>
  >({});

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
    "Lencana baru terbuka! 'Cyber Pioneer' telah ditambahkan ke profil Anda.",
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
              avatar: json.student.avatar,
            },
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
        if (json.hasCompletedPretest === false) {
          router.push("/student/pretest");
          return;
        }
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
    // 1. Client-side localStorage check for quick redirect
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj.role === "student" && !userObj.hasCompletedPretest) {
          router.push("/student/pretest");
          return;
        }
      } catch {}
    }

    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData, router]);

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
          activities: journalActivities,
        }),
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
          setNotifications((prev) => [
            `Lencana Baru! Anda membuka lencana '${json.badgeAwarded}' karena menulis jurnal pertama Anda.`,
            ...prev,
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
          <p className="text-sm text-zinc-400">
            Menyelaraskan Dashboard Anda...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#C4E2F5] text-[#0f3b5c] p-6">
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

  const {
    student,
    modules,
    completedModuleIds,
    badges,
    journals,
    leaderboard,
  } = data;

  const recentJournals = journals.filter((journal) => {
    const journalDate = new Date(journal.logged_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return journalDate >= weekAgo;
  });

  const totalWeeklyJournals = recentJournals.length;
  const positiveMoodCount = recentJournals.filter(
    (journal) => journal.mood_score >= 4,
  ).length;
  const neutralMoodCount = recentJournals.filter(
    (journal) => journal.mood_score === 3,
  ).length;
  const lowMoodCount = recentJournals.filter(
    (journal) => journal.mood_score <= 2,
  ).length;
  const moodPercent =
    totalWeeklyJournals > 0
      ? Math.round((positiveMoodCount / totalWeeklyJournals) * 100)
      : 0;
  const positiveMoodPercent = moodPercent;
  const neutralMoodPercent =
    totalWeeklyJournals > 0
      ? Math.round((neutralMoodCount / totalWeeklyJournals) * 100)
      : 0;
  const lowMoodPercent =
    totalWeeklyJournals > 0
      ? Math.round((lowMoodCount / totalWeeklyJournals) * 100)
      : 0;
  const todayJournal = recentJournals.some(
    (journal) =>
      new Date(journal.logged_at).toDateString() === new Date().toDateString(),
  );
  const journalAdvice =
    totalWeeklyJournals > 0
      ? `Mood positif muncul di ${moodPercent}% catatan jurnal minggu ini.`
      : "Isi jurnal hari ini untuk melihat tren moodmu dan dapatkan saran AI yang lebih akurat.";

  return (
    <div className="student-dashboard-page relative flex min-h-screen flex-col bg-[#03000a] text-white font-sans pb-24 md:pb-8">
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
                <div className="text-xs font-bold text-zinc-100 line-clamp-1">
                  {student.name}
                </div>
              </div>
              {student.avatar ? (
                <div className="h-9 w-9 rounded-xl overflow-hidden border border-[#1591DC]/20 bg-[#1591DC]/10 flex items-center justify-center text-lg select-none">
                  {student.avatar.startsWith("data:") ||
                  student.avatar.startsWith("http") ? (
                    <img
                      src={student.avatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
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
            {showNotifications &&
              createPortal(
                <div className="fixed top-16 right-56 w-80 rounded-2xl border border-white/5 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl z-[99999] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Pemberitahuan
                  </h3>

                  <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                    {notifications.map((notif, i) => (
                      <div key={i} className="py-2.5 text-2xs text-zinc-300">
                        {notif}
                      </div>
                    ))}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="z-10 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl sticky top-4 space-y-2">
              <div className="px-2 pb-2 border-b border-white/5">
                <p className="text-2xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Menu
                </p>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Dashboard
                </h3>
              </div>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    activeTab === item.id
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            <main className="w-full">
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
                            {student.avatar.startsWith("data:") ||
                            student.avatar.startsWith("http") ? (
                              <img
                                src={student.avatar}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                              />
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
                          <h2 className="text-lg font-extrabold text-zinc-100">
                            {student.name}
                          </h2>
                          <p className="text-2xs text-zinc-400">
                            NIS: {student.nis} • Kelas: {student.class}
                          </p>
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
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    <div className="flex md:col-span-2 items-center gap-5 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                      <div
                        className="relative flex h-28 w-28 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(
        #8b5cf6 ${student.module_progress}%,
        rgba(255,255,255,.08) ${student.module_progress}% 100%
      )`,
                        }}
                      >
                        <div className="absolute inset-2 rounded-full bg-[#0F172A]" />

                        <div className="relative text-center">
                          <p className="text-2xl font-bold text-white">
                            {student.module_progress}%
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                            Progress
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-base mb-2 font-bold uppercase tracking-widest text-violet-300">
                            Progres Belajar
                          </p>

                          <p className="mt-1 text-sm text-zinc-300">
                            {completedModuleIds.length} dari {modules.length}{" "}
                            modul selesai
                          </p>
                        </div>

                        {/* <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                            style={{ width: `${student.module_progress}%` }}
                          />
                        </div> */}
                      </div>
                    </div>
                    <div className="rounded-2xl md:col-span-3 border border-[#1591DC]/20 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5 backdrop-blur-xl space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold uppercase text-emerald-300">
                            Status Jurnal Minggu Ini
                          </p>
                          {/* <h3 className="mt-1 text-sm font-semibold text-zinc-100">Persentase mood jurnalmu {moodPercent}%</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{journalAdvice}</p> */}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("jurnal")}
                          className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-2xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          {todayJournal ? "Lihat Jurnal" : "Isi Jurnal"}
                        </button>
                      </div>

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="relative flex h-24 w-24 items-center justify-center rounded-full"
                            style={{
                              background: `conic-gradient(#34d399 ${moodPercent}%, #fbbf24 ${moodPercent}% ${moodPercent + neutralMoodPercent}%, #f87171 ${moodPercent + neutralMoodPercent}% 100%)`,
                            }}
                          >
                            <div className="absolute inset-2.5 rounded-full " />
                            <div className="relative text-center">
                              {/* <p className="text-lg font-semibold text-[#0f3b5c]">{moodPercent}%</p> */}
                              {/* <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">positif</p> */}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                              <span className="text-xs text-zinc-300">
                                Mood Positif • {positiveMoodPercent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                              <span className="text-xs text-zinc-300">
                                Biasa • {neutralMoodPercent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                              <span className="text-xs text-zinc-300">
                                Butuh Perhatian • {lowMoodPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* <div className="rounded-xl border border-[#1591DC]/20 bg-white/[0.01] px-3 py-2 text-right">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Rincian minggu ini
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {positiveMoodPercent}% positif
                        </p>
                        <p className="text-xs text-zinc-400">
                          {neutralMoodPercent}% biasa
                        </p>
                        <p className="text-xs text-zinc-400">
                          {" "}
                          {lowMoodPercent}% butuh perhatian
                        </p>
                      </div> */}
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout for Widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Recommendation Widget */}
                    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">
                          Rekomendasi AI Untuk Anda
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Berdasarkan asesmen literasi dan mental digital Anda,
                          berikut modul yang disarankan untuk diselesaikan
                          terlebih dahulu:
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
                                    <h4 className="text-xs font-semibold text-zinc-100">
                                      {m.title}
                                    </h4>
                                    <span className="text-3xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                                      {m.category.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-2xs font-extrabold px-2.5 py-1 rounded-lg ${
                                      isDone
                                        ? "text-emerald-400 bg-emerald-400/15"
                                        : "text-violet-400 bg-violet-400/15"
                                    }`}
                                  >
                                    {isDone ? "Selesai" : "Mulai"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-2xs text-zinc-500 italic">
                            Belum ada modul yang ditambahkan ke level ini.
                          </p>
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
                              {
                                badges.unlocked[badges.unlocked.length - 1]
                                  .description
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="py-4 text-3xs text-zinc-500 italic">
                            Belum ada lencana yang terbuka.
                          </div>
                        )}
                      </div>

                      {/* Leaderboard Sehat */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-white/5">
                            Peringkat Sehat
                          </h3>
                          <p className="text-3xs text-zinc-400 pt-2 leading-relaxed">
                            Mengukur progres belajar adaptif Anda dibandingkan
                            teman-teman seangkatan.
                          </p>
                        </div>
                        <div className="py-2 text-center">
                          <span className="text-3xl font-extrabold text-indigo-400 tracking-tight">
                            #{leaderboard.rank}
                          </span>
                          <span className="text-zinc-500 text-xs">
                            {" "}
                            dari {leaderboard.total}
                          </span>
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
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Modul Belajar Adaptif
                    </h2>
                    <p className="text-2xs text-zinc-400">
                      Modul-modul ini disajikan khusus untuk membantu Anda di
                      level{" "}
                      <strong className="text-violet-400 uppercase">
                        {student.literacy_level}
                      </strong>
                      .
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
                              <h3 className="text-sm font-bold text-zinc-100">
                                {m.title}
                              </h3>
                              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                                {m.content}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/student/module/${m.id}`)
                                }
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
                      <p className="text-xs text-zinc-500 italic">
                        Belum ada modul yang disiapkan untuk tingkat{" "}
                        {student.literacy_level}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "pelajaran" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Modul Mata Pelajaran Sekolah
                    </h2>
                    <p className="text-2xs text-zinc-400">
                      Modul dan kuis khusus untuk mata pelajaran yang ada di kelas Anda.
                    </p>
                  </div>

                  {!data?.subjects || data.subjects.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <p className="text-xs text-zinc-500 italic">
                        Belum ada mata pelajaran yang terdaftar untuk kelas Anda.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {data.subjects.map((sub: any) => (
                        <div key={sub.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-zinc-100">{sub.name}</h3>
                              <p className="text-xs text-zinc-500">Guru Pengampu: {sub.teacher?.name || "Belum ditentukan"}</p>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-3xs font-semibold text-emerald-300 uppercase">
                              {sub.modules.length} Modul
                            </span>
                          </div>

                          <div className="space-y-3">
                            {sub.modules.length === 0 ? (
                              <p className="text-xs text-zinc-500 italic">Belum ada modul pelajaran.</p>
                            ) : (
                              sub.modules.map((mod: any) => {
                                const isDone = completedModuleIds.includes(mod.id);
                                return (
                                  <div key={mod.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/10 transition">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm text-zinc-200">{mod.title}</h4>
                                        {isDone && (
                                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                                            ✓ Selesai
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-zinc-500 mt-1 max-w-[500px] truncate">{mod.content}</p>
                                    </div>
                                    <button
                                      onClick={() => router.push(`/student/module/${mod.id}`)}
                                      className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-2xs font-bold text-zinc-300 transition"
                                    >
                                      Buka Modul
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
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
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Jurnal Refleksi Harian
                    </h2>
                    <p className="text-2xs text-zinc-400">
                      Tuliskan kondisi emosi dan durasi screen time Anda untuk
                      membantu AI DigiMind <br /> menganalisis kondisi kesehatan
                      mental Anda.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Journal Form */}
                    <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
                      <form
                        onSubmit={handleSubmitJournal}
                        className="space-y-5"
                      >
                        {journalMessage && (
                          <div
                            className={`p-4 rounded-xl text-xs font-semibold ${
                              journalMessage.includes("berhasil")
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
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
                        {/* <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Tanggal Jurnal
                          </label>

                          <input
                            type="date"
                            value={journalDate}
                            onChange={(e) => setJournalDate(e.target.value)}
                            className="w-full rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-zinc-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                          />
                        </div> */}

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
                                <span className="text-[9px] sm:text-3xs uppercase tracking-normal whitespace-nowrap">
                                  {emoji.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Screen Time / Activities */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Screen Time Hari Ini
                          </label>

                          <select
                            value={journalActivities}
                            onChange={(e) =>
                              setJournalActivities(e.target.value)
                            }
                            className="
    w-full
    rounded-xl
    border border-white/10
    bg-[#14101d]
    px-4 py-3
    text-xs text-white
    cursor-pointer
    outline-none
    focus:border-violet-500
    focus:ring-2
    focus:ring-violet-500/40
  "
                          >
                            <option
                              value=""
                              className="bg-[#14101d] text-zinc-400"
                            >
                              Pilih durasi screen time
                            </option>

                            <option
                              value="< 1 jam"
                              className="bg-[#14101d] text-white"
                            >
                              Kurang dari 1 jam
                            </option>

                            <option
                              value="1-2 jam"
                              className="bg-[#14101d] text-white"
                            >
                              1 - 2 jam
                            </option>

                            <option
                              value="2-4 jam"
                              className="bg-[#14101d] text-white"
                            >
                              2 - 4 jam
                            </option>

                            <option
                              value="4-6 jam"
                              className="bg-[#14101d] text-white"
                            >
                              4 - 6 jam
                            </option>

                            <option
                              value="6-8 jam"
                              className="bg-[#14101d] text-white"
                            >
                              6 - 8 jam
                            </option>

                            <option
                              value="> 8 jam"
                              className="bg-[#14101d] text-white"
                            >
                              Lebih dari 8 jam
                            </option>
                          </select>
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
                          {submittingJournal
                            ? "Menyimpan Jurnal..."
                            : "Simpan Catatan Jurnal"}
                        </button>
                      </form>
                    </div>

                    {/* Journal History Sidebar */}
                    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-4 max-h-[480px] overflow-y-auto scrollbar-hide">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/5">
                        Riwayat Jurnal Refleksi
                      </h3>

                      {journals && journals.length > 0 ? (
                        <div className="space-y-3">
                          {journals.map((j) => {
                            const moodObj = MOOD_EMOJIS.find(
                              (m) => m.score === j.mood_score,
                            );

                            const formattedDate = new Date(
                              j.logged_at,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            });

                            return (
                              <div
                                key={j.id}
                                className="p-3 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5 text-left"
                              >
                                {/* HEADER */}
                                <div className="flex items-center justify-between">
                                  <span className="text-[14px]">
                                    {moodObj?.char} {moodObj?.label}
                                  </span>

                                  <span className="text-xs text-zinc-500">
                                    {formattedDate}
                                  </span>
                                </div>

                                {/* SCREEN TIME */}
                                {j.activities && (
                                  <p className="text-xs text-zinc-400 italic">
                                    <strong>Screen Time :</strong>{" "}
                                    {j.activities}
                                  </p>
                                )}

                                {/* NOTES */}
                                {j.notes && (
                                  <p className="text-2xs text-zinc-400 leading-normal line-clamp-2">
                                    {j.notes}
                                  </p>
                                )}

                                {/* AI BUTTON */}
                                {j.ai_feedback && (
                                  <div className="pt-2 border-t border-white/5">
                                    <button
                                      onClick={() => setSelectedAI(j)}
                                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300 transition"
                                    >
                                      💡 <span>Lihat Analisis AI</span>
                                    </button>
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
                    {selectedAI && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0b1a] p-5 shadow-2xl relative animate-fadeIn">
                          {/* CLOSE */}
                          <button
                            onClick={() => setSelectedAI(null)}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-white"
                          >
                            ✕
                          </button>

                          {/* HEADER */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">🤖</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                              Analisis AI DigiMind
                            </h3>
                          </div>

                          {/* CONTENT */}
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {selectedAI.ai_feedback}
                          </p>

                          {/* FOOTER */}
                          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-zinc-500 flex justify-between">
                            <span>{selectedAI.activities}</span>
                            <span>
                              {new Date(
                                selectedAI.logged_at,
                              ).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
            TAB 4: BADGE (GRID KOLEKSI LENCANA)
            ======================================================== */}
              {activeTab === "badge" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Koleksi Lencana Gamifikasi
                    </h2>
                    <p className="text-2xs text-zinc-400">
                      Selesaikan modul-modul belajar dan buat jurnal refleksi
                      untuk membuka lencana baru!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {badges.all.map((badge) => {
                      const isUnlocked = badges.unlocked.some(
                        (ub) => ub.name === badge.name,
                      );

                      return (
                        <div
                          key={badge.id}
                          className={`rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition ${
                            isUnlocked
                              ? "border-violet-500/20 bg-violet-950/[0.02] shadow-[0_0_20px_rgba(139,92,246,0.05)]"
                              : "border-white/5 bg-white/[0.01] opacity-40 grayscale"
                          }`}
                        >
                          <div
                            className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl border ${
                              isUnlocked
                                ? "bg-violet-600/10 border-violet-500/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            {badge.name === "Fact-Checker"
                              ? "🔍"
                              : badge.name === "Screen Guard"
                                ? "🛡️"
                                : badge.name === "Cyber Pioneer"
                                  ? "🚀"
                                  : "🎓"}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-zinc-200">
                              {badge.name}
                            </h3>
                            <p className="text-3xs text-zinc-500 mt-1 leading-relaxed px-2">
                              {badge.description}
                            </p>
                          </div>
                          <span
                            className={`text-3xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              isUnlocked
                                ? "bg-violet-500/10 text-violet-400 border-violet-500/25"
                                : "bg-white/5 text-zinc-600 border-white/5"
                            }`}
                          >
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
                    <div
                      className={`p-4 rounded-xl text-xs font-semibold ${
                        profileMessage.includes("berhasil")
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
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
                            editAvatar.startsWith("data:") ||
                            editAvatar.startsWith("http") ? (
                              <img
                                src={editAvatar}
                                alt="Edit Avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              editAvatar
                            )
                          ) : (
                            <span className="text-violet-400 font-bold text-xl">
                              {editName.charAt(0).toUpperCase()}
                            </span>
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
                            {[
                              "🧑‍🚀",
                              "👾",
                              "🤖",
                              "🕵️",
                              "🦊",
                              "🦄",
                              "🐼",
                              "⭐",
                            ].map((avatarPreset) => (
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
                          onChange={(e) =>
                            setEditUsername(
                              e.target.value.replace(/\s+/g, "").toLowerCase(),
                            )
                          }
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
                            student.avatar.startsWith("data:") ||
                            student.avatar.startsWith("http") ? (
                              <img
                                src={student.avatar}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              student.avatar
                            )
                          ) : (
                            <span className="text-violet-400 font-bold text-xl">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="text-base font-extrabold text-zinc-100">
                            {student.name}
                          </h3>
                          <p className="text-3xs text-violet-400 font-semibold mt-0.5">
                            @{student.username}
                          </p>
                          <p className="text-3xs text-zinc-500 font-mono mt-0.5">
                            Siswa • NIS: {student.nis}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                          <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">
                            Kelas
                          </div>
                          <div className="font-bold text-zinc-100">
                            {student.class}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                          <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">
                            Tingkat Literasi Digital
                          </div>
                          <div className="font-bold text-violet-400 uppercase">
                            {student.literacy_level}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                          <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">
                            Kondisi Kesehatan Mental
                          </div>
                          <div className="font-bold text-indigo-400 uppercase">
                            {student.mental_level}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                          <div className="text-3xs uppercase tracking-wider text-zinc-500 mb-1">
                            Total Lencana Terbuka
                          </div>
                          <div className="font-bold text-emerald-400">
                            {badges.unlocked.length} / {badges.all.length}
                          </div>
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

              {activeTab === "chat_bk" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Konsultasi Bimbingan Konseling (BK)
                    </h2>
                    <p className="text-2xs text-zinc-400">
                      Diskusikan kondisi kesehatan mental atau masalah akademik Anda secara aman bersama Guru BK sekolah.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[1fr_2.5fr]">
                    {/* Counselor list */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl h-fit">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Guru BK Aktif</h3>
                      {bkTeachers.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic">Tidak ada guru BK terdaftar.</p>
                      ) : (
                        <div className="space-y-2">
                          {bkTeachers.map((teacher) => {
                            const isSelected = activeTeacherId === teacher.id;
                            return (
                              <button
                                key={teacher.id}
                                onClick={() => setActiveTeacherId(teacher.id)}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                                  isSelected
                                    ? "border-violet-500 bg-violet-600/10 text-violet-300 font-semibold"
                                    : "border-white/5 bg-black/10 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                                }`}
                              >
                                👩‍🏫 {teacher.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Chat Box */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl flex flex-col h-[450px]">
                      {activeTeacherId ? (
                        <>
                          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                            {loadingChat ? (
                              <div className="text-center text-xs text-zinc-400 mt-10">Memuat pesan...</div>
                            ) : chatMessages.length === 0 ? (
                              <div className="text-center text-xs text-zinc-500 mt-10">Belum ada percakapan. Mulai percakapan pertama Anda dengan mengirim pesan di bawah!</div>
                            ) : (
                              chatMessages.map((msg) => {
                                const isSelf = msg.sender === "student";
                                return (
                                  <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                                    <span className="text-3xs text-zinc-500 mb-1">{isSelf ? "Anda" : "Guru BK"}</span>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isSelf ? "bg-violet-600 text-white rounded-tr-none" : "bg-white/10 text-zinc-200 rounded-tl-none"}`}>
                                      {msg.message}
                                    </div>
                                    <span className="text-[9px] text-zinc-600 mt-1">{new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-white/5">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ketik pesan konsultasi Anda..."
                              className="flex-1 rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition"
                            >
                              Kirim
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 italic">
                          Pilih Guru BK di sebelah kiri untuk berkonsultasi
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
