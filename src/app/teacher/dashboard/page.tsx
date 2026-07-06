"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: number;
  name: string;
  className: string;
  literacyProgress: number;
  mentalHealthProgress: number;
  subjectProgress: number;
  mentalStatus: string;
  screenTime: number;
  moodScore: number;
  modulesCompleted: number;
  riskFlag: boolean;
  riskReason: string;
  latestJournal: {
    moodScore: number;
    activities: string | null;
    aiFeedback: string | null;
  } | null;
};

type Intervention = {
  id: number;
  studentName: string;
  note: string;
  status: string;
  updatedAt: string;
};

type TeacherDashboardData = {
  success: boolean;
  teacher: {
    id: number;
    name: string;
    nip: string;
    specialization: string;
    position: string;
    type: string;
  };
  classSummary: {
    totalStudents: number;
    averageProgress: number;
    averageMood: number;
    averageMentalHealthProgress: number;
    averageLiteracyProgress: number;
    averageSubjectProgress: number;
    lowMoodCount: number;
    lowMoodPercentage: number;
    riskCount: number;
    classes: string[];
  };
  students: Student[];
  alerts: Student[];
  aiInsights: string[];
  interventions: Intervention[];
  privacyNotice: string;
};

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "siswa", label: "Siswa", icon: "👩‍🏫" },
  { id: "insight", label: "Insight", icon: "🤖" },
  { id: "intervensi", label: "Intervensi", icon: "🛟" },
] as const;

type ActiveView = "home" | "siswa" | "insight" | "intervensi" | "mapel" | "profil";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [formState, setFormState] = useState({
    studentId: "",
    title: "",
    description: "",
    status: "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Subject & Module management states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectClassId, setNewSubjectClassId] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);

  const [activeSubjectIdForModule, setActiveSubjectIdForModule] = useState<number | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleContent, setNewModuleContent] = useState("");
  const [newModuleVideoUrl, setNewModuleVideoUrl] = useState("");
  const [newQuizTitle, setNewQuizTitle] = useState("");
  
  const [q1Question, setQ1Question] = useState("");
  const [q1Options, setQ1Options] = useState(["", "", "", ""]);
  const [q1CorrectIndex, setQ1CorrectIndex] = useState(0);

  const [q2Question, setQ2Question] = useState("");
  const [q2Options, setQ2Options] = useState(["", "", "", ""]);
  const [q2CorrectIndex, setQ2CorrectIndex] = useState(0);

  // BK Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [activeChatStudentId, setActiveChatStudentId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/teacher/subjects");
      const json = await res.json();
      if (json.success) {
        setSubjects(json.subjects);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const json = await res.json();
      if (json.success) {
        setClassesList(json.classes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatMessages = async (studentId: number) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/chat?studentId=${studentId}`);
      const json = await res.json();
      if (json.success) {
        setChatMessages(json.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (activeView === "mapel") {
      fetchSubjects();
      fetchClasses();
      fetchBadges();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "intervensi" && activeChatStudentId) {
      fetchChatMessages(activeChatStudentId);
    }
  }, [activeChatStudentId, activeView]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectClassId) return;

    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          classId: newSubjectClassId
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewSubjectName("");
        setNewSubjectClassId("");
        setShowAddSubject(false);
        fetchSubjects();
      } else {
        alert(json.message || "Gagal membuat mata pelajaran.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !newModuleContent.trim() || !activeSubjectIdForModule) return;

    const questionsPayload = [];
    if (newQuizTitle.trim()) {
      if (q1Question.trim()) {
        questionsPayload.push({
          question: q1Question.trim(),
          options: q1Options.map((opt, idx) => ({
            optionText: opt.trim() || `Pilihan ${idx + 1}`,
            isCorrect: idx === q1CorrectIndex
          }))
        });
      }
      if (q2Question.trim()) {
        questionsPayload.push({
          question: q2Question.trim(),
          options: q2Options.map((opt, idx) => ({
            optionText: opt.trim() || `Pilihan ${idx + 1}`,
            isCorrect: idx === q2CorrectIndex
          }))
        });
      }
    }

    try {
      const res = await fetch("/api/teacher/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: activeSubjectIdForModule,
          title: newModuleTitle.trim(),
          content: newModuleContent.trim(),
          videoUrl: newModuleVideoUrl.trim() || null,
          quizTitle: newQuizTitle.trim() || null,
          questions: questionsPayload
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewModuleTitle("");
        setNewModuleContent("");
        setNewModuleVideoUrl("");
        setNewQuizTitle("");
        setQ1Question("");
        setQ1Options(["", "", "", ""]);
        setQ1CorrectIndex(0);
        setQ2Question("");
        setQ2Options(["", "", "", ""]);
        setQ2CorrectIndex(0);
        setActiveSubjectIdForModule(null);
        fetchSubjects();
      } else {
        alert(json.message || "Gagal membuat modul.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      localStorage.removeItem("user");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatStudentId) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          studentId: activeChatStudentId
        })
      });
      const json = await res.json();
      if (json.success) {
        setChatInput("");
        fetchChatMessages(activeChatStudentId);
        
        // Also refresh dashboard data to update the active interventions log list!
        const dashboardRes = await fetch("/api/teacher/dashboard");
        const dashboardJson = await dashboardRes.json();
        if (dashboardJson.success) {
          setData(dashboardJson);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Badge CRUD states
  const [badgesList, setBadgesList] = useState<any[]>([]);
  const [modulesListForBadges, setModulesListForBadges] = useState<any[]>([]);
  const [editingBadgeId, setEditingBadgeId] = useState<number | null>(null);
  const [badgeName, setBadgeName] = useState("");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [badgeImage, setBadgeImage] = useState("🏆");
  const [badgeModuleId, setBadgeModuleId] = useState("");
  const [showBadgeForm, setShowBadgeForm] = useState(false);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/teacher/badges");
      const json = await res.json();
      if (json.success) {
        setBadgesList(json.badges || []);
        setModulesListForBadges(json.modules || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeName.trim() || !badgeModuleId) return;

    const method = editingBadgeId ? "PUT" : "POST";
    const body = {
      id: editingBadgeId,
      name: badgeName.trim(),
      description: badgeDesc.trim(),
      image_url: badgeImage.trim(),
      module_id: parseInt(badgeModuleId)
    };

    try {
      const res = await fetch("/api/teacher/badges", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setBadgeName("");
        setBadgeDesc("");
        setBadgeImage("🏆");
        setBadgeModuleId("");
        setEditingBadgeId(null);
        setShowBadgeForm(false);
        fetchBadges();
      } else {
        alert(json.message || "Gagal menyimpan lencana.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBadge = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lencana ini?")) return;

    try {
      const res = await fetch(`/api/teacher/badges?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        fetchBadges();
      } else {
        alert(json.message || "Gagal menghapus lencana.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/teacher/dashboard");
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat dashboard guru.");
        }

        setData(json);
        setSelectedStudentId(json.students?.[0]?.id ?? null);
        setFormState((prev) => ({
          ...prev,
          studentId: json.students?.[0]?.id?.toString() ?? "",
        }));
      } catch (err: any) {
        setError(err.message || "Koneksi ke server gagal.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedStudent = useMemo(() => {
    if (!data?.students) return null;
    return (
      data.students.find((student) => student.id === selectedStudentId) ??
      data.students[0] ??
      null
    );
  }, [data, selectedStudentId]);

  const mentalHealthProgress = data
    ? data.classSummary.averageMentalHealthProgress
    : 0;
  const mentalHealthStatus = data
    ? data.classSummary.averageMentalHealthProgress >= 75
      ? "Progress baik"
      : data.classSummary.averageMentalHealthProgress >= 50
        ? "Dalam proses"
        : "Butuh dorongan"
    : "Menunggu data";
  const lowMoodPercentage = data ? data.classSummary.lowMoodPercentage : 0;
  const lowMoodCount = data ? data.classSummary.lowMoodCount : 0;

  const handleCreateIntervention = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (
      !data ||
      !formState.studentId ||
      !formState.title.trim() ||
      !formState.description.trim()
    ) {
      setFormMessage(
        "Pilih siswa, isi judul, dan uraian tindakan terlebih dahulu.",
      );
      return;
    }

    setSubmitting(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/teacher/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(formState.studentId),
          title: formState.title.trim(),
          description: formState.description.trim(),
          status: formState.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan intervensi.");
      }

      setData((current) =>
        current
          ? {
              ...current,
              interventions: [json.intervention, ...current.interventions],
            }
          : current,
      );
      setFormState((prev) => ({
        ...prev,
        title: "",
        description: "",
        status: "active",
      }));
      setFormMessage(
        "Intervensi berhasil disimpan dan tercatat untuk penanganan siswa.",
      );
    } catch (err: any) {
      setFormMessage(err.message || "Gagal menyimpan intervensi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] text-white">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-zinc-400">Memuat dashboard guru...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] p-6 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center">
          <p className="text-xl font-bold">Gagal memuat data</p>
          <p className="mt-2 text-sm text-zinc-400">
            {error || "Data tidak tersedia."}
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03000a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[420px] w-[420px] rounded-full bg-violet-900/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>
      <header className="z-10 w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            D
          </div>
          <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 uppercase text-xs">
            DigiMind
          </span>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.3em] text-violet-300">
                Dashboard Guru
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-zinc-100">
                Pantau kelas, risiko, dan intervensi siswa
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                {data.teacher.name} • {data.teacher.specialization} •{" "}
                {data.teacher.position}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <div className="font-semibold">Kelas Aktif</div>
              <div className="text-xs text-emerald-200/80">
                {data.classSummary.classes.join(", ")} •{" "}
                {data.classSummary.totalStudents} siswa
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="w-full xl:w-72 shrink-0">
            <div className="sticky top-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
              <div className="border-b border-white/5 px-2 pb-3">
                <p className="text-2xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Menu
                </p>
                <h2 className="text-sm font-semibold text-zinc-100">Guru</h2>
              </div>
              <div className="mt-3 space-y-2">
                {(data?.teacher?.type === "bk"
                  ? [
                      { id: "home", label: "Home", icon: "🏠" },
                      { id: "siswa", label: "Siswa", icon: "👩‍🏫" },
                      { id: "insight", label: "Insight", icon: "🤖" },
                      { id: "intervensi", label: "Intervensi Chat", icon: "💬" },
                      { id: "profil", label: "Profil & Logout", icon: "👤" },
                    ]
                  : [
                      { id: "home", label: "Home", icon: "🏠" },
                      { id: "siswa", label: "Siswa", icon: "👩‍🏫" },
                      { id: "insight", label: "Insight", icon: "🤖" },
                      { id: "mapel", label: "Mata Pelajaran & Modul", icon: "📚" },
                      { id: "profil", label: "Profil & Logout", icon: "👤" },
                    ]
                ).map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveView(item.id as any);
                        if (item.id === "intervensi" && data?.students?.[0]?.id) {
                          setActiveChatStudentId(data.students[0].id);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                        isActive
                          ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-6">
            {activeView === "profil" && (
              <section className="mx-auto max-w-2xl animate-fadeIn">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-3xl shadow-lg shadow-violet-500/20">
                      👤
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-100">{data?.teacher?.name}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {data?.teacher?.type === "bk" ? "Guru Bimbingan Konseling (BK)" : "Guru Mata Pelajaran"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <span className="block text-3xs font-bold uppercase tracking-wider text-zinc-500">NIP / NUPTK</span>
                        <span className="mt-1 block font-semibold text-zinc-200">{data?.teacher?.nip}</span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <span className="block text-3xs font-bold uppercase tracking-wider text-zinc-500">Keahlian / Spesialisasi</span>
                        <span className="mt-1 block font-semibold text-zinc-200">{data?.teacher?.specialization || "-"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <span className="block text-3xs font-bold uppercase tracking-wider text-zinc-500">Jabatan</span>
                        <span className="mt-1 block font-semibold text-zinc-200">{data?.teacher?.position || "-"}</span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <span className="block text-3xs font-bold uppercase tracking-wider text-zinc-500">Status Akun</span>
                        <span className="mt-1 block text-xs font-semibold text-emerald-400">Aktif & Terverifikasi</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6 flex justify-end">
                    <button
                      onClick={handleLogout}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-rose-950/20 active:scale-95"
                    >
                      Keluar dari Akun
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeView === "home" && (
              <>
                <section className="grid gap-4 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl w-full border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Rata-rata Progres Literasi Digital
                        </p>
                        <p className="mt-2 text-2xl font-bold text-violet-300">
                          {data.classSummary.averageLiteracyProgress}%
                        </p>
                        <p className="mt-1 text-3xs text-zinc-400">
                          Pencapaian modul literasi digital
                        </p>
                      </div>

                      <div className="rounded-2xl w-full border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Rata-rata Progres Mental Health
                        </p>
                        <p className="mt-2 text-2xl font-bold text-emerald-300">
                          {data.classSummary.averageMentalHealthProgress}%
                        </p>
                        <p className="mt-1 text-3xs text-zinc-400">
                          Pencapaian modul kesehatan mental
                        </p>
                      </div>

                      <div className="rounded-2xl w-full border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Rata-rata Progres Mata Pelajaran
                        </p>
                        <p className="mt-2 text-2xl font-bold text-cyan-300">
                          {data.classSummary.averageSubjectProgress}%
                        </p>
                        <p className="mt-1 text-3xs text-zinc-400">
                          Pencapaian modul mata pelajaran
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                              Mood Siswa Minggu Ini
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                              Persentase siswa dengan mood rendah
                            </h2>
                          </div>
                          <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-2xs font-semibold text-amber-200">
                            {lowMoodCount} dari{" "}
                            {data.classSummary.totalStudents} siswa
                          </div>
                        </div>

                        <div className="mt-5 grid gap-5 md:grid-cols-[0.8fr_1fr] md:items-center">
                          <div className="flex items-center justify-center">
                            <div
                              className="relative flex h-28 w-28 items-center justify-center rounded-full"
                              style={{
                                background: `conic-gradient(#fb7185 ${lowMoodPercentage}%, rgba(255,255,255,0.12) 0)`,
                              }}
                            >
                              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#03000a] text-center">
                                <div>
                                  <div className="text-xl font-bold text-rose-300">
                                    {lowMoodPercentage}%
                                  </div>
                                  <div className="text-3xs uppercase tracking-wider text-zinc-500">
                                    Rendah
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">
                                  Mood rendah
                                </span>
                                <span className="font-semibold text-rose-300">
                                  {lowMoodPercentage}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-rose-400"
                                  style={{ width: `${lowMoodPercentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">
                                  Mood stabil
                                </span>
                                <span className="font-semibold text-emerald-300">
                                  {100 - lowMoodPercentage}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-emerald-400"
                                  style={{
                                    width: `${100 - lowMoodPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400">
                              Diagram ini memberi gambaran cepat tentang
                              seberapa banyak siswa yang sedang berada di
                              kondisi mood rendah berdasarkan jurnal terbaru.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-rose-300">
                              Alert Risiko
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                              Peringatan siswa yang butuh perhatian
                            </h2>
                          </div>
                          <span className="rounded-full border border-rose-300/20 bg-rose-400/15 px-3 py-1 text-2xs font-semibold text-rose-200">
                            {data.alerts.length} aktif
                          </span>
                        </div>
                        <div className="mt-4 space-y-2">
                          {data.alerts.length > 0 ? (
                            data.alerts.map((student) => (
                              <div
                                key={student.id}
                                className="rounded-xl border border-white/5 bg-black/10 p-3 text-sm text-zinc-200"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold">
                                    {student.name}
                                  </span>
                                  <span className="text-2xs uppercase tracking-wider text-rose-300">
                                    {student.mentalStatus}
                                  </span>
                                </div>
                                <p className="mt-1 text-3xs text-zinc-400">
                                  {student.riskReason}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-zinc-400">
                              Tidak ada siswa dengan alert risiko saat ini.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* <section className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl lg:col-span-2">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                      Ringkasan Kelas
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                      Pusat kendali untuk memantau kondisi belajar siswa
                    </h2>
                    <p className="mt-3 text-sm text-zinc-400">
                      Pilih menu lain di sidebar untuk melihat data siswa,
                      insight AI, dan daftar intervensi secara terpisah.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                      Privasi
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      {data.privacyNotice}
                    </p>
                  </div>
                </section> */}
              </>
            )}

            {activeView === "siswa" && (
              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                          Monitoring Siswa
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                          Daftar siswa di kelas Anda
                        </h2>
                      </div>
                      <span className="text-3xs uppercase tracking-wider text-zinc-500">
                        Akses terbatas per kelas
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                        <thead className="bg-white/[0.03] text-zinc-400">
                          <tr>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Siswa
                            </th>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Progres LD
                            </th>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Progres KM
                            </th>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Progres Mapel
                            </th>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Mood
                            </th>
                            <th className="px-3 py-3 text-3xs font-semibold uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-black/10">
                          {data.students.map((student) => (
                            <tr
                              key={student.id}
                              className="hover:bg-white/[0.03]"
                            >
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedStudentId(student.id)
                                  }
                                  className="text-left"
                                >
                                  <div className="font-semibold text-zinc-100">
                                    {student.name}
                                  </div>
                                  <div className="text-3xs text-zinc-500">
                                    {student.className}
                                  </div>
                                </button>
                              </td>
                              <td className="px-3 py-3 text-zinc-300">
                                {student.literacyProgress}%
                              </td>
                              <td className="px-3 py-3 text-zinc-300">
                                {student.mentalHealthProgress}%
                              </td>
                              <td className="px-3 py-3 text-zinc-300">
                                {student.subjectProgress}%
                              </td>
                              <td className="px-3 py-3 text-zinc-300">
                                {student.moodScore}/5
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${student.riskFlag ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}
                                >
                                  {student.riskFlag
                                    ? "Perlu Tindak Lanjut"
                                    : "Stabil"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                        Detail Siswa Terpilih
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                        Ringkasan aman untuk guru
                      </h2>
                    </div>
                  </div>

                  {selectedStudent && (
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Nama
                        </p>
                        <p className="mt-1 font-semibold text-zinc-100">
                          {selectedStudent.name}
                        </p>
                        <p className="mt-1 text-3xs text-zinc-500">
                          Kelas {selectedStudent.className}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Ringkasan Kesehatan Mental
                        </p>
                        <p className="mt-1 font-semibold text-zinc-100">
                          {selectedStudent.mentalStatus}
                        </p>
                        <p className="mt-1 text-3xs text-zinc-500">
                          Mood {selectedStudent.moodScore}/5 • Screen time{" "}
                          {selectedStudent.screenTime} jam
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Progres Modul Belajar
                        </p>
                        <div className="mt-2 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-zinc-300">
                            <span>Literasi Digital:</span>
                            <span className="font-semibold text-violet-300">{selectedStudent.literacyProgress}%</span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-300">
                            <span>Kesehatan Mental:</span>
                            <span className="font-semibold text-emerald-300">{selectedStudent.mentalHealthProgress}%</span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-300">
                            <span>Mata Pelajaran:</span>
                            <span className="font-semibold text-cyan-300">{selectedStudent.subjectProgress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <p className="text-3xs uppercase tracking-wider text-zinc-500">
                          Kebijakan Privasi
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {data.privacyNotice}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeView === "insight" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                  Insight AI
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                  Rekomendasi berbasis pola kelas
                </h2>
                <div className="mt-4 space-y-3">
                  {data.aiInsights.map((insight) => (
                    <div
                      key={insight}
                      className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-zinc-300"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeView === "intervensi" && (
              <section className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                        Intervensi
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                        Alur penanganan guru dan konselor untuk siswa yang
                        membutuhkan dukungan
                      </h2>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Sistem akan memicu intervensi berdasarkan alert risiko,
                    insight AI, dan tren jurnal siswa. Guru dapat mencatat
                    tindak lanjut, memperbarui status, serta menandai kebutuhan
                    verifikasi proyek akhir.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-rose-300">
                      Pemicu Intervensi
                    </p>
                    <div className="mt-4 space-y-3">
                      {data.alerts.length > 0 ? (
                        data.alerts.map((student) => (
                          <div
                            key={student.id}
                            className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-zinc-100">
                                {student.name}
                              </span>
                              <span className="text-2xs uppercase tracking-wider text-rose-200">
                                {student.mentalStatus}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-zinc-300">
                              {student.riskReason}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400">
                          Tidak ada siswa dengan alert risiko saat ini.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
                      <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Insight AI
                      </p>
                      <div className="mt-3 space-y-2">
                        {data.aiInsights.map((insight) => (
                          <div key={insight} className="text-sm text-zinc-300">
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                      Intervensi BK (Chat Interaktif)
                    </p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-3xs font-semibold uppercase tracking-wider text-zinc-500">
                          Pilih Siswa untuk Chat
                        </label>
                        <select
                          value={activeChatStudentId || ""}
                          onChange={(event) =>
                            setActiveChatStudentId(event.target.value ? parseInt(event.target.value) : null)
                          }
                          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
                        >
                          <option value="">-- Pilih Siswa --</option>
                          {data.students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} • {student.className}
                            </option>
                          ))}
                        </select>
                      </div>

                      {activeChatStudentId ? (
                        <div className="mt-4 flex flex-col h-[350px] border border-white/10 rounded-xl overflow-hidden bg-black/20">
                          {/* Chat messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingChat ? (
                              <div className="text-center text-xs text-zinc-400 mt-10">Memuat pesan...</div>
                            ) : chatMessages.length === 0 ? (
                              <div className="text-center text-xs text-zinc-500 mt-10">Belum ada chat intervensi. Kirim pesan ke siswa untuk memulai bimbingan.</div>
                            ) : (
                              chatMessages.map((msg) => {
                                const isSelf = msg.sender === "teacher";
                                return (
                                  <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                                    <span className="text-3xs text-zinc-500 mb-1">{isSelf ? "Anda" : "Siswa"}</span>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isSelf ? "bg-violet-600 text-white rounded-tr-none" : "bg-white/10 text-zinc-200 rounded-tl-none"}`}>
                                      {msg.message}
                                    </div>
                                    <span className="text-[9px] text-zinc-600 mt-1">{new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          
                          {/* Input bar */}
                          <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-zinc-950/50 flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ketik pesan intervensi..."
                              className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition">
                              Kirim
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center justify-center h-[350px] border border-white/10 rounded-xl bg-black/10 text-xs text-zinc-500 italic">
                          Pilih siswa di atas untuk memulai konsultasi chat
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                      Riwayat Intervensi
                    </p>
                    <div className="mt-4 space-y-3">
                      {data.interventions.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-white/10 bg-black/10 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-zinc-100">
                              {item.studentName}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${item.status === "Aktif" ? "bg-amber-500/10 text-amber-300" : item.status === "Selesai" ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-500/10 text-slate-300"}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-zinc-300">
                            {item.note}
                          </p>
                          <p className="mt-2 text-3xs uppercase tracking-wider text-zinc-500">
                            Diperbarui {item.updatedAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                      Verifikasi Proyek Akhir
                    </p>
                    <div className="mt-4 space-y-3">
                      {data.students
                        .filter((student) => student.literacyProgress >= 80)
                        .slice(0, 3)
                        .map((student) => (
                          <div
                            key={student.id}
                            className="rounded-xl border border-white/10 bg-black/10 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-zinc-100">
                                {student.name}
                              </span>
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-semibold text-emerald-300">
                                Siap verifikasi
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-zinc-300">
                              Progres modul {student.literacyProgress}% •
                              Menunggu approval proyek akhir sebelum badge
                              diberikan.
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeView === "mapel" && (
              <section className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        Mata Pelajaran
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                        Kelola Mata Pelajaran, Modul Pembelajaran, & Postest Kuis Anda
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddSubject(!showAddSubject)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition"
                    >
                      {showAddSubject ? "Batal" : "Tambah Mapel Baru"}
                    </button>
                  </div>
                </div>

                {/* Add Subject Form */}
                {showAddSubject && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                    <h3 className="text-base font-bold text-zinc-100 mb-4">Tambah Mata Pelajaran Baru</h3>
                    <form onSubmit={handleAddSubject} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Nama Mata Pelajaran
                        </label>
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Contoh: Matematika, Fisika, Kimia"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Kelas
                        </label>
                        <select
                          value={newSubjectClassId}
                          onChange={(e) => setNewSubjectClassId(e.target.value)}
                          required
                          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {classesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.major})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition"
                      >
                        Simpan Mapel
                      </button>
                    </form>
                  </div>
                )}

                {/* Subject List & Modules */}
                <div className="grid gap-6">
                  {subjects.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                      Belum ada mata pelajaran yang Anda ampu. Silakan tambahkan mata pelajaran baru untuk memulai.
                    </div>
                  ) : (
                    subjects.map((sub) => (
                      <div key={sub.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-semibold text-emerald-300">
                              {sub.class.name} • {sub.class.major}
                            </span>
                            <h3 className="text-lg font-bold text-zinc-100 mt-2">{sub.name}</h3>
                          </div>
                          <button
                            onClick={() => setActiveSubjectIdForModule(sub.id)}
                            className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition"
                          >
                            Tambah Modul
                          </button>
                        </div>

                        {/* Modules list */}
                        <div className="mt-4 space-y-3">
                          <p className="text-xs font-semibold text-zinc-400">Daftar Modul Pelajaran:</p>
                          {sub.modules.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">Belum ada modul di mata pelajaran ini.</p>
                          ) : (
                            sub.modules.map((mod: any) => (
                              <div key={mod.id} className="rounded-xl border border-white/5 bg-black/20 p-3 flex justify-between items-center">
                                <div>
                                  <h4 className="font-semibold text-sm text-zinc-200">{mod.title}</h4>
                                  <p className="text-xs text-zinc-500 mt-1 max-w-[500px] truncate">{mod.content}</p>
                                </div>
                                {mod.quizzes && mod.quizzes.length > 0 && (
                                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-3xs font-semibold text-cyan-300 uppercase">
                                    📝 Postest Aktif
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Module Modal/Form Inline */}
                        {activeSubjectIdForModule === sub.id && (
                          <div className="mt-6 border-t border-white/5 pt-5 space-y-4">
                            <h4 className="font-bold text-zinc-200">Tambah Modul & Postest Baru</h4>
                            <form onSubmit={handleAddModule} className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Judul Modul</label>
                                  <input
                                    type="text"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    placeholder="Contoh: Pengenalan Aljabar"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">URL Video (Opsional)</label>
                                  <input
                                    type="text"
                                    value={newModuleVideoUrl}
                                    onChange={(e) => setNewModuleVideoUrl(e.target.value)}
                                    placeholder="Contoh: https://youtube.com/..."
                                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Materi Modul</label>
                                <textarea
                                  value={newModuleContent}
                                  onChange={(e) => setNewModuleContent(e.target.value)}
                                  placeholder="Tuliskan materi pelajaran secara mendalam di sini..."
                                  rows={5}
                                  required
                                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                />
                              </div>

                              {/* Quiz Creation Fields */}
                              <div className="border border-white/5 rounded-xl p-4 bg-zinc-950/20 space-y-4">
                                <h5 className="font-bold text-zinc-300 text-sm">Buat Kuis Postest Pelajaran (Opsional)</h5>
                                <div>
                                  <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Judul Kuis</label>
                                  <input
                                    type="text"
                                    value={newQuizTitle}
                                    onChange={(e) => setNewQuizTitle(e.target.value)}
                                    placeholder="Contoh: Kuis Postest Aljabar Kelas 9"
                                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                  />
                                </div>

                                {newQuizTitle.trim() && (
                                  <div className="space-y-6 pt-2">
                                    {/* Question 1 */}
                                    <div className="space-y-2 border-t border-white/5 pt-4">
                                      <p className="font-semibold text-xs text-zinc-300">Pertanyaan 1:</p>
                                      <input
                                        type="text"
                                        value={q1Question}
                                        onChange={(e) => setQ1Question(e.target.value)}
                                        placeholder="Tulis pertanyaan pertama..."
                                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                      />
                                      <div className="grid gap-2 sm:grid-cols-2 mt-2">
                                        {q1Options.map((opt, idx) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <input
                                              type="radio"
                                              name="q1Correct"
                                              checked={q1CorrectIndex === idx}
                                              onChange={() => setQ1CorrectIndex(idx)}
                                              className="accent-violet-500"
                                            />
                                            <input
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                const updated = [...q1Options];
                                                updated[idx] = e.target.value;
                                                setQ1Options(updated);
                                              }}
                                              placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                              className="flex-1 rounded-lg border border-white/10 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-100 outline-none"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Question 2 */}
                                    <div className="space-y-2 border-t border-white/5 pt-4">
                                      <p className="font-semibold text-xs text-zinc-300">Pertanyaan 2:</p>
                                      <input
                                        type="text"
                                        value={q2Question}
                                        onChange={(e) => setQ2Question(e.target.value)}
                                        placeholder="Tulis pertanyaan kedua..."
                                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                                      />
                                      <div className="grid gap-2 sm:grid-cols-2 mt-2">
                                        {q2Options.map((opt, idx) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <input
                                              type="radio"
                                              name="q2Correct"
                                              checked={q2CorrectIndex === idx}
                                              onChange={() => setQ2CorrectIndex(idx)}
                                              className="accent-violet-500"
                                            />
                                            <input
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                const updated = [...q2Options];
                                                updated[idx] = e.target.value;
                                                setQ2Options(updated);
                                              }}
                                              placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                              className="flex-1 rounded-lg border border-white/10 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-100 outline-none"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition"
                                >
                                  Simpan Modul
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveSubjectIdForModule(null)}
                                  className="rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition"
                                >
                                  Batal
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* ==================== BADGE CRUD MANAGEMENT ==================== */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl mt-8 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
                     <div>
                       <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                         Lencana Mata Pelajaran (Badges)
                       </p>
                       <h3 className="text-lg font-bold text-zinc-100 mt-1">Kelola Lencana Kelulusan Modul</h3>
                     </div>
                     <button
                       onClick={() => {
                         setEditingBadgeId(null);
                         setBadgeName("");
                         setBadgeDesc("");
                         setBadgeImage("🏆");
                         setBadgeModuleId("");
                         setShowBadgeForm(!showBadgeForm);
                       }}
                       className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition self-start"
                     >
                       {showBadgeForm ? "Batal" : "Buat Lencana Baru"}
                     </button>
                   </div>

                   {showBadgeForm && (
                     <form onSubmit={handleSaveBadge} className="space-y-4 mb-6 border-b border-white/5 pb-6">
                       <h4 className="font-bold text-sm text-zinc-200">{editingBadgeId ? "Edit Lencana" : "Tambah Lencana Baru"}</h4>
                       <div className="grid gap-4 sm:grid-cols-2">
                         <div>
                           <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Nama Lencana</label>
                           <input
                             type="text"
                             value={badgeName}
                             onChange={(e) => setBadgeName(e.target.value)}
                             placeholder="Contoh: Pakar Aljabar"
                             required
                             className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                           />
                         </div>
                         <div>
                           <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Target Modul Kelulusan</label>
                           <select
                             value={badgeModuleId}
                             onChange={(e) => setBadgeModuleId(e.target.value)}
                             required
                             className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                           >
                             <option value="">-- Pilih Modul Pelajaran --</option>
                             {modulesListForBadges.map((mod) => (
                               <option key={mod.id} value={mod.id}>
                                 [{mod.subject.name}] {mod.title}
                               </option>
                             ))}
                           </select>
                         </div>
                       </div>

                       <div className="grid gap-4 sm:grid-cols-2">
                         <div>
                           <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Deskripsi Lencana</label>
                           <input
                             type="text"
                             value={badgeDesc}
                             onChange={(e) => setBadgeDesc(e.target.value)}
                             placeholder="Contoh: Diberikan setelah menyelesaikan kuis postest Aljabar"
                             className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                           />
                         </div>
                         <div>
                           <label className="mb-1 block text-2xs uppercase tracking-wider text-zinc-500">Ikon Lencana (Emoji / URL)</label>
                           <input
                             type="text"
                             value={badgeImage}
                             onChange={(e) => setBadgeImage(e.target.value)}
                             placeholder="Contoh: 🏆 atau emoji lainnya"
                             className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                           />
                         </div>
                       </div>

                       <button
                         type="submit"
                         className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition"
                       >
                         {editingBadgeId ? "Simpan Perubahan" : "Simpan Lencana"}
                       </button>
                     </form>
                   )}

                   <div className="grid gap-4 sm:grid-cols-2">
                     {badgesList.length === 0 ? (
                       <p className="text-sm text-zinc-500 italic col-span-2 text-center py-6">Belum ada lencana mata pelajaran yang dibuat.</p>
                     ) : (
                       badgesList.map((badge) => (
                         <div key={badge.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <span className="text-3xl">{badge.image_url || "🏆"}</span>
                             <div>
                               <h5 className="font-bold text-sm text-zinc-200">{badge.name}</h5>
                               <p className="text-xs text-zinc-400 mt-0.5">{badge.description}</p>
                               <p className="text-[10px] text-zinc-500 mt-1">Modul: <strong className="text-zinc-400">{badge.module?.title}</strong></p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <button
                               onClick={() => {
                                 setEditingBadgeId(badge.id);
                                 setBadgeName(badge.name);
                                 setBadgeDesc(badge.description || "");
                                 setBadgeImage(badge.image_url || "🏆");
                                 setBadgeModuleId(badge.module_id?.toString() || "");
                                 setShowBadgeForm(true);
                               }}
                               className="rounded-lg bg-white/5 hover:bg-white/10 p-2 text-xs font-semibold text-zinc-300 transition"
                             >
                               ✏️
                             </button>
                             <button
                               onClick={() => handleDeleteBadge(badge.id)}
                               className="rounded-lg bg-red-500/10 hover:bg-red-500/20 p-2 text-xs font-semibold text-red-400 transition"
                             >
                               🗑️
                             </button>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
