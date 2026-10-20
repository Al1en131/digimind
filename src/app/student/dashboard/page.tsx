"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import StudentModuleDetailView from "@/components/StudentModuleDetailView";
import { 
  Home, 
  ClipboardList, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Award, 
  User, 
  Bell, 
  FolderOpen, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  LogOut,
  Upload,
  ArrowRight,
  GraduationCap,
  School,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
  PenTool,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  Key,
  Zap,
  Play,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Search,
  XCircle
} from "lucide-react";

export interface QuizAnswerDetail {
  id: number;
  question: string;
  selectedOption: string;
  isCorrect: boolean;
  correctOption: string | null;
}

export interface StudentGradeItem {
  id: number;
  quizId: number;
  moduleId?: number | null;
  title: string;
  type: "Pretest" | "Posttest";
  classId: number;
  className: string;
  classYear: string;
  academicYear: string;
  subjectId: number | null;
  subjectName: string;
  score: number;
  completedAt: string;
  answers: QuizAnswerDetail[];
}

interface SchoolClassItem {
  id: number;
  name: string;
  major: string | null;
  year?: string;
  academicYear?: string;
  displayName?: string;
  isCurrent?: boolean;
}

interface Student {
  id: number;
  name: string;
  username: string;
  email?: string;
  nis: string;
  class_id?: number;
  class_name?: string;
  class_major?: string;
  year?: string;
  academicYear?: string;
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
  category?: ModuleCategory;
  progress?: number;
}

interface Subject {
  id: number;
  name: string;
  class_id?: number;
  className?: string;
  isCurrentClass?: boolean;
  teacher?: { name: string } | null;
  pretestQuizId?: number | null;
  hasPretest: boolean;
  level: string;
  score?: number;
  modules: Module[];
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

interface MonthlyScreeningRecord {
  id: number;
  period: string;
  mental_level: string;
  recommendations: string | null;
  created_at: string;
}

interface MonthlyScreeningInfo {
  isCompletedThisMonth: boolean;
  lastCompletedAt: string | null;
  history: MonthlyScreeningRecord[];
}

interface DashboardData {
  success: boolean;
  student: Student;
  allClasses?: SchoolClassItem[];
  availableClasses?: SchoolClassItem[];
  monthlyScreening?: MonthlyScreeningInfo;
  modules: Module[];
  completedModuleIds: number[];
  moduleProgressMap?: Record<number, number>;
  subjects: Subject[];
  badges: BadgesState;
  journals: Journal[];
  leaderboard: Leaderboard;
  grades?: StudentGradeItem[];
}

// Flaticon / Modern Vector Style Colorful Mood SVGs
const MoodSvgBuruk = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#grad_buruk)" />
    <circle cx="22" cy="26" r="3.5" fill="#27272A" />
    <circle cx="42" cy="26" r="3.5" fill="#27272A" />
    <path d="M18 20C21 17 25 18 26 21" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M46 20C43 17 39 18 38 21" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 42C26 37 38 37 42 42" stroke="#27272A" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 32C44 32 41 37 41 39.5C41 41.4 42.3 43 44 43C45.7 43 47 41.4 47 39.5C47 37 44 32 44 32Z" fill="#3B82F6" />
    <defs>
      <linearGradient id="grad_buruk" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FCD34D" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

const MoodSvgCemas = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#grad_cemas)" />
    <path d="M44 14C44 14 41 18 41 20C41 21.6 42.3 23 44 23C45.7 23 47 21.6 47 20C47 18 44 14 44 14Z" fill="#60A5FA" />
    <circle cx="22" cy="28" r="4" fill="#27272A" />
    <circle cx="42" cy="28" r="4" fill="#27272A" />
    <path d="M17 21C21 23 25 24 27 24" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M47 21C43 23 39 24 37 24" stroke="#27272A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 41C25 39 28 43 32 41C36 39 39 43 42 41" stroke="#27272A" strokeWidth="3" strokeLinecap="round" />
    <defs>
      <linearGradient id="grad_cemas" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

const MoodSvgBiasa = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#grad_biasa)" />
    <circle cx="22" cy="26" r="3.5" fill="#27272A" />
    <circle cx="42" cy="26" r="3.5" fill="#27272A" />
    <line x1="22" y1="40" x2="42" y2="40" stroke="#27272A" strokeWidth="3.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="grad_biasa" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#EAB308" />
      </linearGradient>
    </defs>
  </svg>
);

const MoodSvgBaik = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#grad_baik)" />
    <circle cx="15" cy="34" r="5" fill="#F43F5E" opacity="0.3" />
    <circle cx="49" cy="34" r="5" fill="#F43F5E" opacity="0.3" />
    <circle cx="22" cy="25" r="3.5" fill="#27272A" />
    <circle cx="42" cy="25" r="3.5" fill="#27272A" />
    <path d="M20 36C20 36 24 45 32 45C40 45 44 36 44 36" stroke="#27272A" strokeWidth="3.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="grad_baik" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#EAB308" />
      </linearGradient>
    </defs>
  </svg>
);

const MoodSvgSangatBaik = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#grad_sangat_baik)" />
    <circle cx="14" cy="34" r="5.5" fill="#F43F5E" opacity="0.35" />
    <circle cx="50" cy="34" r="5.5" fill="#F43F5E" opacity="0.35" />
    <path d="M22 20L23.5 24L27.5 24.5L24.5 27L25.5 31L22 28.5L18.5 31L19.5 27L16.5 24.5L20.5 24L22 20Z" fill="#27272A" />
    <path d="M42 20L43.5 24L47.5 24.5L44.5 27L45.5 31L42 28.5L38.5 31L39.5 27L36.5 24.5L40.5 24L42 20Z" fill="#27272A" />
    <path d="M18 36C18 36 22 48 32 48C42 48 46 36 46 36H18Z" fill="#27272A" />
    <path d="M25 44C27 41 37 41 39 44C37 47 27 47 25 44Z" fill="#F43F5E" />
    <defs>
      <linearGradient id="grad_sangat_baik" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

const MOOD_EMOJIS = [
  { score: 1, char: "😢", label: "Buruk", color: "text-rose-500", icon: <MoodSvgBuruk className="w-8 h-8 drop-shadow-xs" />, smIcon: <MoodSvgBuruk className="w-6 h-6" />, lgIcon: <MoodSvgBuruk className="w-12 h-12 md:w-14 md:h-14 drop-shadow-md" /> },
  { score: 2, char: "😕", label: "Cemas", color: "text-amber-500", icon: <MoodSvgCemas className="w-8 h-8 drop-shadow-xs" />, smIcon: <MoodSvgCemas className="w-6 h-6" />, lgIcon: <MoodSvgCemas className="w-12 h-12 md:w-14 md:h-14 drop-shadow-md" /> },
  { score: 3, char: "😐", label: "Biasa", color: "text-[#5A77DF]", icon: <MoodSvgBiasa className="w-8 h-8 drop-shadow-xs" />, smIcon: <MoodSvgBiasa className="w-6 h-6" />, lgIcon: <MoodSvgBiasa className="w-12 h-12 md:w-14 md:h-14 drop-shadow-md" /> },
  { score: 4, char: "🙂", label: "Baik", color: "text-emerald-500", icon: <MoodSvgBaik className="w-8 h-8 drop-shadow-xs" />, smIcon: <MoodSvgBaik className="w-6 h-6" />, lgIcon: <MoodSvgBaik className="w-12 h-12 md:w-14 md:h-14 drop-shadow-md" /> },
  { score: 5, char: "😄", label: "Sangat Baik", color: "text-emerald-600", icon: <MoodSvgSangatBaik className="w-8 h-8 drop-shadow-xs" />, smIcon: <MoodSvgSangatBaik className="w-6 h-6" />, lgIcon: <MoodSvgSangatBaik className="w-12 h-12 md:w-14 md:h-14 drop-shadow-md" /> },
];

const stripHtmlTags = (str: string | undefined | null): string => {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const indonesianMonths = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

type DashboardTab = "home" | "screening" | "modul" | "nilai" | "jurnal" | "chat_bk" | "badge" | "profil";

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
  { id: "screening", label: "Screening Bulanan", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "modul", label: "Modul", icon: <BookOpen className="w-4 h-4" /> },
  { id: "nilai", label: "Data Nilai", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "jurnal", label: "Jurnal", icon: <FileText className="w-4 h-4" /> },
  { id: "chat_bk", label: "Chat BK", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "badge", label: "Badge", icon: <Award className="w-4 h-4" /> },
  { id: "profil", label: "Profil", icon: <User className="w-4 h-4" /> },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [selectedModulClassId, setSelectedModulClassId] = useState<number | null>(null);
  const [selectedModulSubjectId, setSelectedModulSubjectId] = useState<number | "ALL">("ALL");
  const [isModulSubmenuOpen, setIsModulSubmenuOpen] = useState<boolean>(true);

  // States for Nilai Siswa (Student Grades)
  const [selectedGradeClassId, setSelectedGradeClassId] = useState<number | null>(null);
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState<string>("ALL");
  const [gradeSearchQuery, setGradeSearchQuery] = useState<string>("");
  const [isNilaiSubmenuOpen, setIsNilaiSubmenuOpen] = useState<boolean>(true);
  const [selectedStudentGradeDetail, setSelectedStudentGradeDetail] = useState<StudentGradeItem | null>(null);
  const [showStudentAnswersModal, setShowStudentAnswersModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modParam = params.get("module");
      if (modParam && !isNaN(parseInt(modParam))) {
        setActiveModuleId(parseInt(modParam));
      } else {
        const tabParam = params.get("tab");
        if (tabParam && NAV_ITEMS.some((item) => item.id === tabParam)) {
          setActiveTab(tabParam as DashboardTab);
        }
      }
    }
  }, []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Journal form state
  const [moodScore, setMoodScore] = useState<number>(3);
  const [journalNotes, setJournalNotes] = useState("");
  const [journalActivities, setJournalActivities] = useState("");
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [journalMessage, setJournalMessage] = useState<string | null>(null);

  // Calendar and popup modal states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showFillModal, setShowFillModal] = useState(false);
  const [selectedFillDate, setSelectedFillDate] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailJournal, setSelectedDetailJournal] = useState<any>(null);

  // Monthly SRQ Screening states
  const [showMonthlySrqModal, setShowMonthlySrqModal] = useState(false);
  const [monthlySrqQuiz, setMonthlySrqQuiz] = useState<any | null>(null);
  const [monthlySrqAnswers, setMonthlySrqAnswers] = useState<Record<number, number>>({});
  const [monthlySrqIndex, setMonthlySrqIndex] = useState(0);
  const [loadingMonthlySrq, setLoadingMonthlySrq] = useState(false);
  const [submittingMonthlySrq, setSubmittingMonthlySrq] = useState(false);
  const [monthlySrqResult, setMonthlySrqResult] = useState<any | null>(null);

  // Subject Pretest Modal states
  const [showSubjectPretestModal, setShowSubjectPretestModal] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [subjectQuiz, setSubjectQuiz] = useState<any | null>(null);
  const [subjectAnswers, setSubjectAnswers] = useState<Record<number, number>>({});
  const [subjectPretestIndex, setSubjectPretestIndex] = useState(0);
  const [loadingSubjectQuiz, setLoadingSubjectQuiz] = useState(false);
  const [submittingSubjectPretest, setSubmittingSubjectPretest] = useState(false);
  const [subjectPretestResult, setSubjectPretestResult] = useState<any | null>(null);

  // Change Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showProfileNewPass, setShowProfileNewPass] = useState(false);
  const [showProfileConfirmPass, setShowProfileConfirmPass] = useState(false);

  // Chat BK states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [bkTeachers, setBkTeachers] = useState<any[]>([]);
  const [activeTeacherId, setActiveTeacherId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

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

  const handleOpenEditProfile = () => {
    if (!data?.student) return;
    setEditName(data.student.name);
    setEditUsername(data.student.username);
    setEditAvatar(data.student.avatar || "");
    setEditClassId(data.student.class_id ? String(data.student.class_id) : "");
    setNewPassword("");
    setConfirmPassword("");
    setShowProfileNewPass(false);
    setShowProfileConfirmPass(false);
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
    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileMessage("Gagal: Password baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileMessage("Gagal: Konfirmasi password baru tidak cocok.");
        return;
      }
    }
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
          class_id: editClassId || undefined,
          password: newPassword || undefined
        }),
      });

      const json = await res.json();
      if (json.success) {
        setProfileMessage("Profil berhasil diperbarui!");
        setNewPassword("");
        setConfirmPassword("");
        fetchDashboardData();
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
        if (json.student?.class_id) {
          setSelectedModulClassId(prev => {
            if (prev && json.availableClasses?.some((c: any) => c.id === prev)) {
              return prev;
            }
            return json.student.class_id;
          });
          setSelectedGradeClassId(prev => {
            if (prev && json.availableClasses?.some((c: any) => c.id === prev)) {
              return prev;
            }
            return json.student.class_id;
          });
        }
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

  // Handle Monthly SRQ Screening modal open
  const handleOpenMonthlySrqModal = async () => {
    setMonthlySrqQuiz(null);
    setMonthlySrqAnswers({});
    setMonthlySrqIndex(0);
    setMonthlySrqResult(null);
    setShowMonthlySrqModal(true);
    setLoadingMonthlySrq(true);

    try {
      const res = await fetch("/api/student/quiz/pretest");
      const json = await res.json();
      if (json.success) {
        setMonthlySrqQuiz(json.quiz);
      } else {
        alert(json.message || "Gagal memuat kuis SRQ-29.");
      }
    } catch (e) {
      alert("Gagal terhubung ke server.");
    } finally {
      setLoadingMonthlySrq(false);
    }
  };

  const handleSubmitMonthlySrq = async () => {
    if (!monthlySrqQuiz) return;
    const unanswered = monthlySrqQuiz.questions.filter((q: any) => !monthlySrqAnswers[q.id]);
    if (unanswered.length > 0) {
      alert(`Silakan jawab semua pertanyaan terlebih dahulu! Sisa ${unanswered.length} soal.`);
      return;
    }

    setSubmittingMonthlySrq(true);
    const formattedAnswers = Object.entries(monthlySrqAnswers).map(([qId, oId]) => ({
      questionId: parseInt(qId),
      optionId: oId,
    }));

    try {
      const res = await fetch("/api/student/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: monthlySrqQuiz.id,
          answers: formattedAnswers
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMonthlySrqResult(json.result);
        await fetchDashboardData();
      } else {
        alert(json.message || "Gagal mengirim jawaban screening.");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSubmittingMonthlySrq(false);
    }
  };

  // Handle Subject Pretest modal open
  const handleOpenSubjectPretest = async (subject: Subject) => {
    setActiveSubject(subject);
    setSubjectQuiz(null);
    setSubjectAnswers({});
    setSubjectPretestIndex(0);
    setSubjectPretestResult(null);
    setShowSubjectPretestModal(true);
    setLoadingSubjectQuiz(true);

    try {
      const res = await fetch(`/api/student/quiz/subject-pretest?subjectId=${subject.id}`);
      const json = await res.json();
      if (json.success) {
        setSubjectQuiz(json.quiz);
      } else {
        alert(json.message || "Gagal memuat pretest mata pelajaran.");
      }
    } catch (e) {
      alert("Gagal terhubung ke server.");
    } finally {
      setLoadingSubjectQuiz(false);
    }
  };

  const handleSubmitSubjectPretest = async () => {
    if (!subjectQuiz) return;
    const unanswered = subjectQuiz.questions.filter((q: any) => !subjectAnswers[q.id]);
    if (unanswered.length > 0) {
      alert(`Silakan jawab semua pertanyaan terlebih dahulu! Sisa ${unanswered.length} soal.`);
      return;
    }

    setSubmittingSubjectPretest(true);
    const formattedAnswers = Object.entries(subjectAnswers).map(([qId, oId]) => ({
      questionId: parseInt(qId),
      optionId: oId,
    }));

    try {
      const res = await fetch("/api/student/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: subjectQuiz.id,
          answers: formattedAnswers
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubjectPretestResult(json.result);
        await fetchDashboardData();
      } else {
        alert(json.message || "Gagal mengirim jawaban pretest.");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSubmittingSubjectPretest(false);
    }
  };

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJournal(true);
    setJournalMessage(null);
    try {
      const res = await fetch("/api/student/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodScore,
          notes: journalNotes,
          activities: journalActivities,
          date: selectedFillDate
        }),
      });
      const json = await res.json();
      if (json.success) {
        setJournalNotes("");
        setJournalActivities("");
        setShowFillModal(false);
        setJournalMessage(null);
        await fetchDashboardData();
        if (json.journal) {
          setSelectedDetailJournal(json.journal);
          setShowDetailModal(true);
        }
      } else {
        setJournalMessage(`Gagal: ${json.message}`);
      }
    } catch {
      setJournalMessage("Gagal mengirim data jurnal.");
    } finally {
      setSubmittingJournal(false);
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

  // --- Student Grades Memos & Handlers ---
  const studentGrades = useMemo(() => {
    const raw = [...(data?.grades || [])];
    // Sort descending by completion date or id to guarantee latest attempt (Nilai Akhir) comes first
    raw.sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      return (b.id || 0) - (a.id || 0);
    });

    const seen = new Set<string>();
    return raw.filter((g) => {
      const key = g.type === "Pretest"
        ? `${g.classId || 0}_pretest_${g.subjectId || g.quizId}`
        : `${g.classId || 0}_posttest_${g.moduleId || g.quizId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.grades]);

  const studentAvailableClasses = useMemo(() => {
    const list = data?.availableClasses || [];
    if (list.length > 0) return list;
    if (data?.student?.class_id) {
      const yr = data.student.academicYear || data.student.year || "2025/2026";
      return [{
        id: data.student.class_id,
        name: data.student.class_name || data.student.class || "Kelas Aktif",
        major: data.student.class_major || null,
        academicYear: `TA ${yr}`,
        year: yr,
        displayName: `${data.student.class_name || data.student.class} (TA ${yr})`,
        isCurrent: true,
      }];
    }
    return [];
  }, [data?.availableClasses, data?.student]);

  const gradeClasses = studentAvailableClasses;

  const activeGradeClassId = selectedGradeClassId || (gradeClasses[0]?.id ?? data?.student?.class_id ?? null);

  const activeGradeClass = useMemo(() => {
    return gradeClasses.find((c) => c.id === activeGradeClassId) || gradeClasses[0] || null;
  }, [gradeClasses, activeGradeClassId]);

  const classGrades = useMemo(() => {
    if (!activeGradeClassId) return studentGrades;
    return studentGrades.filter((g) => g.classId === activeGradeClassId);
  }, [studentGrades, activeGradeClassId]);

  const classGradeSubjects = useMemo(() => {
    const map = new Map<string, string>();
    classGrades.forEach((g) => {
      if (g.subjectName) {
        map.set(g.subjectName, g.subjectName);
      }
    });
    return Array.from(map.values());
  }, [classGrades]);

  const subjectSummaries = useMemo(() => {
    const map = new Map<string, {
      subjectId: number | null;
      subjectName: string;
      teacherName: string;
      level: string;
      grades: StudentGradeItem[];
      avgScore: number;
      pretestCount: number;
      posttestCount: number;
    }>();

    // 1. Seed from curriculum subjects of activeGradeClassId
    const clsSubjects = (data?.subjects || []).filter((s) => s.class_id === activeGradeClassId);
    clsSubjects.forEach((sub) => {
      map.set(sub.name, {
        subjectId: sub.id,
        subjectName: sub.name,
        teacherName: sub.teacher?.name || "-",
        level: sub.level || "-",
        grades: [],
        avgScore: 0,
        pretestCount: 0,
        posttestCount: 0,
      });
    });

    // 2. Populate grades into each subject
    classGrades.forEach((g) => {
      const sName = g.subjectName || "Umum";
      let entry = map.get(sName);
      if (!entry) {
        entry = {
          subjectId: g.subjectId || null,
          subjectName: sName,
          teacherName: "-",
          level: "-",
          grades: [],
          avgScore: 0,
          pretestCount: 0,
          posttestCount: 0,
        };
        map.set(sName, entry);
      }
      entry.grades.push(g);
      if (g.type === "Pretest") entry.pretestCount++;
      else if (g.type === "Posttest") entry.posttestCount++;
    });

    // 3. Compute average score for each subject
    map.forEach((entry) => {
      if (entry.grades.length > 0) {
        const sum = entry.grades.reduce((acc, g) => acc + g.score, 0);
        entry.avgScore = Math.round(sum / entry.grades.length);
      } else {
        entry.avgScore = 0;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [data?.subjects, activeGradeClassId, classGrades]);

  const filteredSubjectSummaries = useMemo(() => {
    if (!gradeSearchQuery.trim()) return subjectSummaries;
    const q = gradeSearchQuery.toLowerCase();
    return subjectSummaries.filter((s) =>
      s.subjectName.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q)
    );
  }, [subjectSummaries, gradeSearchQuery]);

  const filteredClassGrades = useMemo(() => {
    let result = classGrades;
    if (selectedGradeSubjectId !== "ALL") {
      result = result.filter((g) => g.subjectName === selectedGradeSubjectId);
    }
    if (gradeSearchQuery.trim()) {
      const q = gradeSearchQuery.toLowerCase();
      result = result.filter((g) => {
        const titleMatch = g.title?.toLowerCase().includes(q);
        const subjMatch = g.subjectName?.toLowerCase().includes(q);
        const typeMatch = g.type?.toLowerCase().includes(q);
        return titleMatch || subjMatch || typeMatch;
      });
    }
    return result;
  }, [classGrades, selectedGradeSubjectId, gradeSearchQuery]);

  const avgGradeScore = useMemo(() => {
    if (filteredClassGrades.length === 0) return 0;
    return Math.round(
      filteredClassGrades.reduce((sum, g) => sum + g.score, 0) / filteredClassGrades.length
    );
  }, [filteredClassGrades]);

  const handleExportStudentGradesCSV = () => {
    if (!data?.student) {
      alert("Tidak ada data nilai untuk diekspor pada filter ini.");
      return;
    }
    const studentObj = data.student;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (selectedGradeSubjectId === "ALL") {
      if (subjectSummaries.length === 0) {
        alert("Tidak ada data nilai untuk diekspor pada filter ini.");
        return;
      }
      headers = [
        "No",
        "NIS",
        "Nama Siswa",
        "Kelas & TA",
        "Mata Pelajaran",
        "Guru Pengampu",
        "Jumlah Evaluasi",
        "Nilai Rata-Rata",
        "Status",
      ];
      rows = subjectSummaries.map((s, idx) => [
        idx + 1,
        `"${(studentObj.nis || "").replace(/"/g, '""')}"`,
        `"${(studentObj.name || "").replace(/"/g, '""')}"`,
        `"${(activeGradeClass?.displayName || "").replace(/"/g, '""')}"`,
        `"${s.subjectName.replace(/"/g, '""')}"`,
        `"${s.teacherName.replace(/"/g, '""')}"`,
        s.grades.length,
        s.grades.length > 0 ? s.avgScore : "-",
        s.grades.length === 0 ? "Belum Ada Nilai" : s.avgScore >= 70 ? "Lulus" : "Tidak Lulus",
      ]);
      rows.push([
        "",
        "",
        "",
        "",
        `"RATA-RATA SELURUH MAPEL"`,
        "",
        `"${classGrades.length} total kuis"`,
        avgGradeScore,
        avgGradeScore >= 70 ? "Lulus" : "Tidak Lulus",
      ]);
    } else {
      if (filteredClassGrades.length === 0) {
        alert("Tidak ada data nilai untuk diekspor pada filter ini.");
        return;
      }
      headers = [
        "No",
        "NIS",
        "Nama Siswa",
        "Kelas & TA",
        "Judul Kuis",
        "Mata Pelajaran",
        "Tipe Kuis",
        "Nilai Akhir",
        "Tanggal Selesai",
      ];
      rows = filteredClassGrades.map((g, idx) => [
        idx + 1,
        `"${(studentObj.nis || "").replace(/"/g, '""')}"`,
        `"${(studentObj.name || "").replace(/"/g, '""')}"`,
        `"${(g.className || activeGradeClass?.displayName || "").replace(/"/g, '""')}"`,
        `"${(g.title || "").replace(/"/g, '""')}"`,
        `"${(g.subjectName || "").replace(/"/g, '""')}"`,
        `"${g.type}"`,
        g.score,
        `"${(g.completedAt || "").replace(/"/g, '""')}"`,
      ]);
      rows.push([
        "",
        "",
        "",
        "",
        `"RATA-RATA NILAI"`,
        `"${selectedGradeSubjectId}"`,
        "",
        avgGradeScore,
        `"Dari ${filteredClassGrades.length} kuis"`,
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const classNameSlug = (activeGradeClass?.name || "Kelas").replace(/[^a-zA-Z0-9]/g, "_");
    const subjSlug = selectedGradeSubjectId === "ALL" ? "Rekap_SemuaMapel" : selectedGradeSubjectId.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute(
      "download",
      `Nilai_${studentObj.name.replace(/[^a-zA-Z0-9]/g, "_")}_${classNameSlug}_${subjSlug}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStudentGrades = () => {
    if (!data?.student) {
      alert("Tidak ada data siswa untuk dicetak.");
      return;
    }
    const studentObj = data.student;

    const isAll = selectedGradeSubjectId === "ALL";

    const tableHtml = isAll
      ? `
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 35px;">No</th>
              <th>Mata Pelajaran</th>
              <th>Guru Pengampu</th>
              <th class="text-center">Evaluasi Selesai</th>
              <th class="text-center">Nilai Rata-Rata</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${subjectSummaries
              .map(
                (s, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td><strong>${s.subjectName}</strong></td>
                <td>${s.teacherName}</td>
                <td class="text-center">${s.grades.length > 0 ? `${s.grades.length} Kuis (${s.pretestCount} Pretest, ${s.posttestCount} Posttest)` : "Belum ada evaluasi"}</td>
                <td class="text-center ${s.grades.length > 0 ? (s.avgScore >= 70 ? "score-pass" : "score-fail") : ""}">${s.grades.length > 0 ? s.avgScore : "-"}</td>
                <td class="text-center ${s.grades.length > 0 ? (s.avgScore >= 70 ? "score-pass" : "score-fail") : ""}">${s.grades.length === 0 ? "Belum Diambil" : s.avgScore >= 70 ? "Lulus" : "Tidak Lulus"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #64748b;">
              <td colspan="3" style="border: 1px solid #cbd5e1; background-color: #ffffff;"></td>
              <td class="text-center" style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; text-transform: uppercase;">Rata-rata Nilai Seluruh Mapel:</td>
              <td class="text-center ${avgGradeScore >= 70 ? "score-pass" : "score-fail"}" style="border: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; padding: 10px;">${avgGradeScore}</td>
              <td class="text-center" style="border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">(${subjectSummaries.filter(s => s.grades.length > 0).length} mapel dengan nilai)</td>
            </tr>
          </tfoot>
        </table>
      `
      : `
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 35px;">No</th>
              <th>Judul Kuis / Modul</th>
              <th>Mata Pelajaran</th>
              <th>Kelas & TA</th>
              <th class="text-center">Tipe</th>
              <th class="text-center">Nilai Akhir</th>
              <th>Tanggal Selesai</th>
            </tr>
          </thead>
          <tbody>
            ${filteredClassGrades
              .map(
                (g, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td><strong>${g.title}</strong></td>
                <td>${g.subjectName}</td>
                <td>${g.className} <br/><span style="font-size: 10px; color: #64748b;">${g.academicYear}</span></td>
                <td class="text-center">${g.type}</td>
                <td class="text-center ${g.score >= 70 ? "score-pass" : "score-fail"}">${g.score}</td>
                <td>${g.completedAt || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #64748b;">
              <td colspan="4" style="border: 1px solid #cbd5e1; background-color: #ffffff;"></td>
              <td class="text-center" style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; text-transform: uppercase;">Rata-rata Nilai:</td>
              <td class="text-center ${avgGradeScore >= 70 ? "score-pass" : "score-fail"}" style="border: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; padding: 10px;">${avgGradeScore}</td>
              <td class="text-center" style="border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">(Total ${filteredClassGrades.length} kuis)</td>
            </tr>
          </tfoot>
        </table>
      `;

    const studentClassName = activeGradeClass?.name
      ? (activeGradeClass.major ? `${activeGradeClass.name} ${activeGradeClass.major}` : activeGradeClass.name)
      : (studentObj.class || "-");
    const studentAcademicYear = (activeGradeClass?.academicYear || activeGradeClass?.year || studentObj.academicYear || "2025/2026").replace(/^TA\s*/i, "");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transkrip Nilai Siswa - ${studentObj.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 15mm 20mm !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 15mm 20mm;
              color: #1e293b;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #334155;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .meta-table {
              width: auto;
              border: none;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12.5px;
              line-height: 1.6;
            }
            .meta-table td {
              border: none !important;
              padding: 2px 0;
              text-align: left;
            }
            .meta-table .label {
              font-weight: bold;
              color: #1e293b;
              width: 120px;
            }
            .meta-table .colon {
              font-weight: bold;
              color: #1e293b;
              width: 16px;
              text-align: center;
            }
            .meta-table .value {
              color: #0f172a;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            table.data-table th, table.data-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            table.data-table th {
              background-color: #f1f5f9;
              font-weight: bold;
              color: #0f172a;
            }
            .text-center { text-align: center !important; }
            .score-pass { color: #047857; font-weight: bold; }
            .score-fail { color: #b91c1c; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DIGIMIND - TRANSKRIP NILAI & EVALUASI SISWA</div>
            <div class="subtitle">Platform Literasi & Monitoring Hasil Belajar Adaptif</div>
          </div>
          <table class="meta-table">
            <tbody>
              <tr>
                <td class="label">nama</td>
                <td class="colon">:</td>
                <td class="value">${studentObj.name}</td>
              </tr>
              <tr>
                <td class="label">NIS</td>
                <td class="colon">:</td>
                <td class="value">${studentObj.nis || "-"}</td>
              </tr>
              <tr>
                <td class="label">kelas</td>
                <td class="colon">:</td>
                <td class="value">${studentClassName}</td>
              </tr>
              <tr>
                <td class="label">Tahun Ajaran</td>
                <td class="colon">:</td>
                <td class="value">${studentAcademicYear}</td>
              </tr>
            </tbody>
          </table>
          ${tableHtml}
        </body>
      </html>
    `;

    let printIframe = document.getElementById("student-print-frame") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "student-print-frame";
      printIframe.style.position = "fixed";
      printIframe.style.right = "0";
      printIframe.style.bottom = "0";
      printIframe.style.width = "0";
      printIframe.style.height = "0";
      printIframe.style.border = "0";
      document.body.appendChild(printIframe);
    }

    const priDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (priDoc) {
      priDoc.open();
      priDoc.write(html);
      priDoc.close();
      setTimeout(() => {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      }, 350);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-zinc-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-600 font-medium">Menyelaraskan Dashboard Anda...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-zinc-900 p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-red-700">Koneksi Gagal</h2>
          <p className="text-xs text-zinc-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] text-xs font-semibold text-white transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.student) return null;

  const { student, modules, completedModuleIds, badges, journals, leaderboard, subjects } = data;

  const getModuleProgress = (moduleId: number) => {
    if (data?.moduleProgressMap && typeof data.moduleProgressMap[moduleId] === "number") {
      return data.moduleProgressMap[moduleId];
    }
    return completedModuleIds.includes(moduleId) ? 100 : 0;
  };

  const recentJournals = journals.filter((journal) => {
    const journalDate = new Date(journal.logged_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return journalDate >= weekAgo;
  });

  const totalWeeklyJournals = recentJournals.length;
  const positiveMoodCount = recentJournals.filter((j) => j.mood_score >= 4).length;
  const neutralMoodCount = recentJournals.filter((j) => j.mood_score === 3).length;
  const lowMoodCount = recentJournals.filter((j) => j.mood_score <= 2).length;
  const moodPercent = totalWeeklyJournals > 0 ? Math.round((positiveMoodCount / totalWeeklyJournals) * 100) : 0;
  const positiveMoodPercent = moodPercent;
  const neutralMoodPercent = totalWeeklyJournals > 0 ? Math.round((neutralMoodCount / totalWeeklyJournals) * 100) : 0;
  const lowMoodPercent = totalWeeklyJournals > 0 ? Math.round((lowMoodCount / totalWeeklyJournals) * 100) : 0;
  const formatLocalDate = (dt: Date | string | number): string => {
    const dObj = new Date(dt);
    if (isNaN(dObj.getTime())) return "";
    const year = dObj.getFullYear();
    const month = String(dObj.getMonth() + 1).padStart(2, "0");
    const day = String(dObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const todayStr = formatLocalDate(todayDate);
  const todayJournal = (journals || []).find((j: any) => formatLocalDate(j.logged_at) === todayStr);

  let dominantMoodPercent = 0;
  let dominantMoodLabel = "Belum Ada";
  let dominantMoodColor = "text-zinc-500";
  if (totalWeeklyJournals > 0) {
    if (positiveMoodCount >= neutralMoodCount && positiveMoodCount >= lowMoodCount) {
      dominantMoodPercent = positiveMoodPercent;
      dominantMoodLabel = "Positif";
      dominantMoodColor = "text-emerald-600";
    } else if (neutralMoodCount >= positiveMoodCount && neutralMoodCount >= lowMoodCount) {
      dominantMoodPercent = neutralMoodPercent;
      dominantMoodLabel = "Biasa";
      dominantMoodColor = "text-amber-600";
    } else {
      dominantMoodPercent = lowMoodPercent;
      dominantMoodLabel = "Perhatian";
    }
  }

  // Calculation for Weekly Mood Bar Chart (Senin - Minggu)
  const dayOfWeek = todayDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + mondayOffset, 12, 0, 0);

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const weeklyMoodBars = dayNames.map((dayLabel, index) => {
    const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + index, 12, 0, 0);
    const dateStr = formatLocalDate(d);
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;

    const journal = (journals || []).find((j: any) => {
      return formatLocalDate(j.logged_at) === dateStr;
    });

    const moodEmoji = journal ? MOOD_EMOJIS.find((m) => m.score === journal.mood_score) : null;

    return {
      dayLabel,
      dateStr,
      isToday,
      isFuture,
      journal,
      moodScore: journal ? journal.mood_score : 0,
      moodEmoji,
    };
  });

  // Helper calculations for Home tab cards (strictly scoped to student's current class)
  const currentClassSubjects = (subjects || []).filter(
    (sub: any) => sub.class_id === student?.class_id || sub.isCurrentClass
  );

  const allAccessibleModules: any[] = [];
  currentClassSubjects.forEach((sub: any) => {
    if (sub.modules && Array.isArray(sub.modules)) {
      sub.modules.forEach((mod: any) => {
        if (!allAccessibleModules.some((m) => m.id === mod.id)) {
          allAccessibleModules.push({ ...mod, subjectName: sub.name });
        }
      });
    }
  });

  const totalAccessibleCount = allAccessibleModules.length;
  const completedAccessibleCount = allAccessibleModules.filter((m) => completedModuleIds.includes(m.id)).length;
  const recommendedModules = allAccessibleModules
    .filter((m) => !completedModuleIds.includes(m.id))
    .slice(0, 3);

  const dynamicNotifications: { id: string; title: string; desc: string; tabTarget: DashboardTab; icon: React.ReactNode; color: string }[] = [];

  // 1. Anjuran Jurnal Harian
  if (!todayJournal) {
    dynamicNotifications.push({
      id: "journal_today",
      title: "Anjuran Jurnal Harian",
      desc: "Kamu belum mengisi perasaan jurnal hari ini. Yuk catat emosimu!",
      tabTarget: "jurnal",
      icon: <FileText className="w-4 h-4 text-amber-500 shrink-0" />,
      color: "bg-amber-50 border-amber-200 text-amber-900"
    });
  }

  // 2. Anjuran Skrining Bulanan
  const hasScreening = (completedModuleIds && completedModuleIds.length > 0) || (journals && journals.length > 3);
  if (!hasScreening) {
    dynamicNotifications.push({
      id: "screening_monthly",
      title: "Anjuran Skrining Bulanan",
      desc: "Skrining awal kesehatan mental bulanan Anda perlu diisi untuk pemantauan.",
      tabTarget: "screening",
      icon: <ClipboardList className="w-4 h-4 text-[#5A77DF] shrink-0" />,
      color: "bg-blue-50 border-blue-200 text-blue-900"
    });
  }

  // 3. Anjuran Belajar Modul Pembelajaran
  if (recommendedModules.length > 0) {
    dynamicNotifications.push({
      id: "module_recommendation",
      title: "Anjuran Belajar Modul",
      desc: `Ada ${recommendedModules.length} modul pembelajaran disarankan untuk dibaca hari ini.`,
      tabTarget: "modul",
      icon: <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />,
      color: "bg-emerald-50 border-emerald-200 text-emerald-900"
    });
  }

  // 4. Pesan dari Guru BK
  if (chatMessages && chatMessages.length > 0) {
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg && lastMsg.sender_role === "teacher") {
      dynamicNotifications.push({
        id: `chat_bk_${lastMsg.id}`,
        title: "Pesan dari Guru BK",
        desc: `"${lastMsg.content || "Guru BK memberikan bimbingan konseling"}"`,
        tabTarget: "chat_bk",
        icon: <MessageSquare className="w-4 h-4 text-violet-500 shrink-0" />,
        color: "bg-violet-50 border-violet-200 text-violet-900"
      });
    }
  }

  const activeNotifications = dynamicNotifications.filter(n => !dismissedNotifIds.includes(n.id));

  return (
    <div className="student-dashboard-page relative flex min-h-screen flex-col bg-white text-zinc-900 font-sans pb-24 md:pb-8 w-full">
      {/* Decorative Orbs - Clipped */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#5A77DF]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-[#3E53A2]/5 blur-[120px]" />
      </div>

      {/* TOP NAVBAR (STICKY ON MOBILE & DESKTOP) */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="DigiMind" className="h-9 sm:h-12 w-auto max-w-[130px] sm:max-w-none object-contain" />
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {student && (
            <button
              type="button"
              onClick={() => setActiveTab("profil")}
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition cursor-pointer group"
            >
              {student.avatar ? (
                <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full p-[2px] bg-gradient-to-tr from-[#5A77DF] via-[#7B93EC] to-purple-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <div className="h-full w-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                    {student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                      <img src={student.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-amber-400 text-white font-black flex items-center justify-center text-xs sm:text-sm">
                        {student.avatar}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full p-[2px] bg-gradient-to-tr from-[#5A77DF] via-[#7B93EC] to-purple-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-[#5A77DF] to-[#3E53A2] text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-inner">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="hidden sm:block">
                <h4 className="text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-[#5A77DF] transition-colors">
                  {student.name}
                </h4>
                <p className="text-xs font-semibold text-zinc-400 leading-tight">
                  Kelas {student.class}
                </p>
              </div>
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-zinc-900 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center"
              title="Pemberitahuan"
            >
              <Bell className="w-5 h-5 text-zinc-900 fill-zinc-900" />
              {activeNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white shadow-xs" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-84 max-w-xs rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl z-[9999] space-y-3 text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#5A77DF]" /> Pemberitahuan
                  </h3>
                  {activeNotifications.length > 0 && (
                    <span className="text-4xs font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] px-2 py-0.5 rounded-full">
                      {activeNotifications.length} Baru
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {activeNotifications.length > 0 ? (
                    activeNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`rounded-xl border p-3 text-2xs space-y-1.5 transition ${notif.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold">
                            {notif.icon}
                            <span>{notif.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDismissedNotifIds((prev) => [...prev, notif.id]);
                            }}
                            className="text-3xs text-zinc-400 hover:text-zinc-700 font-extrabold px-1 cursor-pointer"
                            title="Tandai Selesai / Dibaca"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-3xs leading-relaxed text-zinc-700">{notif.desc}</p>
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(notif.tabTarget);
                              setShowNotifications(false);
                            }}
                            className="text-4xs font-extrabold text-[#3E53A2] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Lakukan Sekarang</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-zinc-700">Semua Tugas Selesai!</p>
                      <p className="text-3xs text-zinc-500">Tidak ada notifikasi anjuran belajar atau pengisian jurnal saat ini.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="relative z-0 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* DESKTOP SIDEBAR (Visible on lg screens) */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 self-start z-30">
            <div className="rounded-2xl border border-[#5A77DF] bg-[#5A77DF] p-4 shadow-lg space-y-2 text-white">
              <div className="px-2 pb-2 border-b border-white/20">
                <p className="text-2xs font-extrabold uppercase tracking-[0.25em] text-white/70 font-mono">Menu</p>
                <h3 className="text-sm font-black text-white">Dashboard</h3>
              </div>
              {NAV_ITEMS.map((item) => {
                const isItemActive = activeTab === item.id && activeModuleId === null;
                const isModulItem = item.id === "modul";
                const isNilaiItem = item.id === "nilai";
                const availableClasses = data?.availableClasses || [];
                const currentClassId = selectedModulClassId || student.class_id;
                const currentGradeClassId = activeGradeClassId;

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModuleId(null);
                        if (isModulItem) {
                          if (activeTab === "modul") {
                            setIsModulSubmenuOpen((prev) => !prev);
                          } else {
                            setActiveTab("modul");
                            setIsModulSubmenuOpen(true);
                            if (student.class_id && !selectedModulClassId) {
                              setSelectedModulClassId(student.class_id);
                            }
                          }
                        } else if (isNilaiItem) {
                          if (activeTab === "nilai") {
                            setIsNilaiSubmenuOpen((prev) => !prev);
                          } else {
                            setActiveTab("nilai");
                            setIsNilaiSubmenuOpen(true);
                            if (student.class_id && !selectedGradeClassId) {
                              setSelectedGradeClassId(student.class_id);
                            }
                          }
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                        isItemActive
                          ? "border-white bg-white text-[#3E53A2] shadow-md"
                          : "border-transparent text-white/85 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {(isModulItem || isNilaiItem) && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            (isModulItem && isModulSubmenuOpen && activeTab === "modul") ||
                            (isNilaiItem && isNilaiSubmenuOpen && activeTab === "nilai")
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu for Modul in Sidebar: Kelas & Mapel */}
                    {isModulItem && isModulSubmenuOpen && activeTab === "modul" && (
                      <div className="ml-2 pl-2 border-l border-white/20 my-1.5 space-y-2.5 animate-fadeIn">
                        {studentAvailableClasses.map((cls) => {
                          const isClassActive = currentClassId === cls.id;
                          const isCurrentClass = cls.id === student.class_id;
                          const clsSubjects = (subjects || []).filter((s) => s.class_id === cls.id);
                          const totalModulCount = clsSubjects.reduce((acc, s) => acc + (s.modules?.length || 0), 0);

                          return (
                            <div key={`modul-cls-${cls.id}`} className="space-y-1">
                              {/* Class Header Button */}
                              <button
                                type="button"
                                title={cls.displayName || (cls.major ? `${cls.name} ${cls.major}` : cls.name)}
                                onClick={() => {
                                  setActiveModuleId(null);
                                  setSelectedModulClassId(cls.id);
                                  setSelectedModulSubjectId("ALL");
                                  setActiveTab("modul");
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-black tracking-tight text-left transition cursor-pointer ${
                                  isClassActive
                                    ? "bg-white/20 text-white font-extrabold ring-1 ring-white/30"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <span className="truncate flex items-center gap-1.5">
                                  <School className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                  <span className="truncate">{cls.displayName || (cls.major ? `${cls.name} ${cls.major}` : cls.name)}</span>
                                </span>
                                {isCurrentClass && (
                                  <span className="text-[8px] px-1 py-0.5 rounded font-mono font-black uppercase bg-white/30 text-white shrink-0 ml-1">
                                    Aktif
                                  </span>
                                )}
                              </button>

                              {/* Child Menu: Semua Modul & Mapel */}
                              <div className="ml-2 pl-2 border-l border-white/15 space-y-0.5">
                                {/* Semua Modul */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModuleId(null);
                                    setSelectedModulClassId(cls.id);
                                    setSelectedModulSubjectId("ALL");
                                    setActiveTab("modul");
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium text-left transition cursor-pointer ${
                                    isClassActive && selectedModulSubjectId === "ALL"
                                      ? "bg-white text-[#3E53A2] font-black shadow-xs"
                                      : "text-white/80 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <span className="truncate">Semua Modul</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-1 ${
                                      isClassActive && selectedModulSubjectId === "ALL"
                                        ? "bg-[#3E53A2]/15 text-[#3E53A2]"
                                        : "bg-white/20 text-white/90"
                                    }`}
                                  >
                                    {totalModulCount}
                                  </span>
                                </button>

                                {/* List Mapel */}
                                {clsSubjects.map((sub) => {
                                  const isSubActive = isClassActive && selectedModulSubjectId === sub.id;
                                  const modCount = sub.modules?.length || 0;

                                  return (
                                    <button
                                      key={`modul-sub-${cls.id}-${sub.id}`}
                                      type="button"
                                      onClick={() => {
                                        setActiveModuleId(null);
                                        setSelectedModulClassId(cls.id);
                                        setSelectedModulSubjectId(sub.id);
                                        setActiveTab("modul");
                                      }}
                                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium text-left transition cursor-pointer ${
                                        isSubActive
                                          ? "bg-white text-[#3E53A2] font-black shadow-xs"
                                          : "text-white/80 hover:bg-white/10 hover:text-white"
                                      }`}
                                    >
                                      <span className="truncate">{sub.name}</span>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-1 ${
                                          isSubActive
                                            ? "bg-[#3E53A2]/15 text-[#3E53A2]"
                                            : "bg-white/20 text-white/90"
                                        }`}
                                      >
                                        {modCount}
                                      </span>
                                    </button>
                                  );
                                })}

                                {clsSubjects.length === 0 && (
                                  <p className="text-[10px] text-white/50 italic px-2 py-0.5">
                                    Belum ada mapel
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Submenu for Data Nilai in Sidebar: Kelas & Mapel */}
                    {isNilaiItem && isNilaiSubmenuOpen && activeTab === "nilai" && (
                      <div className="ml-2 pl-2 border-l border-white/20 my-1.5 space-y-2.5 animate-fadeIn">
                        {studentAvailableClasses.map((cls) => {
                          const isClassActive = currentGradeClassId === cls.id;
                          const isCurrentClass = cls.id === student.class_id;
                          const thisClassGrades = studentGrades.filter((g) => g.classId === cls.id);

                          // Extract unique subject names for this class
                          const subjectNamesSet = new Set<string>();
                          (subjects || []).filter((s) => s.class_id === cls.id).forEach((s) => subjectNamesSet.add(s.name));
                          thisClassGrades.forEach((g) => {
                            if (g.subjectName) subjectNamesSet.add(g.subjectName);
                          });
                          const classSubjectNames = Array.from(subjectNamesSet).sort();

                          return (
                            <div key={`grade-cls-${cls.id}`} className="space-y-1">
                              {/* Class Header Button */}
                              <button
                                type="button"
                                title={cls.displayName || (cls.major ? `${cls.name} ${cls.major}` : cls.name)}
                                onClick={() => {
                                  setSelectedGradeClassId(cls.id);
                                  setSelectedGradeSubjectId("ALL");
                                  setActiveTab("nilai");
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-black tracking-tight text-left transition cursor-pointer ${
                                  isClassActive
                                    ? "bg-white/20 text-white font-extrabold ring-1 ring-white/30"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <span className="truncate flex items-center gap-1.5">
                                  <School className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                  <span className="truncate">{cls.displayName || (cls.major ? `${cls.name} ${cls.major}` : cls.name)}</span>
                                </span>
                                {isCurrentClass && (
                                  <span className="text-[8px] px-1 py-0.5 rounded font-mono font-black uppercase bg-white/30 text-white shrink-0 ml-1">
                                    Aktif
                                  </span>
                                )}
                              </button>

                              {/* Child Menu: Semua Nilai & Mapel */}
                              <div className="ml-2 pl-2 border-l border-white/15 space-y-0.5">
                                {/* Semua Nilai */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedGradeClassId(cls.id);
                                    setSelectedGradeSubjectId("ALL");
                                    setActiveTab("nilai");
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium text-left transition cursor-pointer ${
                                    isClassActive && selectedGradeSubjectId === "ALL"
                                      ? "bg-white text-[#3E53A2] font-black shadow-xs"
                                      : "text-white/80 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <span className="truncate">Semua Nilai</span>
                                </button>

                                {/* List Mapel */}
                                {classSubjectNames.map((subjName) => {
                                  const isSubActive = isClassActive && selectedGradeSubjectId === subjName;

                                  return (
                                    <button
                                      key={`grade-sub-${cls.id}-${subjName}`}
                                      type="button"
                                      onClick={() => {
                                        setSelectedGradeClassId(cls.id);
                                        setSelectedGradeSubjectId(subjName);
                                        setActiveTab("nilai");
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium text-left transition cursor-pointer ${
                                        isSubActive
                                          ? "bg-white text-[#3E53A2] font-black shadow-xs"
                                          : "text-white/80 hover:bg-white/10 hover:text-white"
                                      }`}
                                    >
                                      <span className="truncate">{subjName}</span>
                                    </button>
                                  );
                                })}

                                {classSubjectNames.length === 0 && (
                                  <p className="text-[10px] text-white/50 italic px-2 py-0.5">
                                    Belum ada data nilai
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on mobile/tablet screens) */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-2xl px-1 py-1.5 flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id && activeModuleId === null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveModuleId(null);
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                    isActive ? "text-[#5A77DF] font-extrabold" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <span className={`p-1 rounded-lg ${isActive ? "bg-[#5A77DF]/15 text-[#5A77DF]" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="text-[9px] sm:text-[10px] leading-tight font-semibold mt-0.5 truncate max-w-[56px] sm:max-w-[70px]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 w-full">
            <main className="w-full">
              {activeModuleId !== null ? (
                <StudentModuleDetailView
                  moduleId={activeModuleId}
                  onBack={() => {
                    setActiveModuleId(null);
                    fetchDashboardData();
                  }}
                />
              ) : (
                <>
                  {/* TAB 1: HOME */}
                  {activeTab === "home" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Hero Banner Blue Card */}
                  <div className="relative rounded-3xl bg-gradient-to-r from-[#5A77DF] via-[#4A64CA] to-[#3E53A2] p-6 sm:p-8 text-white shadow-xl">
                    {/* Floating Decorative Orbs & Sparkles */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl overflow-hidden" />
                    <div className="pointer-events-none absolute right-1/3 bottom-0 h-40 w-40 rounded-full bg-blue-300/20 blur-xl overflow-hidden" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Left Column: Text & Date */}
                      <div className="space-y-3 max-w-xl text-left">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-3xs font-extrabold text-white backdrop-blur-md border border-white/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                        
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                          Selamat Datang Kembali, {student.name.split(" ")[0]}! 
                        </h1>
                        
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                          Selalu terhubung di portal siswa Anda. Pantau progres belajar dan perkembangan kesehatan emosional Anda secara real-time di DigiMind!
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-3xs font-extrabold text-white flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                            <span>{completedAccessibleCount} dari {totalAccessibleCount} Modul Selesai</span>
                          </div>
                          <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-3xs font-extrabold text-white flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kelas {student.class_name || student.class} {student.class_major ? `(${student.class_major})` : ""} {student.academicYear ? `• ${student.academicYear}` : ""}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Real 3D Person Character Illustration */}
                      <div className="relative shrink-0 flex items-center justify-end w-full md:w-auto mt-2 md:mt-0">
                        <div className="relative flex items-center justify-center">
                          <img 
                            src="/digimind-hero-3d.png" 
                            alt="DigiMind 3D Illustration" 
                            className="h-48 sm:h-56 md:h-64 lg:h-72 w-auto object-contain drop-shadow-2xl transform hover:scale-105 transition duration-300 pointer-events-none select-none -my-2 sm:-my-4 md:-my-5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Main 2-Column Grid with CSS Grid Stretch */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-stretch">
                    {/* Left Column (md:col-span-2): Status Mental, Progres Belajar, Screening Bulanan */}
                    <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                      {/* Card 1: Status Mental Siswa */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-4 shadow-sm space-y-2.5 shrink-0">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Status Mental Siswa</span>
                          <span className="text-3xs text-zinc-400 font-mono font-bold">Kondisi Terkini</span>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 ${
                          student.mental_level?.toLowerCase().includes("perlu pendampingan")
                            ? "bg-rose-50/80 border-rose-200/80 text-rose-700"
                            : student.mental_level?.toLowerCase().includes("sudah pendampingan")
                            ? "bg-amber-50/80 border-amber-200/80 text-amber-700"
                            : student.mental_level?.toLowerCase().includes("sehat") || student.mental_level?.toLowerCase().includes("stabil")
                            ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-700"
                            : "bg-[#5A77DF]/10 border-[#5A77DF]/20 text-[#3E53A2]"
                        }`}>
                          {student.mental_level?.toLowerCase().includes("perlu pendampingan") ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : student.mental_level?.toLowerCase().includes("sudah pendampingan") ? (
                            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="text-xs font-black uppercase tracking-wide">
                            {student.mental_level || "Belum Ada Data"}
                          </span>
                        </div>

                        {/* Description Text (Singkat & Jelas) */}
                        <p className="text-2xs text-zinc-600 font-medium">
                          {student.mental_level?.toLowerCase().includes("perlu pendampingan")
                            ? "Perlu ruang aman untuk berdiskusi. Guru BK siap mendampingimu."
                            : student.mental_level?.toLowerCase().includes("sudah pendampingan")
                            ? "Sesi pendampingan selesai. Tetap jaga kondisi emosionalmu."
                            : student.mental_level?.toLowerCase().includes("sehat") || student.mental_level?.toLowerCase().includes("stabil")
                            ? "Kondisi emosionalmu sehat & stabil. Pertahankan ritme belajarmu!"
                            : "Pantau kondisi mentalmu melalui jurnal & screening berkala."}
                        </p>

                        {/* Action if Perlu Pendampingan or Chat BK */}
                        {student.mental_level?.toLowerCase().includes("perlu pendampingan") && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("chat_bk")}
                            className="inline-flex items-center gap-1.5 text-2xs font-extrabold text-[#5A77DF] hover:text-[#3E53A2] transition-colors pt-0.5 group cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Konsultasi dengan Guru BK</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>

                      {/* Card 2: Progres Belajar (Dynamic 3D Isometric Pie Chart) */}
                      {(() => {
                        const completedPercent = Math.min(100, Math.max(0, student.module_progress || 0));
                        const remainingPercent = 100 - completedPercent;
                        const completedCount = completedAccessibleCount;
                        const remainingCount = Math.max(0, totalAccessibleCount - completedAccessibleCount);
                        
                        const cx = 170;
                        const cy = 86;
                        const rx = 70;
                        const ry = 32;
                        const h = 22;

                        // Dynamic SVG path calculations for 3D isometric cylinder
                        const isZero = completedPercent <= 0;
                        const isFull = completedPercent >= 100;
                        
                        const angle = (completedPercent / 100) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const endX = +(cx + rx * Math.cos(rad)).toFixed(2);
                        const endY = +(cy + ry * Math.sin(rad)).toFixed(2);
                        const largeArc = angle > 180 ? 1 : 0;

                        return (
                          <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-4 shadow-sm space-y-2 shrink-0">
                            <div className="flex items-center justify-between">
                              <span className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                                Modul Belajar
                              </span>
                              <span className={`text-3xs font-bold px-2 py-0.5 rounded-full border ${
                                isFull
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : !isZero
                                  ? "bg-[#5A77DF]/10 text-[#3E53A2] border-[#5A77DF]/20"
                                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
                              }`}>
                                {isFull ? "Tuntas 100%" : !isZero ? `${completedPercent}% Sedang Aktif` : "Belum Dimulai"}
                              </span>
                            </div>

                            {/* 3D Isometric Pie Chart (Compact Tight ViewBox) */}
                            <div className="relative w-full flex items-center justify-center">
                              <svg
                                viewBox="0 8 340 136"
                                className="w-full max-w-[320px] h-auto drop-shadow-xs select-none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <defs>
                                  {/* Tuntas (DigiMind Blue Gradient) */}
                                  <linearGradient id="pieTuntasTop" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#818CF8" />
                                    <stop offset="100%" stopColor="#5A77DF" />
                                  </linearGradient>
                                  <linearGradient id="pieTuntasSide" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4338CA" />
                                    <stop offset="100%" stopColor="#312E81" />
                                  </linearGradient>

                                  {/* Belum Selesai (Soft Slate Gradient) */}
                                  <linearGradient id="pieRemainingTop" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#F8FAFC" />
                                    <stop offset="100%" stopColor="#EEF2FF" />
                                  </linearGradient>
                                  <linearGradient id="pieRemainingSide" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#CBD5E1" />
                                    <stop offset="100%" stopColor="#94A3B8" />
                                  </linearGradient>
                                </defs>

                                {/* Drop Shadow under 3D cylinder */}
                                <ellipse cx={cx} cy={cy + 30} rx={rx + 2} ry={18} fill="#5A77DF" opacity="0.12" filter="blur(5px)" />

                                {isZero ? (
                                  /* Case 1: 0% Progress (Entire cylinder is Belum Selesai) */
                                  <g id="pieZero">
                                    {/* Front 3D Skirt */}
                                    <path
                                      d={`M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} Z`}
                                      fill="url(#pieRemainingSide)"
                                      stroke="#94A3B8"
                                      strokeWidth="0.75"
                                    />
                                    {/* Top Ellipse */}
                                    <ellipse
                                      cx={cx}
                                      cy={cy}
                                      rx={rx}
                                      ry={ry}
                                      fill="url(#pieRemainingTop)"
                                      stroke="#CBD5E1"
                                      strokeWidth="1"
                                    />
                                  </g>
                                ) : isFull ? (
                                  /* Case 2: 100% Progress (Entire cylinder is Tuntas) */
                                  <g id="pieFull">
                                    {/* Front 3D Skirt */}
                                    <path
                                      d={`M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} Z`}
                                      fill="url(#pieTuntasSide)"
                                      stroke="#3730A3"
                                      strokeWidth="0.75"
                                    />
                                    {/* Top Ellipse */}
                                    <ellipse
                                      cx={cx}
                                      cy={cy}
                                      rx={rx}
                                      ry={ry}
                                      fill="url(#pieTuntasTop)"
                                      stroke="#4338CA"
                                      strokeWidth="1"
                                    />
                                  </g>
                                ) : (
                                  /* Case 3: Partial Progress (Split 3D cylinder) */
                                  <g id="piePartial">
                                    {/* 1. Remaining Slice (Back/Base) */}
                                    <path
                                      d={`M ${cx} ${cy} L ${endX} ${endY} A ${rx} ${ry} 0 ${1 - largeArc} 1 ${cx + rx} ${cy} Z`}
                                      fill="url(#pieRemainingTop)"
                                      stroke="#CBD5E1"
                                      strokeWidth="0.75"
                                    />

                                    {/* 2. Remaining 3D Skirt (if in front half 0-180) */}
                                    {angle < 180 && (
                                      <path
                                        d={`M ${endX} ${endY} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${endX} ${endY + h} Z`}
                                        fill="url(#pieRemainingSide)"
                                        stroke="#94A3B8"
                                        strokeWidth="0.75"
                                      />
                                    )}

                                    {/* 3. Tuntas 3D Skirt (Front arc) */}
                                    <path
                                      d={angle <= 180
                                        ? `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${endX} ${endY} L ${endX} ${endY + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} Z`
                                        : `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} Z`}
                                      fill="url(#pieTuntasSide)"
                                      stroke="#3730A3"
                                      strokeWidth="0.75"
                                    />

                                    {/* 4. Radial Cut Wall into depth */}
                                    <path
                                      d={`M ${cx} ${cy} L ${endX} ${endY} L ${endX} ${endY + h} L ${cx} ${cy + h} Z`}
                                      fill="#312E81"
                                      opacity="0.85"
                                    />

                                    {/* 5. Tuntas Slice Top */}
                                    <path
                                      d={`M ${cx} ${cy} L ${cx + rx} ${cy} A ${rx} ${ry} 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                      fill="url(#pieTuntasTop)"
                                      stroke="#4338CA"
                                      strokeWidth="0.75"
                                    />
                                  </g>
                                )}

                                {/* CALLOUT BOX 1: MODUL TUNTAS (Left) */}
                                <g id="calloutTuntas">
                                  <polyline
                                    points="115,74 92,32 80,32"
                                    fill="none"
                                    stroke="#5A77DF"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="115" cy="74" r="3" fill="#5A77DF" />
                                  <rect x="4" y="14" width="76" height="36" rx="6" fill="#FFFFFF" stroke="#5A77DF" strokeWidth="1.75" />
                                  <text x="42" y="24" fontSize="7" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#5A77DF" textAnchor="middle">
                                    MODUL TUNTAS
                                  </text>
                                  <text x="42" y="38" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#18181B" textAnchor="middle">
                                    {completedPercent}%
                                  </text>
                                  <text x="42" y="46" fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#71717A" textAnchor="middle">
                                    {completedCount} dari {totalAccessibleCount} Modul
                                  </text>
                                </g>

                                {/* CALLOUT BOX 2: BELUM SELESAI (Right) */}
                                <g id="calloutRemaining">
                                  <polyline
                                    points="225,82 248,32 260,32"
                                    fill="none"
                                    stroke="#818CF8"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="225" cy="82" r="3" fill="#818CF8" />
                                  <rect x="260" y="14" width="76" height="36" rx="6" fill="#FFFFFF" stroke="#818CF8" strokeWidth="1.75" />
                                  <text x="298" y="24" fontSize="7" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#4F46E5" textAnchor="middle">
                                    BELUM SELESAI
                                  </text>
                                  <text x="298" y="38" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#18181B" textAnchor="middle">
                                    {remainingPercent}%
                                  </text>
                                  <text x="298" y="46" fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#71717A" textAnchor="middle">
                                    {remainingCount} Modul Sisa
                                  </text>
                                </g>
                              </svg>
                            </div>

                            {/* Mini horizontal progress bar */}
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#5A77DF] to-[#818CF8] rounded-full transition-all duration-500"
                                style={{ width: `${completedPercent}%` }}
                              />
                            </div>

                            {/* Footer Info & Action */}
                            <div className="pt-1 border-t border-zinc-100 flex items-center justify-between">
                              <p className="text-2xs text-zinc-500 font-medium">
                                <span className="font-bold text-zinc-700">{completedCount}</span> dari {totalAccessibleCount} modul tuntas
                              </p>

                              <button
                                type="button"
                                onClick={() => setActiveTab("modul")}
                                className="inline-flex items-center gap-1 text-2xs font-extrabold text-[#5A77DF] hover:text-[#3E53A2] transition-colors group cursor-pointer"
                              >
                                <span>Buka Modul</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card 3: Screening Bulanan (Flex-1 Auto-Stretch to align 100% flush with Badge card) */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-3xs px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                              data?.monthlyScreening?.isCompletedThisMonth
                                ? "bg-[#5A77DF]/10 text-[#3E53A2] border-[#5A77DF]/30"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
                            }`}>
                              {data?.monthlyScreening?.isCompletedThisMonth ? (
                                <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /> Sudah Screening</span>
                              ) : (
                                <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Belum Screening</span>
                              )}
                            </span>
                            <span className="text-3xs text-zinc-500 font-mono font-bold">Bulan Ini</span>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-zinc-900">
                              {data?.monthlyScreening?.isCompletedThisMonth ? "Status Mental Terkini" : "Evaluasi Kesehatan Mental Bulanan"}
                            </h3>
                            <p className="text-2xs text-zinc-700 leading-relaxed">
                              {data?.monthlyScreening?.isCompletedThisMonth
                                ? `Status mental periode ${indonesianMonths[new Date().getMonth()]} ${new Date().getFullYear()} tercatat: "${student.mental_level}". Hasil tersimpan aman di database.`
                                : "Yuk luangkan 3-5 menit untuk mengisi 29 pertanyaan SRQ-29 bulan ini agar kondisi emosionalmu selalu terpantau."}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (data?.monthlyScreening?.isCompletedThisMonth) {
                              setActiveTab("screening");
                            } else {
                              handleOpenMonthlySrqModal();
                            }
                          }}
                          className="w-full rounded-xl py-3 text-xs font-extrabold transition text-center cursor-pointer bg-[#5A77DF] hover:bg-[#3E53A2] text-white shadow-sm mt-2"
                        >
                          {data?.monthlyScreening?.isCompletedThisMonth ? (
                            "Lihat Riwayat & Detail Screening"
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1.5">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Mulai Screening Bulanan (SRQ-29)</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right Column (md:col-span-4): Status Mood Minggu Ini (Top) & Badge (Bottom) */}
                    <div className="md:col-span-4 space-y-6 flex flex-col justify-between">
                      {/* Card 3: Status Mood Minggu Ini (Diagram Batang / Bar Chart) */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-extrabold uppercase tracking-tight text-[#3E53A2]">
                              Status Mood Minggu Ini
                            </p>
                            <p className="text-2xs text-zinc-500 font-medium">
                              Diagram refleksi emosional harian (Senin - Minggu)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (todayJournal) {
                                setSelectedDetailJournal(todayJournal);
                                setShowDetailModal(true);
                              } else {
                                setSelectedFillDate(todayStr);
                                setMoodScore(3);
                                setJournalNotes("");
                                setJournalActivities("");
                                setJournalMessage(null);
                                setShowFillModal(true);
                              }
                            }}
                            className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 px-3 py-2 text-2xs font-extrabold text-[#3E53A2] transition hover:bg-[#5A77DF]/20 cursor-pointer self-start sm:self-center shrink-0"
                          >
                            {todayJournal ? "Lihat Jurnal Hari Ini" : "+ Isi Jurnal Hari Ini"}
                          </button>
                        </div>

                        {/* Weekly Bar Chart Container */}
                        <div className="pt-1">
                          <div className="bg-[#5A77DF]/5 border border-[#5A77DF]/20 rounded-2xl p-4 sm:p-5">
                            <div className="grid grid-cols-7 gap-2 sm:gap-3">
                              {weeklyMoodBars.map((bar, idx) => {
                                const heightPercent = bar.moodScore > 0 ? Math.max(18, Math.round((bar.moodScore / 5) * 100)) : 0;
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      if (bar.journal) {
                                        setSelectedDetailJournal(bar.journal);
                                        setShowDetailModal(true);
                                      } else if (!bar.isFuture) {
                                        setSelectedFillDate(bar.dateStr);
                                        setMoodScore(3);
                                        setJournalNotes("");
                                        setJournalActivities("");
                                        setJournalMessage(null);
                                        setShowFillModal(true);
                                      }
                                    }}
                                    className={`flex flex-col items-center justify-end gap-2 relative transition-all ${
                                      bar.isFuture && !bar.journal
                                        ? "cursor-default select-none"
                                        : "cursor-pointer group"
                                    }`}
                                    title={
                                      bar.journal
                                        ? `${bar.dayLabel}: ${bar.moodEmoji?.label} (Skor ${bar.moodScore}/5)`
                                        : bar.isFuture
                                        ? `${bar.dayLabel}: Belum Tiba`
                                        : `${bar.dayLabel}: Klik untuk isi jurnal`
                                    }
                                  >
                                    {/* Mood Emoji or Bright Indicator Floating Above Bar */}
                                    <div className="h-9 w-9 flex items-center justify-center shrink-0">
                                      {bar.journal && bar.moodEmoji ? (
                                        <div className="transition-all duration-200 group-hover:scale-125">
                                          {bar.moodEmoji.icon}
                                        </div>
                                      ) : bar.isToday ? (
                                        <div className="h-7 w-7 rounded-full bg-[#5A77DF]/15 border-2 border-[#5A77DF] flex items-center justify-center text-[#5A77DF] font-black text-xs shadow-xs animate-pulse group-hover:scale-110 transition-transform">
                                          +
                                        </div>
                                      ) : !bar.isFuture ? (
                                        <div className="h-7 w-7 rounded-full bg-white border-2 border-dashed border-[#5A77DF]/40 flex items-center justify-center text-[#5A77DF] font-bold text-xs shadow-xs group-hover:border-[#5A77DF] group-hover:bg-[#5A77DF]/10 transition-all">
                                          +
                                        </div>
                                      ) : (
                                        <div className="h-7 w-7 rounded-full bg-white border border-[#5A77DF]/40 flex items-center justify-center shadow-xs">
                                          <div className="h-2 w-2 rounded-full bg-[#5A77DF]/70" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Vertical Bar Slot Track */}
                                    <div
                                      className={`w-full max-w-[32px] sm:max-w-[38px] rounded-2xl overflow-hidden h-28 sm:h-32 flex items-end p-1 shadow-xs transition-all ${
                                        bar.moodScore > 0
                                          ? "bg-white border border-[#5A77DF]/30"
                                          : !bar.isFuture
                                          ? "bg-white border-2 border-dashed border-[#5A77DF]/40 group-hover:border-[#5A77DF] group-hover:bg-[#5A77DF]/5"
                                          : "bg-white border border-[#5A77DF]/35"
                                      }`}
                                    >
                                      {bar.moodScore > 0 ? (
                                        <div
                                          className={`w-full rounded-xl transition-all duration-500 ${
                                            bar.moodScore >= 4
                                              ? "bg-gradient-to-t from-[#5A77DF] via-[#4A64CA] to-[#3E53A2] shadow-sm shadow-[#5A77DF]/30"
                                              : bar.moodScore === 3
                                              ? "bg-gradient-to-t from-[#7B93EC] to-[#5A77DF] shadow-2xs"
                                              : "bg-gradient-to-t from-[#9BB0F5] to-[#7B93EC] opacity-90"
                                          }`}
                                          style={{ height: `${heightPercent}%` }}
                                        />
                                      ) : (
                                        <div
                                          className={`w-full rounded-full transition-all ${
                                            !bar.isFuture
                                              ? "h-2.5 bg-[#5A77DF]/35 group-hover:bg-[#5A77DF]"
                                              : "h-2 bg-[#5A77DF]/30"
                                          }`}
                                        />
                                      )}
                                    </div>

                                    {/* Day Label at Bottom */}
                                    <div className="mt-1 flex items-center justify-center">
                                      <span
                                        className={`text-[11px] font-extrabold uppercase font-mono transition-all ${
                                          bar.isToday
                                            ? "bg-[#5A77DF] text-white px-2.5 py-0.5 rounded-full shadow-xs"
                                            : bar.journal
                                            ? "text-[#3E53A2] font-black"
                                            : !bar.isFuture
                                            ? "text-[#3E53A2] font-bold group-hover:text-[#5A77DF]"
                                            : "text-[#3E53A2]/80 font-bold"
                                        }`}
                                      >
                                        {bar.dayLabel}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Badge Baru Didapatkan */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Gamifikasi</span>
                            <span className="text-3xs text-zinc-500 font-mono font-bold">{badges.unlocked.length} / {badges.all.length} Badge</span>
                          </div>
                          <h3 className="text-base font-bold text-zinc-900">Badge & Lencana Baru Didapatkan</h3>

                          {badges.unlocked.length === 0 ? (
                            <div className="p-3.5 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 text-2xs text-[#3E53A2] italic">
                              Belum ada badge yang terbuka. Selesaikan modul & pretest untuk meraih badge pertamamu!
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {badges.unlocked.slice(0, 3).map((b: any) => (
                                <div key={b.id} className="flex items-center gap-2.5 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/10 px-3.5 py-2 text-2xs">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#5A77DF]/30 bg-white text-base overflow-hidden shadow-2xs">
                                    {b.image_url?.startsWith("/") || b.image_url?.startsWith("http") ? (
                                      <img src={b.image_url} alt={b.name} className="h-full w-full object-cover p-0.5" />
                                    ) : b.image_url ? (
                                      <span>{b.image_url}</span>
                                    ) : (
                                      <Award className="w-4 h-4 text-amber-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#3E53A2]">{b.name}</p>
                                    <p className="text-[9px] text-zinc-600 truncate max-w-[140px]">{b.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("badge")}
                          className="w-full rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 py-3 text-xs font-bold text-[#3E53A2] transition text-center cursor-pointer"
                        >
                          Lihat Semua Koleksi Lencana ({badges.unlocked.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Card Rekomendasi Modul yang Dikerjakan */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900">Rekomendasi Modul Pembelajaran</h3>
                        <p className="text-2xs text-zinc-500 mt-0.5">Modul yang disarankan untuk dikerjakan selanjutnya</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("modul")}
                        className="text-2xs font-extrabold text-[#5A77DF] hover:text-[#3E53A2] transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Lihat Semua Modul</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {recommendedModules.length === 0 ? (
                      <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 text-center text-xs text-[#3E53A2] font-medium flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#5A77DF] shrink-0" />
                        {totalAccessibleCount === 0 ? (
                          <span>Belum ada modul pembelajaran yang tersedia.</span>
                        ) : completedAccessibleCount >= totalAccessibleCount ? (
                          <span>Selamat! Semua modul pembelajaran pada level Anda telah selesai dikerjakan.</span>
                        ) : (
                          <span>Selesaikan pretest mata pelajaran terlebih dahulu untuk membuka modul pembelajaran.</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendedModules.map((mod: any) => {
                          const prog = mod.progress || 0;
                          return (
                            <div key={mod.id} className="rounded-xl border border-[#5A77DF]/20 bg-white p-4 flex flex-col justify-between gap-3 hover:border-[#5A77DF] transition shadow-xs">
                              <div className="space-y-1.5">
                                <span className="text-[9px] uppercase tracking-wider text-[#5A77DF] font-extrabold font-mono">{mod.subjectName}</span>
                                <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">{mod.title}</h4>
                                <p className="text-3xs text-zinc-600 line-clamp-2 leading-relaxed">{stripHtmlTags(mod.content)}</p>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-zinc-200">
                                <div className="flex justify-between text-[9px] text-zinc-500 font-mono font-bold">
                                  <span>Progress</span>
                                  <span>{prog}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                                  <div className="h-full bg-[#5A77DF] rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveModuleId(mod.id)}
                                  className="w-full rounded-lg bg-[#5A77DF] hover:bg-[#3E53A2] text-white text-3xs font-extrabold py-2 transition text-center cursor-pointer mt-1 shadow-2xs"
                                >
                                  {prog > 0 ? "Lanjutkan Belajar" : "Pelajari Modul"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SCREENING BULANAN */}
              {/* TAB 2: SKRINING BULANAN */}
              {activeTab === "screening" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Top Header Card */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col gap-2 border-b border-zinc-100 pb-4">
                      <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                        Screening Kesehatan Mental Bulanan (SRQ-29)
                      </h2>
                      <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl">
                        Screening mandiri menggunakan instrumen baku WHO Self-Reporting Questionnaire (SRQ-29) dilakukan setiap bulan untuk memantau perkembangan dan kesehatan emosional Anda.
                      </p>
                    </div>

                    {/* Status Screening Bulan Ini Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs uppercase tracking-wider text-[#5A77DF] font-extrabold font-mono">
                            Periode: {indonesianMonths[new Date().getMonth()]} {new Date().getFullYear()}
                          </span>
                          {data.monthlyScreening?.isCompletedThisMonth ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-3xs font-extrabold bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30 uppercase">
                              <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /> Sudah Diisi Bulan Ini
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-3xs font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/30 uppercase animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-500" /> Belum Diisi Bulan Ini
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-zinc-800">
                          Evaluasi Kesehatan Mental Periodik
                        </h3>
                        <p className="text-xs text-zinc-600 max-w-2xl leading-relaxed">
                          {data.monthlyScreening?.isCompletedThisMonth
                            ? `Screening bulan ${indonesianMonths[new Date().getMonth()]} ${new Date().getFullYear()} telah Anda selesaikan. Anda dapat memperbarui screening kapan saja jika mengalami perubahan kondisi emosional.`
                            : `Anda belum menyelesaikan screening untuk bulan ${indonesianMonths[new Date().getMonth()]} ${new Date().getFullYear()}. Silakan isi 29 pertanyaan SRQ-29 untuk mengevaluasi status kesehatan mental Anda.`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenMonthlySrqModal}
                        className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-3 text-xs font-extrabold text-white shadow-md transition duration-200 shrink-0 cursor-pointer"
                      >
                        {data.monthlyScreening?.isCompletedThisMonth ? (
                          <span className="inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Ulangi / Update Screening Bulan Ini</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5 fill-current" /> Mulai Screening Bulanan (SRQ-29)</span>
                        )}
                      </button>
                    </div>

                    {/* Ringkasan Status Mental Saat Ini */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-5 rounded-2xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 space-y-2 text-left">
                        <span className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold">
                          Status Mental Terkini
                        </span>
                        <div className="text-base font-black text-[#3E53A2]">
                          {student.mental_level}
                        </div>
                        <p className="text-2xs text-zinc-600">
                          Status ini digunakan untuk menyesuaikan rekomendasi modul & pendampingan.
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 space-y-2 text-left">
                        <span className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold">
                          Indikator Pendampingan
                        </span>
                        <div>
                          {student.risk_flag ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Memerlukan Perhatian / Konsultasi BK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-extrabold bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30 uppercase">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#5A77DF] shrink-0" /> Stabil & Tanpa Alert Risiko
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-zinc-600">
                          Jika terindikasi risiko mental, Guru Konseling (BK) akan memberikan pendampingan personal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Riwayat Screening Bulanan */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-base font-bold text-zinc-900">
                        Riwayat Screening Bulanan
                      </h3>
                      <span className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                        Tersimpan di Database
                      </span>
                    </div>

                    {!data.monthlyScreening?.history || data.monthlyScreening.history.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-6 text-center">
                        Belum ada data riwayat screening bulanan yang tersimpan.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-200 text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-black">
                              <th className="py-3 px-4">Periode</th>
                              <th className="py-3 px-4">Tanggal Pengisian</th>
                              <th className="py-3 px-4">Hasil Status Mental</th>
                              <th className="py-3 px-4">Rekomendasi / Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                            {data.monthlyScreening.history.map((record) => (
                              <tr key={record.id} className="hover:bg-zinc-50 transition">
                                <td className="py-3.5 px-4 font-mono font-extrabold text-[#3E53A2]">
                                  {record.period}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-700 font-semibold">
                                  {new Date(record.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                  })}
                                </td>
                                <td className="py-3.5 px-4 font-extrabold text-zinc-900">
                                  {record.mental_level}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-600 text-2xs max-w-xs leading-relaxed">
                                  {record.recommendations || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MODUL (CONSOLIDATED WITH CLASS & SUBJECT IN SIDEBAR) */}
              {activeTab === "modul" && (() => {
                const availableClasses = studentAvailableClasses;
                const currentClassId = selectedModulClassId || student.class_id;

                // Filter subjects for selected class
                const classSubjects = subjects.filter((s) => s.class_id === currentClassId);
                const filteredSubjects = selectedModulSubjectId === "ALL"
                  ? classSubjects
                  : classSubjects.filter((s) => s.id === selectedModulSubjectId);

                const activeSubjObj = selectedModulSubjectId !== "ALL"
                  ? classSubjects.find((s) => s.id === selectedModulSubjectId)
                  : null;

                return (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top Header Card */}
                    <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                            Modul Pembelajaran Sekolah
                          </h2>
                          <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl mt-1 font-medium">
                            {availableClasses.length > 1
                              ? "Pilih tingkatan kelas dan mata pelajaran melalui menu sidebar sebelah kiri. Riwayat kelas terdahulu tetap tersimpan."
                              : "Pilih mata pelajaran melalui menu sidebar sebelah kiri untuk mulai membaca materi modul dan mengerjakan evaluasi."}
                          </p>
                        </div>
                        {(() => {
                          const activeClassObj = availableClasses.find(c => c.id === currentClassId);
                          const isCurrent = currentClassId === student.class_id;
                          return (
                            <div className="shrink-0 px-4 py-2 rounded-2xl bg-[#5A77DF]/10 border border-[#5A77DF]/30 text-left sm:text-right">
                              <span className="text-[10px] font-mono font-black text-[#5A77DF] uppercase tracking-wider block">
                                {activeSubjObj ? `Mapel: ${activeSubjObj.name}` : "Semua Mata Pelajaran"}
                              </span>
                              <span className="text-sm font-black text-[#3E53A2] flex items-center gap-1.5 mt-0.5">
                                <School className="w-4 h-4 shrink-0 text-[#3E53A2]" />
                                <span>{activeClassObj ? (activeClassObj.displayName || (activeClassObj.major ? `${activeClassObj.name} ${activeClassObj.major}` : activeClassObj.name)) : `Kelas ${currentClassId}`}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-[#5A77DF] text-white">
                                    Aktif
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {filteredSubjects.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border border-[#5A77DF]/20 bg-white shadow-sm">
                        <p className="text-xs text-zinc-500 italic">
                          {selectedModulSubjectId !== "ALL"
                            ? "Mata pelajaran yang dipilih tidak memiliki modul atau belum terdaftar."
                            : "Belum ada mata pelajaran terdaftar untuk kelas ini."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {filteredSubjects.map((sub) => (
                          <div key={sub.id} className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-5">
                            {/* Subject Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-black text-zinc-900">{sub.name}</h3>
                                  <span className="text-3xs px-3 py-1 rounded-full font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30">
                                    Level: {sub.level}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-600 mt-1 font-medium">
                                  Guru Pengampu: <strong className="text-zinc-800">{sub.teacher?.name || "Belum ditentukan"}</strong>
                                </p>
                              </div>

                              {/* Pretest CTA or Status */}
                              {!sub.hasPretest ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubjectPretest(sub)}
                                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition duration-200 shrink-0 cursor-pointer flex items-center gap-1.5"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Ikuti Pretest Mapel (10-15 Soal)</span>
                                </button>
                              ) : (
                                <span className="rounded-full bg-[#5A77DF]/10 border border-[#5A77DF]/30 px-3.5 py-1.5 text-3xs font-extrabold text-[#3E53A2] uppercase shrink-0 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /> Pretest Mapel Selesai ({sub.modules.length} Modul)
                                </span>
                              )}
                            </div>

                            {/* Subject Modules List */}
                            {!sub.hasPretest ? (
                              <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 text-center text-xs text-[#3E53A2] font-semibold space-y-1">
                                <p className="flex items-center justify-center gap-1.5">
                                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span>Selesaikan <strong className="text-[#5A77DF]">Pretest Penempatan Level</strong> untuk membuka materi modul mata pelajaran <strong className="text-zinc-900">{sub.name}</strong>.</span>
                                </p>
                              </div>
                            ) : sub.modules.length === 0 ? (
                              <p className="text-xs text-zinc-500 italic py-2">Belum ada modul yang disiapkan untuk level {sub.level}.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {sub.modules.map((mod) => {
                                  const isDone = completedModuleIds.includes(mod.id);
                                  const modProgress = getModuleProgress(mod.id);

                                  return (
                                    <div
                                      key={mod.id}
                                      className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 flex flex-col justify-between gap-4 hover:border-[#5A77DF] transition shadow-xs"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <h4 className="font-extrabold text-xs text-zinc-900 truncate">{mod.title}</h4>
                                          {isDone ? (
                                            <span className="text-[9px] font-extrabold text-[#3E53A2] bg-[#5A77DF]/10 border border-[#5A77DF]/30 px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1">
                                              <CheckCircle2 className="w-2.5 h-2.5 text-[#5A77DF]" /> Selesai
                                            </span>
                                          ) : modProgress > 0 ? (
                                            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1">
                                              <Zap className="w-2.5 h-2.5 text-amber-500" /> {modProgress}%
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-extrabold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full uppercase">
                                              0%
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-3xs text-zinc-600 line-clamp-2 leading-relaxed">{stripHtmlTags(mod.content)}</p>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="space-y-1">
                                        <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              isDone ? "bg-[#5A77DF]" : modProgress > 0 ? "bg-amber-400" : "bg-[#5A77DF] opacity-30"
                                            }`}
                                            style={{ width: `${modProgress}%` }}
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setActiveModuleId(mod.id)}
                                        className="w-full rounded-xl py-2.5 text-xs font-extrabold transition text-center cursor-pointer bg-[#5A77DF] hover:bg-[#3E53A2] text-white shadow-xs"
                                      >
                                        {isDone ? "Tinjau Modul" : modProgress > 0 ? "Lanjutkan Belajar" : "Pelajari Modul"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB NILAI: DATA NILAI SISWA (MOTHER MENU: KELAS, CHILD MENU: MAPEL) */}
              {activeTab === "nilai" && (
                <div className="space-y-6 animate-fadeIn text-left">
                  {/* Top Bar Header & Export / Print Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-3xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                          Transkrip & Evaluasi Hasil Belajar
                        </span>
                        <span className="rounded-md bg-[#5A77DF]/10 border border-[#5A77DF]/20 px-2 py-0.5 text-3xs font-extrabold text-[#3E53A2]">
                          {activeGradeClass?.displayName || student.class}
                        </span>
                        {selectedGradeSubjectId !== "ALL" && (
                          <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-3xs font-extrabold text-purple-700">
                            Mapel: {selectedGradeSubjectId}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                        Data Nilai & Evaluasi Siswa
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        Pantau seluruh riwayat pengerjaan kuis diagnostik (pretest) dan evaluasi modul (posttest) secara mandiri.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={handleExportStudentGradesCSV}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 transition cursor-pointer shadow-2xs"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>Export CSV / Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintStudentGrades}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2.5 text-xs font-extrabold text-zinc-700 transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-4 h-4 text-zinc-600" />
                        <span>Cetak Transkrip</span>
                      </button>
                    </div>
                  </div>

                  {/* METRIC OVERVIEW CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedGradeSubjectId === "ALL" ? (
                      <>
                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Total Mata Pelajaran
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-zinc-800 font-mono">
                            {subjectSummaries.length} <span className="text-xs font-normal text-zinc-400">Mapel</span>
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Rata-Rata Seluruh Mapel
                          </span>
                          <p className={`text-xl sm:text-2xl font-black font-mono ${
                            avgGradeScore >= 70 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {avgGradeScore}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Total Kuis Selesai
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                            {classGrades.length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Mapel Lulus (≥ 70)
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                            {subjectSummaries.filter((s) => s.grades.length > 0 && s.avgScore >= 70).length} <span className="text-xs font-normal text-zinc-400">Mapel</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Total Kuis Selesai
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-zinc-800 font-mono">
                            {filteredClassGrades.length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Rata-Rata Nilai Mapel
                          </span>
                          <p className={`text-xl sm:text-2xl font-black font-mono ${
                            avgGradeScore >= 70 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {avgGradeScore}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Kuis Pretest
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                            {filteredClassGrades.filter((g) => g.type === "Pretest").length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                          <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                            Kuis Posttest
                          </span>
                          <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                            {filteredClassGrades.filter((g) => g.type === "Posttest").length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* TABEL NILAI SISWA */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#5A77DF]" />
                        <h3 className="text-sm font-extrabold text-zinc-800">
                          {selectedGradeSubjectId === "ALL"
                            ? "Rekap Nilai Rata-Rata per Mata Pelajaran"
                            : `Transkrip Lembar Nilai - ${selectedGradeSubjectId}`}
                        </h3>
                        {selectedGradeSubjectId !== "ALL" && (
                          <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-[#5A77DF]/10 text-[#3E53A2]">
                            Mapel: {selectedGradeSubjectId}
                          </span>
                        )}
                      </div>

                      {selectedGradeSubjectId !== "ALL" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedGradeSubjectId("ALL")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF] text-[#3E53A2] hover:text-white text-xs font-bold transition cursor-pointer shadow-2xs self-start sm:self-auto"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          <span>Lihat Semua Nilai (Rata-Rata Mapel)</span>
                        </button>
                      ) : (
                        <span className="text-3xs text-zinc-400 font-mono hidden sm:block">
                          Menampilkan nilai rata-rata tiap mata pelajaran di kelas ini
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end mb-2">
                      <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          placeholder={
                            selectedGradeSubjectId === "ALL"
                              ? "Cari mata pelajaran atau nama guru..."
                              : "Cari judul kuis atau modul..."
                          }
                          value={gradeSearchQuery}
                          onChange={(e) => setGradeSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-[#5A77DF] transition shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 text-left text-xs whitespace-nowrap">
                          {selectedGradeSubjectId === "ALL" ? (
                            <>
                              <thead className="bg-[#f8faff] border-b border-zinc-200">
                                <tr>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center w-12">
                                    No
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Mata Pelajaran
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Guru Pengampu
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center">
                                    Evaluasi Selesai
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center">
                                    Nilai Rata-Rata
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center">
                                    Status
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center w-28">
                                    Aksi
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 bg-white">
                                {filteredSubjectSummaries.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-4 py-12 text-center text-xs text-zinc-400 italic"
                                    >
                                      Belum ada mata pelajaran atau riwayat evaluasi untuk {activeGradeClass?.displayName || "kelas ini"}.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredSubjectSummaries.map((subSummary, idx) => {
                                    const hasGrades = subSummary.grades.length > 0;
                                    const isPassed = subSummary.avgScore >= 70;

                                    return (
                                      <tr key={`summary-${subSummary.subjectName}`} className="hover:bg-[#5A77DF]/5 transition">
                                        <td className="px-4 py-3.5 text-center font-bold text-zinc-400 font-mono">
                                          {idx + 1}
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-zinc-900">
                                          <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-[#5A77DF] shrink-0" />
                                            <span>{subSummary.subjectName}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-zinc-600 font-medium text-xs">
                                          {subSummary.teacherName}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                          {hasGrades ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/20">
                                              <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" />
                                              {subSummary.grades.length} Kuis ({subSummary.pretestCount} Pretest, {subSummary.posttestCount} Posttest)
                                            </span>
                                          ) : (
                                            <span className="text-3xs text-zinc-400 italic font-medium">
                                              Belum ada evaluasi
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                          {hasGrades ? (
                                            <span
                                              className={`inline-block font-black text-xs font-mono px-3 py-1 rounded-lg border ${
                                                isPassed
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : "bg-rose-50 text-rose-700 border-rose-200"
                                              }`}
                                            >
                                              {subSummary.avgScore}
                                            </span>
                                          ) : (
                                            <span className="text-zinc-400 font-mono font-bold text-xs">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                          {hasGrades ? (
                                            <span
                                              className={`inline-block text-3xs font-extrabold px-2.5 py-0.5 rounded-md border ${
                                                isPassed
                                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                  : "bg-rose-50 text-rose-800 border-rose-200"
                                              }`}
                                            >
                                              {isPassed ? "Lulus" : "Tidak Lulus"}
                                            </span>
                                          ) : (
                                            <span className="text-3xs text-zinc-400 font-mono">Belum Diambil</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                          {hasGrades ? (
                                            <button
                                              type="button"
                                              onClick={() => setSelectedGradeSubjectId(subSummary.subjectName)}
                                              title="Lihat Rincian Nilai Mapel"
                                              className="p-1.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#5A77DF] transition cursor-pointer inline-flex items-center justify-center shadow-2xs group"
                                            >
                                              <Eye className="w-4 h-4 text-[#5A77DF] group-hover:scale-110 transition-transform" />
                                            </button>
                                          ) : (
                                            <span className="text-3xs text-zinc-400 font-mono">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              {filteredSubjectSummaries.length > 0 && (
                                <tfoot className="bg-[#f8faff] border-t-2 border-[#5A77DF]/30">
                                  <tr className="divide-x divide-zinc-150">
                                    <td colSpan={3} className="px-4 py-3.5" />
                                    <td
                                      className="px-4 py-3.5 text-center font-black uppercase tracking-wider text-xs text-zinc-700 font-mono"
                                    >
                                      Rata-Rata Seluruh Mapel:
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span
                                        className={`inline-block font-black text-xs font-mono px-3 py-1 rounded-lg border shadow-xs ${
                                          avgGradeScore >= 70
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : "bg-rose-100 text-rose-800 border-rose-300"
                                        }`}
                                      >
                                        {avgGradeScore}
                                      </span>
                                    </td>
                                    <td colSpan={2} className="px-4 py-3.5 text-zinc-400 text-3xs italic font-medium">
                                      (Dihitung dari {filteredSubjectSummaries.filter((s) => s.grades.length > 0).length} mapel dengan evaluasi)
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </>
                          ) : (
                            <>
                              <thead className="bg-[#f8faff] border-b border-zinc-200">
                                <tr>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center w-12">
                                    No
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Judul Kuis / Modul
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Mata Pelajaran
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Kelas & TA
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center">
                                    Tipe Kuis
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center">
                                    Nilai Akhir
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                    Tanggal Selesai
                                  </th>
                                  <th className="px-4 py-3.5 text-3xs font-black uppercase tracking-wider text-zinc-500 font-mono text-center w-20">
                                    Aksi
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 bg-white">
                                {filteredClassGrades.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={8}
                                      className="px-4 py-12 text-center text-xs text-zinc-400 italic"
                                    >
                                      Belum ada riwayat pengerjaan kuis untuk mata pelajaran "{selectedGradeSubjectId}".
                                    </td>
                                  </tr>
                                ) : (
                                  filteredClassGrades.map((grade, idx) => (
                                    <tr key={grade.id} className="hover:bg-[#5A77DF]/5 transition">
                                      <td className="px-4 py-3.5 text-center font-bold text-zinc-400 font-mono">
                                        {idx + 1}
                                      </td>
                                      <td className="px-4 py-3.5 font-bold text-zinc-900">
                                        {grade.title}
                                      </td>
                                      <td className="px-4 py-3.5 text-zinc-700 font-medium">
                                        {grade.subjectName}
                                      </td>
                                      <td className="px-4 py-3.5 text-zinc-600">
                                        <span className="font-bold text-zinc-800 text-xs">{grade.className}</span>
                                        <span className="block text-3xs text-zinc-400 font-mono mt-0.5">{grade.academicYear}</span>
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <span
                                          className={`rounded-md px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider border ${
                                            grade.type === "Pretest"
                                              ? "bg-purple-50 text-purple-700 border-purple-200"
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                          }`}
                                        >
                                          {grade.type}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <span
                                          className={`inline-block font-black text-xs font-mono px-2.5 py-0.5 rounded-lg border ${
                                            grade.score >= 70
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-rose-50 text-rose-700 border-rose-200"
                                          }`}
                                        >
                                          {grade.score}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5 text-zinc-500 font-mono text-2xs">
                                        {grade.completedAt || "-"}
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedStudentGradeDetail(grade);
                                            setShowStudentAnswersModal(true);
                                          }}
                                          title="Lihat Lembar Jawaban Kuis"
                                          className="p-1.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#5A77DF] transition cursor-pointer inline-flex items-center justify-center shadow-2xs group"
                                        >
                                          <Eye className="w-4 h-4 text-[#5A77DF] group-hover:scale-110 transition-transform" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              {filteredClassGrades.length > 0 && (
                                <tfoot className="bg-[#f8faff] border-t-2 border-[#5A77DF]/30">
                                  <tr className="divide-x divide-zinc-150">
                                    <td colSpan={4} className="px-4 py-3.5" />
                                    <td
                                      className="px-4 py-3.5 text-center font-black uppercase tracking-wider text-xs text-zinc-700 font-mono"
                                    >
                                      Rata-Rata Nilai Mapel:
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span
                                        className={`inline-block font-black text-xs font-mono px-3 py-1 rounded-lg border shadow-xs ${
                                          avgGradeScore >= 70
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : "bg-rose-100 text-rose-800 border-rose-300"
                                        }`}
                                      >
                                        {avgGradeScore}
                                      </span>
                                    </td>
                                    <td colSpan={2} className="px-4 py-3.5 text-zinc-400 text-3xs italic font-medium">
                                      (Dihitung dari {filteredClassGrades.length} kuis)
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: JURNAL */}
              {activeTab === "jurnal" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Jurnal Refleksi Harian</h2>
                    <p className="text-2xs text-zinc-500 font-medium">Pilih tanggal pada kalender di bawah ini untuk mengisi jurnal refleksi harian atau melihat riwayat jurnal.</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-6 shadow-sm space-y-4 w-full">
                    {/* Month Header Navigation */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-800">
                        {indonesianMonths[currentMonth]} {currentYear}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentMonth === 0) {
                              setCurrentMonth(11);
                              setCurrentYear(currentYear - 1);
                            } else {
                              setCurrentMonth(currentMonth - 1);
                            }
                          }}
                          className="text-3xs sm:text-2xs font-extrabold px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-slate-50 text-zinc-700 transition cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sebelumnya</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentMonth === 11) {
                              setCurrentMonth(0);
                              setCurrentYear(currentYear + 1);
                            } else {
                              setCurrentMonth(currentMonth + 1);
                            }
                          }}
                          className="text-3xs sm:text-2xs font-extrabold px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-slate-50 text-zinc-700 transition cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span className="hidden sm:inline">Berikutnya</span> <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Day of Week Header */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2.5 text-center text-3xs sm:text-xs font-black uppercase text-zinc-400 mb-1">
                      <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2.5 w-full">
                      {(() => {
                        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
                        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const daysList = [];

                        // Empty cells before 1st of month (transparent without border)
                        for (let i = 0; i < firstDayIndex; i++) {
                          daysList.push(
                            <div key={`empty-${i}`} className="aspect-square max-h-20 sm:max-h-24 md:max-h-28 bg-transparent" />
                          );
                        }

                        // Calendar Day Cells
                        for (let day = 1; day <= totalDays; day++) {
                          const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const cellDateReset = new Date(currentYear, currentMonth, day).setHours(0,0,0,0);
                          const todayReset = new Date().setHours(0,0,0,0);
                          const isFuture = cellDateReset > todayReset;

                          const journal = (journals || []).find((j: any) => {
                            return formatLocalDate(j.logged_at) === dateString;
                          });

                          const moodEmoji = journal ? MOOD_EMOJIS.find(m => m.score === journal.mood_score) : null;
                          
                          daysList.push(
                            <button
                              key={`day-${day}`}
                              type="button"
                              disabled={isFuture && !journal}
                              onClick={() => {
                                if (journal) {
                                  setSelectedDetailJournal(journal);
                                  setShowDetailModal(true);
                                } else {
                                  setSelectedFillDate(dateString);
                                  setMoodScore(3);
                                  setJournalNotes("");
                                  setJournalActivities("");
                                  setJournalMessage(null);
                                  setShowFillModal(true);
                                }
                              }}
                              className={`aspect-square max-h-20 sm:max-h-24 md:max-h-28 p-1 sm:p-2 border rounded-xl sm:rounded-2xl flex flex-col items-center transition-all cursor-pointer text-center relative group overflow-hidden w-full ${
                                journal
                                  ? "bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 border-2 border-[#5A77DF]/50 shadow-xs"
                                  : isFuture
                                    ? "bg-slate-50/60 opacity-40 cursor-not-allowed border-zinc-200/40"
                                    : "bg-white hover:bg-slate-50 hover:border-[#5A77DF]/50 border-zinc-200 shadow-2xs"
                              }`}
                            >
                              <span className={`text-2xs sm:text-sm font-black leading-none pt-0.5 sm:pt-1 ${journal ? "text-[#3E53A2]" : isFuture ? "text-zinc-400" : "text-zinc-800"}`}>
                                {day}
                              </span>
                              
                              <div className="flex-1 w-full flex items-center justify-center -mt-1 sm:-mt-2">
                                {journal && moodEmoji ? (
                                  <div className="transform group-hover:scale-110 transition duration-200 flex items-center justify-center scale-75 sm:scale-115 md:scale-130" title={moodEmoji.label}>
                                    {moodEmoji.icon}
                                  </div>
                                ) : null}
                              </div>
                            </button>
                          );
                        }
                        return daysList;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BADGE */}
              {activeTab === "badge" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-[#5A77DF]" />
                      <h2 className="text-xl font-black text-zinc-900 tracking-tight">Koleksi Lencana Gamifikasi</h2>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Selesaikan modul pembelajaran & pretest untuk meraih lencana penghargaan baru!
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
                              ? "border-[#5A77DF]/30 bg-white shadow-sm"
                              : "border-zinc-200 bg-zinc-50/50 opacity-50 grayscale"
                          }`}
                        >
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-xs overflow-hidden ${
                            isUnlocked
                              ? "bg-[#5A77DF]/10 border-[#5A77DF]/30 text-[#5A77DF]"
                              : "bg-zinc-100 border-zinc-200 text-zinc-400"
                          }`}>
                            {badge.image_url?.startsWith("/") || badge.image_url?.startsWith("http") ? (
                              <img src={badge.image_url} alt={badge.name} className="h-full w-full object-cover p-1" />
                            ) : badge.image_url ? (
                              <span className="text-2xl">{badge.image_url}</span>
                            ) : (
                              <Award className="h-7 w-7" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-zinc-900">{badge.name}</h3>
                            <p className="text-3xs text-zinc-600 mt-1 leading-relaxed px-1 font-medium">{badge.description}</p>
                          </div>
                          <span className={`text-3xs px-3 py-1 rounded-full font-extrabold uppercase border ${
                            isUnlocked
                              ? "bg-[#5A77DF]/10 text-[#3E53A2] border-[#5A77DF]/30"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200"
                          }`}>
                            {isUnlocked ? (
                              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /> Terbuka</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-zinc-400" /> Terkunci</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: PROFIL */}
              {activeTab === "profil" && (
                <div className="w-full rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <User className="h-6 w-6 text-[#5A77DF]" />
                      <h2 className="text-xl font-black text-zinc-900 tracking-tight">Profil</h2>
                    </div>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 px-4 py-2 text-xs font-extrabold text-[#3E53A2] hover:bg-[#5A77DF]/20 transition cursor-pointer"
                      >
                        Edit Profil
                      </button>
                    )}
                  </div>

                  {profileMessage && (
                    <div
                      className={`p-4 rounded-xl text-xs font-semibold ${
                        profileMessage.includes("berhasil")
                          ? "bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30"
                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}
                    >
                      {profileMessage}
                    </div>
                  )}

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
                      <div className="space-y-3 flex flex-col items-center">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono self-start">
                          Foto Profil
                        </label>
                        <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-[#5A77DF]/30 bg-[#5A77DF]/10 flex items-center justify-center text-5xl select-none shadow-sm">
                          {editAvatar ? (
                            editAvatar.startsWith("data:") || editAvatar.startsWith("http") ? (
                              <img src={editAvatar} alt="Edit Avatar" className="h-full w-full object-cover" />
                            ) : (
                              editAvatar
                            )
                          ) : (
                            <span className="text-[#5A77DF] font-black text-2xl">{editName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center pt-2">
                          <label className="rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 px-3.5 py-2 text-3xs font-extrabold text-[#3E53A2] transition cursor-pointer flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5" /> Unggah Foto
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          </label>
                          {editAvatar && (
                            <button
                              type="button"
                              onClick={() => setEditAvatar("")}
                              className="rounded-xl border border-rose-500/20 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-3xs font-extrabold text-rose-600 transition cursor-pointer flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5" /> Hapus
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Username
                          </label>
                          <input
                            type="text"
                            required
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono flex items-center justify-between">
                            <span>Tingkatan Kelas</span>
                          </label>
                          <select
                            value={editClassId}
                            onChange={(e) => setEditClassId(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold cursor-pointer shadow-xs"
                          >
                            {data?.allClasses?.map((cls: any) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.displayName || `${cls.name} ${cls.major ? `(${cls.major}) ` : ""}• ${cls.academicYear || (cls.academic_year ? `TA ${cls.academic_year}` : "TA 2025/2026")}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Ubah Password (Opsional) */}
                      <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-[#5A77DF]" />
                          <span className="text-xs font-extrabold text-zinc-900">Ubah Password (Opsional)</span>
                        </div>
                        <p className="text-3xs text-zinc-500">Kosongkan jika tidak ingin mengubah password saat ini.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              Password Baru
                            </label>
                            <div className="relative">
                              <input
                                type={showProfileNewPass ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowProfileNewPass(!showProfileNewPass)}
                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold cursor-pointer"
                              >
                                {showProfileNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                              <input
                                type={showProfileConfirmPass ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password baru"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowProfileConfirmPass(!showProfileConfirmPass)}
                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold cursor-pointer"
                              >
                                {showProfileConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-3 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 text-xs font-extrabold hover:bg-zinc-200 transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] text-white text-xs font-extrabold shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                        >
                          {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-2xl border border-zinc-150">
                        <div className="relative h-24 w-24 rounded-full p-[3px] bg-gradient-to-tr from-[#5A77DF] via-[#7B93EC] to-purple-500 shadow-md mb-3">
                          <div className="h-full w-full rounded-full overflow-hidden bg-white flex items-center justify-center select-none">
                            {student.avatar ? (
                              student.avatar.startsWith("data:") || student.avatar.startsWith("http") ? (
                                <img src={student.avatar} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                student.avatar
                              )
                            ) : (
                              <span className="text-[#5A77DF] font-black text-2xl">{student.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-base font-black text-zinc-900">{student.name}</h3>
                          <p className="text-2xs text-[#5A77DF] font-bold mt-0.5">@{student.username}</p>
                          <p className="text-2xs text-zinc-500 font-mono mt-0.5 font-medium">Siswa • NIS: {student.nis}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                        <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5">
                          <div className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold mb-1">
                            Kelas & Tahun Ajaran
                          </div>
                          <div className="font-extrabold text-zinc-900">
                            {student.class_name || student.class} {student.class_major ? `(${student.class_major})` : ""} {student.academicYear ? `• ${student.academicYear}` : ""}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5">
                          <div className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold mb-1">
                            Hasil SRQ-29 Status Mental
                          </div>
                          <div className="font-extrabold text-[#3E53A2] uppercase">{student.mental_level}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5">
                          <div className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold mb-1">
                            NIS & Username
                          </div>
                          <div className="font-extrabold text-zinc-900">
                            NIS: {student.nis} • @{student.username}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5">
                          <div className="text-3xs uppercase tracking-wider text-[#5A77DF] font-mono font-extrabold mb-1">
                            Status Akun
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-block text-2xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                              Aktif & Terverifikasi
                            </span>
                            <span className="text-3xs text-zinc-400 font-mono">
                              {student.email || ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full py-3.5 rounded-xl border border-rose-500/30 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <LogOut className="h-4 w-4" /> Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: CHAT BK */}
              {activeTab === "chat_bk" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Top Header Card */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-[#5A77DF]" />
                      <h2 className="text-xl font-black text-zinc-900 tracking-tight">Konsultasi Bimbingan Konseling (BK)</h2>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Diskusikan kondisi kesehatan mental atau masalah akademik Anda secara aman bersama Guru BK sekolah.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[1fr_2.5fr]">
                    {/* Left Contact Sidebar Card */}
                    <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm h-fit space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Guru BK Aktif
                      </h3>
                      {bkTeachers.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic py-2">Tidak ada guru BK terdaftar.</p>
                      ) : (
                        <div className="space-y-2">
                          {bkTeachers.map((teacher: any) => (
                            <button
                              key={teacher.id}
                              onClick={() => setActiveTeacherId(teacher.id)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center gap-2.5 cursor-pointer ${
                                activeTeacherId === teacher.id
                                  ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] font-extrabold shadow-2xs"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-[#5A77DF]/50 hover:bg-zinc-50 font-medium"
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-[#5A77DF]/10 text-[#5A77DF] flex items-center justify-center shrink-0 font-bold">
                                <GraduationCap className="h-4 w-4 text-[#5A77DF]" />
                              </div>
                              <div className="flex flex-col text-left truncate">
                                <span className="truncate font-bold">{teacher.name}</span>
                                <span className="text-[10px] text-zinc-500 font-medium truncate">
                                  {teacher.class?.name ? `Guru BK ${teacher.class.name}` : "Guru BK Pembimbing"}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Main Chat Card */}
                    <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm flex flex-col h-[480px]">
                      {activeTeacherId ? (
                        <>
                          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                            {loadingChat ? (
                              <div className="text-center text-xs text-zinc-500 mt-12 font-medium">Memuat pesan...</div>
                            ) : chatMessages.length === 0 ? (
                              <div className="text-center text-xs text-zinc-500 mt-12 italic">Belum ada percakapan. Kirim pesan pertama Anda di bawah!</div>
                            ) : (
                              chatMessages.map((msg) => {
                                const isSelf = msg.sender === "student";
                                return (
                                  <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                                    <span className="text-3xs font-extrabold text-zinc-500 mb-1">{isSelf ? "Anda" : "Guru BK"}</span>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${isSelf ? "bg-[#5A77DF] text-white rounded-tr-none shadow-xs" : "bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-tl-none"}`}>
                                      {msg.message}
                                    </div>
                                    <span className="text-[9px] text-zinc-500 mt-1 font-mono">{new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-zinc-100">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ketik pesan konsultasi..."
                              className="flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] focus:bg-white font-medium"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
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
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: ISI JURNAL */}
      {showFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => { setShowFillModal(false); setJournalMessage(null); }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
              <PenTool className="h-5 w-5 text-[#5A77DF]" />
              <h3 className="text-base font-black text-zinc-900">Isi Jurnal Refleksi Harian</h3>
            </div>

            <form onSubmit={handleSubmitJournal} className="space-y-4">
              {journalMessage && (
                <div className={`p-4 rounded-xl text-xs font-semibold ${journalMessage.includes("berhasil") ? "bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                  {journalMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Tanggal Jurnal</label>
                <input
                  type="date"
                  value={selectedFillDate}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Bagaimana Perasaanmu?</label>
                <div className="flex items-center justify-between gap-2 py-2">
                  {MOOD_EMOJIS.map((emoji) => (
                    <button
                      key={emoji.score}
                      type="button"
                      onClick={() => setMoodScore(emoji.score)}
                      className={`flex-1 rounded-2xl border py-3 px-1 flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                        moodScore === emoji.score 
                          ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] font-black shadow-xs scale-105" 
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-[#5A77DF]/40 hover:bg-zinc-50"
                      }`}
                    >
                      {emoji.icon}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">{emoji.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Screen Time Hari Ini</label>
                <select
                  value={journalActivities}
                  onChange={(e) => setJournalActivities(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-800 outline-none"
                >
                  <option value="">Pilih durasi screen time</option>
                  <option value="< 1 jam">Kurang dari 1 jam</option>
                  <option value="1-2 jam">1 - 2 jam</option>
                  <option value="2-4 jam">2 - 4 jam</option>
                  <option value="4-6 jam">4 - 6 jam</option>
                  <option value="> 6 jam">Lebih dari 6 jam</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Catatan Refleksi</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan refleksimu hari ini..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-800 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingJournal}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] py-3 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submittingJournal ? "Menyimpan..." : "Simpan Jurnal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PRETEST PENEMPATAN LEVEL MAPEL */}
      {showSubjectPretestModal && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 animate-fadeIn">
          <div className="w-full max-w-5xl rounded-3xl border border-zinc-200/80 bg-slate-50 p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-zinc-900 space-y-4">
            <button
              type="button"
              onClick={() => setShowSubjectPretestModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition cursor-pointer z-10"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingSubjectQuiz ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-sm">
                <div className="h-10 w-10 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">Menyiapkan Lembar Soal Pretest Mapel...</p>
              </div>
            ) : subjectPretestResult ? (
              <div className="py-8 text-center space-y-5 bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-10 shadow-sm animate-fadeIn">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold shadow-xs">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Hasil Pretest Penempatan</h3>
                  <div className="text-3xl font-black text-[#5A77DF]">
                    Level: {subjectPretestResult.subjectLevel} (Nilai: {subjectPretestResult.score})
                  </div>
                </div>
                <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed font-medium">
                  {subjectPretestResult.summaryText}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSubjectPretestModal(false)}
                  className="w-full max-w-xs rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-extrabold text-white shadow-md transition cursor-pointer"
                >
                  Buka Modul Belajar
                </button>
              </div>
            ) : subjectQuiz && subjectQuiz.questions ? (
              /* Quiz Content Container */
              (() => {
                const totalQ = subjectQuiz.questions.length;
                const answeredCnt = Object.keys(subjectAnswers).length;
                const pct = Math.round((answeredCnt / (totalQ || 1)) * 100);
                const currentQ = subjectQuiz.questions[subjectPretestIndex];

                return (
                  <div className="space-y-4">
                    {/* Header Title Card */}
                    <div className="shrink-0 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-4 md:p-5 shadow-sm space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src="/quiz-illustration.png"
                            alt="DigiMind Quiz Illustration"
                            className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0 drop-shadow-md"
                          />
                          <div className="space-y-1">
                            <span className="inline-flex items-center text-3xs font-black uppercase tracking-widest text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-full border border-[#5A77DF]/20 font-mono">
                              Pretest Penempatan Level
                            </span>
                            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-900 uppercase">
                              Mata Pelajaran: {activeSubject.name}
                            </h1>
                          </div>
                        </div>
                        <div className="text-2xs sm:text-xs text-zinc-700 max-w-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                          <strong className="text-zinc-900 font-extrabold">Petunjuk:</strong> Jawablah pertanyaan pretest ini dengan jujur untuk menentukan level materi penempatan belajar Anda.
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1 flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-[#5A77DF]/15 border border-[#5A77DF]/25 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-zinc-600 font-mono">{pct}% ({answeredCnt}/{totalQ})</span>
                      </div>
                    </div>

                    {/* 5:7 Ratio Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
                      {/* Left Quiz Card (5 Cols) */}
                      <div className="md:col-span-5 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4">
                        {currentQ && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <span className="text-xs md:text-sm font-black text-[#5A77DF] uppercase tracking-wider font-mono block">
                                PERTANYAAN {subjectPretestIndex + 1} DARI {totalQ}
                              </span>
                              <h2 className="text-base sm:text-lg font-black leading-relaxed text-zinc-900">
                                {currentQ.question}
                              </h2>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-2.5 pt-1">
                              {currentQ.options.map((opt: any) => {
                                const isSelected = subjectAnswers[currentQ.id] === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSubjectAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-2xs ${
                                      isSelected
                                        ? "border-2 border-[#5A77DF] bg-indigo-50/70 text-[#3E53A2] shadow-md shadow-indigo-100 font-black"
                                        : "border-zinc-200 bg-white text-zinc-700 hover:border-[#5A77DF] hover:bg-slate-50 hover:text-zinc-900"
                                    }`}
                                  >
                                    <span className="text-xs sm:text-sm font-black tracking-wide text-left">{opt.option_text}</span>
                                    <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all shrink-0 ${
                                      isSelected
                                        ? "border-[#5A77DF] bg-[#5A77DF] text-white"
                                        : "border-zinc-300 text-transparent"
                                    }`}>
                                      ✓
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="mt-4 flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setSubjectPretestIndex((prev) => Math.max(0, prev - 1))}
                            disabled={subjectPretestIndex === 0}
                            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 shadow-2xs cursor-pointer"
                          >
                            Sebelumnya
                          </button>

                          {subjectPretestIndex === totalQ - 1 ? (
                            <button
                              type="button"
                              onClick={handleSubmitSubjectPretest}
                              disabled={submittingSubjectPretest}
                              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-200 transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                            >
                              {submittingSubjectPretest ? "Mengirim..." : "Kirim Pretest"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSubjectPretestIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                              className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer"
                            >
                              Selanjutnya
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Navigator Sidebar (7 Cols) */}
                      <div className="md:col-span-7 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="space-y-3">
                          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 shrink-0 font-mono flex items-center justify-between">
                            <span>Daftar Soal Pretest</span>
                            <span className="text-3xs font-extrabold text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-lg border border-[#5A77DF]/20">
                              {answeredCnt}/{totalQ} DIJAWAB
                            </span>
                          </h2>

                          {/* Number Grid */}
                          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-2 sm:gap-2.5">
                            {subjectQuiz.questions.map((q: any, idx: number) => {
                              const isAnswered = !!subjectAnswers[q.id];
                              const isActive = subjectPretestIndex === idx;

                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => setSubjectPretestIndex(idx)}
                                  className={`flex flex-col items-center justify-center rounded-xl py-2.5 sm:py-3 px-1.5 text-center border transition-all cursor-pointer h-full min-h-[50px] ${
                                    isActive
                                      ? "border-2 border-[#3E53A2] bg-[#5A77DF] text-white font-black shadow-md shadow-indigo-200 ring-2 ring-[#5A77DF]/40 scale-[1.02]"
                                      : isAnswered
                                      ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-900 font-black shadow-2xs hover:bg-emerald-100"
                                      : "border-zinc-200 bg-slate-50 text-zinc-700 hover:border-zinc-300 hover:bg-slate-100 font-bold"
                                  }`}
                                >
                                  <span className={`text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-widest font-mono ${isActive ? "text-white/80" : isAnswered ? "text-emerald-700" : "text-zinc-400"}`}>
                                    SOAL
                                  </span>
                                  <span className="text-sm sm:text-base font-black mt-0.5 leading-none">{idx + 1}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Legend Footer */}
                        <div className="mt-2 shrink-0 flex flex-wrap items-center justify-between gap-3 text-2xs text-zinc-600 leading-normal pt-2 font-extrabold">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
                            <span className="text-emerald-700">Sudah dijawab</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#5A77DF] border border-[#3E53A2]" />
                            <span className="text-[#5A77DF]">Sedang aktif</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 border border-zinc-300" />
                            <span className="text-zinc-500">Belum dijawab</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        </div>
      )}

      {/* POPUP MODAL: SCREENING BULANAN SRQ-29 */}
      {showMonthlySrqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-zinc-900 space-y-6">
            <button
              type="button"
              onClick={() => setShowMonthlySrqModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-150 pb-4">
              <span className="text-3xs uppercase tracking-widest text-[#5A77DF] font-black font-mono">
                Screening Bulanan SRQ-29
              </span>
              <h2 className="text-xl font-black text-zinc-900 mt-1">
                Kuesioner Evaluasi Kesehatan Mental
              </h2>
            </div>

            {loadingMonthlySrq ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-10 w-10 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">Menyiapkan Kuesioner SRQ-29...</p>
              </div>
            ) : monthlySrqResult ? (
              <div className="py-6 text-center space-y-5 animate-fadeIn">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold shadow-xs">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hasil Screening Bulanan Berhasil Disimpan</h3>
                  <div className="text-2xl font-black text-[#5A77DF]">
                    Status: {monthlySrqResult.mentalLevel}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed font-medium">
                  {monthlySrqResult.summaryText}
                </p>
                <button
                  type="button"
                  onClick={() => setShowMonthlySrqModal(false)}
                  className="w-full max-w-xs rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-extrabold text-white shadow-md transition cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : monthlySrqQuiz && monthlySrqQuiz.questions ? (
              <div className="space-y-6">
                {/* Navigator Header */}
                <div className="flex items-center justify-between text-xs text-zinc-500 font-bold font-mono border-b border-zinc-150 pb-3">
                  <span>Soal {monthlySrqIndex + 1} dari {monthlySrqQuiz.questions.length}</span>
                  <span className="text-[#5A77DF] font-extrabold">
                    {Object.keys(monthlySrqAnswers).length}/{monthlySrqQuiz.questions.length} Terjawab
                  </span>
                </div>

                {/* Current Question */}
                {(() => {
                  const q = monthlySrqQuiz.questions[monthlySrqIndex];
                  if (!q) return null;

                  return (
                    <div className="space-y-4 text-left">
                      <p className="text-sm font-bold leading-relaxed text-zinc-900">
                        {monthlySrqIndex + 1}. {q.question.replace(/^No\.?\s*\d+[\.\:\)]\s*/i, "")}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt: any) => {
                          const isSelected = monthlySrqAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setMonthlySrqAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                              className={`w-full text-center rounded-xl border py-4 text-xs font-extrabold transition cursor-pointer ${
                                isSelected
                                  ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] shadow-2xs font-extrabold"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-[#5A77DF]/40 hover:bg-zinc-50"
                              }`}
                            >
                              {opt.option_text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Bar */}
                <div className="flex items-center justify-between border-t border-zinc-150 pt-5">
                  <button
                    type="button"
                    onClick={() => setMonthlySrqIndex((prev) => Math.max(0, prev - 1))}
                    disabled={monthlySrqIndex === 0}
                    className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-700 disabled:opacity-30 cursor-pointer shadow-2xs"
                  >
                    Sebelumnya
                  </button>

                  {monthlySrqIndex === monthlySrqQuiz.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleSubmitMonthlySrq}
                      disabled={submittingMonthlySrq}
                      className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-7 py-2.5 text-xs font-extrabold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {submittingMonthlySrq ? "Mengirim..." : "Kirim Hasil Screening"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMonthlySrqIndex((prev) => Math.min(monthlySrqQuiz.questions.length - 1, prev + 1))}
                      className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-7 py-2.5 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic text-center">Soal screening belum tersedia.</p>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: DETAIL JURNAL (READ-ONLY) */}
      {showDetailModal && selectedDetailJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowDetailModal(false);
                setSelectedDetailJournal(null);
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-4">
              <BookOpen className="h-5 w-5 text-[#5A77DF]" />
              <div>
                <h3 className="text-base font-black text-zinc-900">Hasil Jurnal Refleksi Harian</h3>
                <p className="text-xs text-zinc-600 font-mono font-bold mt-0.5">
                  Tanggal: {new Date(selectedDetailJournal.logged_at).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Mood Indicator */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                <span className="text-3xs uppercase tracking-wider text-[#5A77DF] font-black font-mono">
                  Suasana Hati (Mood)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  {(() => {
                    const mood = MOOD_EMOJIS.find(m => m.score === selectedDetailJournal.mood_score);
                    return (
                      <>
                        <div className="p-2 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                          {mood?.icon || <Meh className="w-7 h-7 text-[#5A77DF]" />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-zinc-900">{mood?.label || "Biasa"}</p>
                          <p className="text-2xs text-zinc-600 font-bold">Skor Mood: {selectedDetailJournal.mood_score}/5</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Screen Time / Activity */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-1.5">
                <span className="text-3xs uppercase tracking-wider text-[#5A77DF] font-black font-mono">
                  Durasi Screen Time / Aktivitas
                </span>
                <p className="font-extrabold text-zinc-900">
                  {selectedDetailJournal.activities || selectedDetailJournal.screen_time || "-"}
                </p>
              </div>

              {/* Reflection Notes */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-1.5">
                <span className="text-3xs uppercase tracking-wider text-[#5A77DF] font-black font-mono">
                  Catatan Refleksi Siswa
                </span>
                <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedDetailJournal.notes || "-"}
                </p>
              </div>

              {/* AI Feedback / Response */}
              <div className="p-4.5 rounded-2xl border border-[#5A77DF]/30 bg-[#5A77DF]/5 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#5A77DF]" />
                  <span className="text-3xs uppercase tracking-wider text-[#3E53A2] font-black font-mono">
                    Tanggapan & Analisis AI DigiMind
                  </span>
                </div>
                <p className="text-zinc-900 text-xs leading-relaxed italic bg-white p-3.5 rounded-xl border border-[#5A77DF]/20 font-medium">
                  &quot;{selectedDetailJournal.ai_feedback || selectedDetailJournal.aiFeedback || "Terima kasih telah mencatat jurnal refleksi harianmu. Pertahankan kesadaran diri dan pola hidup sehat!"}&quot;
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDetailJournal(null);
                }}
                className="w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
              >
                Tutup Detail Jurnal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-Up Lembar Jawaban Siswa Modal */}
      {showStudentAnswersModal && selectedStudentGradeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl overflow-y-auto custom-scrollbar space-y-5 text-left text-zinc-900">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                    Lembar Jawaban Kuis
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-3xs font-black uppercase tracking-wider border ${
                      selectedStudentGradeDetail.type === "Pretest"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {selectedStudentGradeDetail.type}
                  </span>
                </div>
                <h3 className="text-lg font-black text-zinc-900">
                  {selectedStudentGradeDetail.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-2xs text-zinc-500 font-mono mt-1">
                  <span>Siswa: <strong className="text-zinc-700">{student.name}</strong></span>
                  <span>•</span>
                  <span>Kelas: <strong className="text-zinc-700">{selectedStudentGradeDetail.className}</strong></span>
                  <span>•</span>
                  <span>Mapel: <strong className="text-zinc-700">{selectedStudentGradeDetail.subjectName}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStudentAnswersModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Summary Banner */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <p className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
                  Mata Pelajaran
                </p>
                <p className="text-sm font-extrabold text-zinc-800 mt-0.5">
                  {selectedStudentGradeDetail.subjectName}
                </p>
                <p className="text-3xs text-zinc-500 font-mono mt-0.5">
                  Diselesaikan: {selectedStudentGradeDetail.completedAt || "-"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
                  Skor Perolehan
                </p>
                <span
                  className={`inline-block text-xl font-black font-mono mt-0.5 ${
                    selectedStudentGradeDetail.score >= 70 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {selectedStudentGradeDetail.score}
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider font-mono">
                Rincian Jawaban Soal ({selectedStudentGradeDetail.answers?.length || 0} Soal)
              </h4>

              {(!selectedStudentGradeDetail.answers || selectedStudentGradeDetail.answers.length === 0) ? (
                <div className="p-6 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-xl border border-zinc-200">
                  Tidak ada rincian jawaban tersimpan untuk kuis ini.
                </div>
              ) : (
                selectedStudentGradeDetail.answers.map((ans, qIdx) => (
                  <div
                    key={ans.id || qIdx}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                      ans.isCorrect
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-rose-50/40 border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-extrabold text-zinc-900 leading-relaxed flex-1">
                        <span className="font-mono text-zinc-500 mr-1.5">{qIdx + 1}.</span>
                        {ans.question}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider border ${
                          ans.isCorrect
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {ans.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Benar</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Salah</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-2xs">
                      <div
                        className={`p-2 rounded-lg border font-semibold ${
                          ans.isCorrect
                            ? "bg-emerald-100/60 border-emerald-200 text-emerald-900"
                            : "bg-rose-100/60 border-rose-200 text-rose-900"
                        }`}
                      >
                        <span className="font-mono font-bold uppercase mr-1">Jawaban Kamu:</span>{" "}
                        {ans.selectedOption || "(Tidak Dijawab)"}
                      </div>

                      {!ans.isCorrect && ans.correctOption && (
                        <div className="p-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold">
                          <span className="font-mono font-bold uppercase mr-1">Kunci Jawaban Benar:</span>{" "}
                          {ans.correctOption}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-zinc-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentAnswersModal(false)}
                className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white transition cursor-pointer shadow-xs"
              >
                Tutup Lembar Jawaban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
