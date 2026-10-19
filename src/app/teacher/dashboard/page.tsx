"use client";

import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Home,
  Users,
  Sparkles,
  MessageSquare,
  BookOpen,
  Award,
  User,
  School,
  Plus,
  PlusCircle,
  BarChart3,
  Edit3,
  Trash2,
  ClipboardList,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Search,
  Check,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Bell,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Key,
  Upload,
  ImageIcon,
  Target,
  XCircle,
  HelpCircle,
  Download,
  Printer,
  Calendar,
} from "lucide-react";

type QuizAnswerDetail = {
  id: number;
  question: string;
  selectedOption: string;
  isCorrect: boolean;
  correctOption?: string | null;
};

type QuizAttemptSummary = {
  id: number;
  quizId: number;
  title: string;
  moduleId?: number;
  moduleTitle?: string;
  subjectId?: number;
  subjectName?: string;
  className?: string;
  classYear?: string;
  academicYear?: string;
  score: number;
  completedAt: string;
  answers: QuizAnswerDetail[];
};

type ModuleProgressItem = {
  moduleId: number;
  moduleTitle: string;
  subjectId?: number;
  subjectName?: string;
  progress: number;
  isCompleted: boolean;
};

type Student = {
  id: number;
  nis: string;
  name: string;
  classId?: number;
  className: string;
  classMajor?: string;
  classYear?: string;
  academicYear?: string;
  isCurrentClass?: boolean;
  isPastStudent?: boolean;
  levelName?: string;
  literacyProgress: number;
  mentalHealthProgress: number;
  subjectProgress: number;
  mentalStatus: string;
  screenTime: number;
  moodScore: number;
  latestMood?: number | null;
  averageMood?: number;
  modulesCompleted: number;
  riskFlag: boolean;
  riskReason: string;
  latestJournal: {
    moodScore: number;
    activities: string | null;
    aiFeedback: string | null;
  } | null;
  pretests?: QuizAttemptSummary[];
  posttests?: QuizAttemptSummary[];
  moduleProgressesList?: ModuleProgressItem[];
};

type Intervention = {
  id: number;
  studentName: string;
  note: string;
  status: string;
  updatedAt: string;
};

type TeacherSubjectInfo = {
  id: number;
  name: string;
  classId: number;
  className: string;
  classMajor: string;
  classYear?: string;
  displayName?: string;
  assignedTeacher?: {
    id: number;
    name: string;
    nip?: string;
    specialization?: string;
    position?: string;
    phone_number?: string;
    email?: string;
  } | null;
};

type TeacherClassInfo = {
  id: number;
  name: string;
  major: string;
  year?: string;
  academicYear?: string;
  displayName?: string;
};

type TeacherDashboardData = {
  success: boolean;
  teacher: {
    id: number;
    name: string;
    nip: string;
    specialization: string;
    position: string;
    phone_number?: string;
    type: string;
    class_id?: number | null;
    assignedClass?: TeacherClassInfo | null;
    subjects?: TeacherSubjectInfo[];
    classes?: TeacherClassInfo[];
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
  { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
  { id: "siswa", label: "Siswa", icon: <Users className="w-4 h-4" /> },
  { id: "insight", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
  {
    id: "intervensi",
    label: "Intervensi",
    icon: <MessageSquare className="w-4 h-4" />,
  },
] as const;

type ActiveView =
  | "home"
  | "siswa"
  | "nilai"
  | "guru_pengampu"
  | "insight"
  | "intervensi"
  | "mapel"
  | "badge"
  | "profil";

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
  // Sub-navigation filter states for Siswa tab and Mapel tab
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("ALL");
  const [selectedMapelFilterId, setSelectedMapelFilterId] = useState<
    string | number
  >("ALL");
  const [selectedTAFilter, setSelectedTAFilter] = useState<string>("ALL");
  const [guruMapelStudentViewMode, setGuruMapelStudentViewMode] = useState<
    "ALL" | "BY_MAPEL"
  >("ALL");
  const [studentScopeFilter, setStudentScopeFilter] = useState<
    "active" | "past" | "ALL"
  >("ALL");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [guruPengampuSearchQuery, setGuruPengampuSearchQuery] = useState<string>("");
  const [showPretestAnswers, setShowPretestAnswers] = useState<boolean>(false);
  const [activePosttestAnswerId, setActivePosttestAnswerId] = useState<
    number | null
  >(null);
  const [modalStudentId, setModalStudentId] = useState<number | null>(null);

  // States for Nilai Siswa Table & Answers Popup
  const [viewingStudentGradesId, setViewingStudentGradesId] = useState<number | null>(null);
  const [viewingGradeSubjectFilter, setViewingGradeSubjectFilter] = useState<string>("ALL");
  const [gradeTypeFilter, setGradeTypeFilter] = useState<"ALL" | "pretest" | "posttest">("ALL");
  const [gradeSearchQuery, setGradeSearchQuery] = useState<string>("");
  const [selectedGradeRecord, setSelectedGradeRecord] = useState<any | null>(null);
  const [showGradeAnswersModal, setShowGradeAnswersModal] = useState<boolean>(false);

  // States for Import Soal (Word / PDF)
  const pretestFileInputRef = useRef<HTMLInputElement>(null);
  const [importingPretest, setImportingPretest] = useState(false);
  const posttestFileInputRef = useRef<HTMLInputElement>(null);
  const [importingPosttest, setImportingPosttest] = useState(false);

  // Expanded menu and Add Class/Subject modal states
  const [expandedMenu, setExpandedMenu] = useState<"siswa" | "mapel" | null>(
    "siswa",
  );
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<number[]>([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [selectedClassIdToTeach, setSelectedClassIdToTeach] = useState("");
  const [newSubjectNameInput, setNewSubjectNameInput] = useState("");
  const [newSubjectClassIdInput, setNewSubjectClassIdInput] = useState("");
  const [isAddingNewClass, setIsAddingNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassMajor, setNewClassMajor] = useState("");
  const [newClassAcademicYear, setNewClassAcademicYear] = useState("2025/2026");
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [submittingClass, setSubmittingClass] = useState(false);
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState<string | null>(null);
  const [showModuleFormModal, setShowModuleFormModal] = useState(false);

  // Badge management states
  const [badgeList, setBadgeList] = useState<any[]>([]);
  const [teacherModulesForBadge, setTeacherModulesForBadge] = useState<any[]>(
    [],
  );
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [badgeForm, setBadgeForm] = useState({
    id: null as number | null,
    name: "",
    description: "",
    image_url: "🏆",
    module_id: "",
  });
  const [submittingBadge, setSubmittingBadge] = useState(false);
  const [uploadingBadgeImage, setUploadingBadgeImage] = useState(false);
  const [badgeMessage, setBadgeMessage] = useState<string | null>(null);

  // Guru BK assigned class management states
  const [showManageBkClassModal, setShowManageBkClassModal] = useState(false);
  const [selectedBkClassId, setSelectedBkClassId] = useState<string>("");
  const [updatingBkClass, setUpdatingBkClass] = useState(false);
  const [resolvingMentoring, setResolvingMentoring] = useState(false);

  // Custom Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const triggerToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Custom Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "success" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "warning" | "success" | "info" = "warning",
    confirmText: string = "Ya, Lanjutkan",
    cancelText: string = "Batal"
  ) => {
    setConfirmModalState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
    });
  };

  const handleResolveMentoring = (studentId: number, studentName?: string) => {
    const student = data?.students?.find((s) => s.id === studentId);
    if (student && !student.riskFlag) return;

    showConfirmDialog(
      "Konfirmasi Selesai Pendampingan",
      `Apakah Anda yakin ingin menandai bahwa pendampingan untuk ${studentName ? `siswa ${studentName}` : "siswa ini"} telah selesai? Alert risiko siswa akan diselesaikan dan status siswa diperbarui menjadi 'Sudah Pendampingan'.`,
      async () => {
        setResolvingMentoring(true);
        try {
          const res = await fetch("/api/chat", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId }),
          });
          const json = await res.json();
          if (json.success) {
            triggerToast("Status pendampingan siswa berhasil diperbarui menjadi Selesai Pendampingan!", "success");
            await fetchTeacherDashboardData();
            if (activeChatStudentId) {
              fetchChatMessages(activeChatStudentId);
            }
          } else {
            triggerToast(json.message || "Gagal memperbarui status pendampingan.", "error");
          }
        } catch (e) {
          triggerToast("Terjadi kesalahan jaringan.", "error");
        } finally {
          setResolvingMentoring(false);
        }
      },
      "success",
      "Ya, Tandai Selesai",
      "Batal"
    );
  };

  const handleSaveBkClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.teacher || !selectedBkClassId) return;
    setUpdatingBkClass(true);

    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bimbingan Konseling (BK)",
          classId: selectedBkClassId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || "Gagal menambahkan kelas binaan Guru BK.",
        );
      }

      triggerToast("Kelas binaan berhasil ditambahkan!", "success");
      setSelectedBkClassId("");
      await fetchTeacherDashboardData();
      await fetchClasses();
      await fetchSubjects();
    } catch (err: any) {
      triggerToast(err.message || "Terjadi kesalahan saat menambahkan kelas.", "error");
    } finally {
      setUpdatingBkClass(false);
    }
  };

  const handleRemoveBkClass = async (subjectId: number) => {
    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const json = await res.json();
      if (json.success) {
        triggerToast("Kelas binaan berhasil dilepas.", "success");
        await fetchTeacherDashboardData();
        await fetchClasses();
        await fetchSubjects();
      } else {
        triggerToast(json.message || "Gagal melepaskan kelas.", "error");
      }
    } catch {
      triggerToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  const handleUploadBadgeImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBadgeImage(true);
    setBadgeMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setBadgeForm((prev) => ({ ...prev, image_url: json.url }));
        setBadgeMessage("Gambar icon badge berhasil diunggah!");
      } else {
        alert(json.message || "Gagal mengunggah gambar badge.");
      }
    } catch (err: any) {
      alert(err.message || "Gagal mengunggah gambar badge.");
    } finally {
      setUploadingBadgeImage(false);
    }
  };

  // Change Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChangePasswordSection, setShowChangePasswordSection] =
    useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showProfileNewPass, setShowProfileNewPass] = useState(false);
  const [showProfileConfirmPass, setShowProfileConfirmPass] = useState(false);

  const handleChangePasswordTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setChangePasswordMsg({
        text: "Password lama dan password baru wajib diisi.",
        type: "error",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordMsg({
        text: "Konfirmasi password baru tidak cocok.",
        type: "error",
      });
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordMsg({
        text: "Password baru minimal 6 karakter.",
        type: "error",
      });
      return;
    }

    setChangingPassword(true);
    setChangePasswordMsg(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setChangePasswordMsg({
          text: "Password Anda berhasil diperbarui!",
          type: "success",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setChangePasswordMsg({
          text: json.message || "Gagal mengubah password.",
          type: "error",
        });
      }
    } catch {
      setChangePasswordMsg({
        text: "Terjadi kesalahan koneksi server.",
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Teacher profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Subject & Module management states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectClassId, setNewSubjectClassId] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [availableSubjectOptions, setAvailableSubjectOptions] = useState<
    string[]
  >([
    "Matematika",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Informatika",
    "Fisika",
    "Kimia",
    "Biologi",
    "Ekonomi",
    "Geografi",
    "Sosiologi",
    "Sejarah",
    "Pendidikan Pancasila",
    "Seni Budaya",
    "PJOK",
    "Literasi Digital & Kesehatan Mental",
  ]);

  const [activeSubjectIdForModule, setActiveSubjectIdForModule] = useState<
    number | null
  >(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleContent, setNewModuleContent] = useState("");
  const [newModuleVideoUrl, setNewModuleVideoUrl] = useState("");
  const [newModuleLevel, setNewModuleLevel] = useState("Beginner");
  // Posttest Quiz states (Dynamic)
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [posttestQuestions, setPosttestQuestions] = useState<
    Array<{
      id?: number;
      question: string;
      options: string[];
      correctIndex: number;
    }>
  >([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);

  const handleAddPosttestQuestion = () => {
    setPosttestQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const handleRemovePosttestQuestion = (index: number) => {
    setPosttestQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePosttestQuestionChange = (
    index: number,
    field: string,
    val: any,
    optIndex?: number,
  ) => {
    setPosttestQuestions((prev) => {
      const updated = prev.map((q) => ({ ...q, options: [...q.options] }));
      if (field === "question") {
        updated[index].question = val;
      } else if (field === "correctIndex") {
        updated[index].correctIndex = val;
      } else if (field === "option" && optIndex !== undefined) {
        updated[index].options[optIndex] = val;
      }
      return updated;
    });
  };

  // Subject Pretest Modal States
  const [activePretestSubject, setActivePretestSubject] = useState<any | null>(
    null,
  );
  const [subjectPretestTitle, setSubjectPretestTitle] = useState("");
  const [subjectPretestQuestions, setSubjectPretestQuestions] = useState<
    Array<{
      id?: number;
      question: string;
      options: string[];
      correctIndex: number;
    }>
  >([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [savingSubjectPretest, setSavingSubjectPretest] = useState(false);

  const handleOpenSubjectPretestModal = (subject: any, pretestQuiz: any) => {
    setActivePretestSubject(subject);
    if (pretestQuiz) {
      setSubjectPretestTitle(pretestQuiz.title || "");
      if (pretestQuiz.questions && pretestQuiz.questions.length > 0) {
        setSubjectPretestQuestions(
          pretestQuiz.questions.map((q: any) => {
            const opts = q.options?.map((o: any) => o.option_text || "") || [
              "",
              "",
              "",
              "",
            ];
            const correctIdx =
              q.options?.findIndex((o: any) => o.is_correct) ?? 0;
            return {
              id: q.id,
              question: q.question || "",
              options:
                opts.length === 4
                  ? opts
                  : [...opts, "", "", "", ""].slice(0, 4),
              correctIndex: correctIdx >= 0 ? correctIdx : 0,
            };
          }),
        );
      } else {
        setSubjectPretestQuestions([
          { question: "", options: ["", "", "", ""], correctIndex: 0 },
        ]);
      }
    } else {
      setSubjectPretestTitle(`Pretest Mata Pelajaran ${subject.name}`);
      setSubjectPretestQuestions([
        { question: "", options: ["", "", "", ""], correctIndex: 0 },
      ]);
    }
  };

  const handleCloseSubjectPretestModal = () => {
    setActivePretestSubject(null);
    setSubjectPretestTitle("");
    setSubjectPretestQuestions([
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const handleAddSubjectPretestQuestion = () => {
    setSubjectPretestQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const handleRemoveSubjectPretestQuestion = (index: number) => {
    setSubjectPretestQuestions((prev) =>
      prev.filter((_, idx) => idx !== index),
    );
  };

  const handleSubjectPretestQuestionChange = (
    index: number,
    field: string,
    val: any,
    optIndex?: number,
  ) => {
    setSubjectPretestQuestions((prev) => {
      const updated = prev.map((q) => ({ ...q, options: [...q.options] }));
      if (field === "question") {
        updated[index].question = val;
      } else if (field === "correctIndex") {
        updated[index].correctIndex = val;
      } else if (field === "option" && optIndex !== undefined) {
        updated[index].options[optIndex] = val;
      }
      return updated;
    });
  };

  const handleSaveSubjectPretest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePretestSubject || !subjectPretestTitle.trim()) return;

    const questionsPayload = subjectPretestQuestions
      .filter((q) => q.question.trim() !== "")
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt, idx) => ({
          optionText: opt.trim() || `Pilihan ${String.fromCharCode(65 + idx)}`,
          isCorrect: idx === q.correctIndex,
        })),
      }));

    if (questionsPayload.length === 0) {
      triggerToast("Harap isi setidaknya 1 pertanyaan pretest!", "error");
      return;
    }

    setSavingSubjectPretest(true);
    try {
      const res = await fetch("/api/teacher/subjects/pretest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: activePretestSubject.id,
          title: subjectPretestTitle.trim(),
          questions: questionsPayload,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast("Pretest Mata Pelajaran berhasil disimpan!", "success");
        handleCloseSubjectPretestModal();
        fetchSubjects();
      } else {
        triggerToast(json.message || "Gagal menyimpan Pretest Mata Pelajaran.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Gagal menyimpan Pretest Mata Pelajaran.", "error");
    } finally {
      setSavingSubjectPretest(false);
    }
  };

  const handleDeleteSubjectPretest = (subjectId: number) => {
    showConfirmDialog(
      "Hapus Pretest Mata Pelajaran",
      "Apakah Anda yakin ingin menghapus kuis pretest mata pelajaran ini?",
      async () => {
        try {
          const res = await fetch(
            `/api/teacher/subjects/pretest?subjectId=${subjectId}`,
            {
              method: "DELETE",
            },
          );
          const json = await res.json();
          if (res.ok && json.success) {
            triggerToast("Kuis Pretest Mata Pelajaran berhasil dihapus!", "success");
            fetchSubjects();
          } else {
            triggerToast(json.message || "Gagal menghapus Pretest Mata Pelajaran.", "error");
          }
        } catch (err: any) {
          triggerToast(err.message || "Gagal menghapus Pretest Mata Pelajaran.", "error");
        }
      },
      "danger",
      "Hapus Pretest"
    );
  };

  // BK Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [activeChatStudentId, setActiveChatStudentId] = useState<number | null>(
    null,
  );
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/teacher/subjects");
      const json = await res.json();
      if (json.success) {
        setSubjects(json.subjects);
        if (json.allSubjectNames && json.allSubjectNames.length > 0) {
          setAvailableSubjectOptions(json.allSubjectNames);
        }
        if (json.subjects && json.subjects.length > 0) {
          setSelectedMapelFilterId((prev) =>
            prev === "ALL" || !prev ? json.subjects[0].id : prev,
          );
        }
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
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "intervensi" && activeChatStudentId) {
      fetchChatMessages(activeChatStudentId);
    }
  }, [activeChatStudentId, activeView]);

  const handleAddClassSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassIdToTeach) return;
    setSubmittingClass(true);
    setModalFeedbackMsg(null);
    try {
      const teacherSubjectName =
        data?.teacher?.specialization ||
        data?.teacher?.subjects?.[0]?.name ||
        "Literasi Digital & Kesehatan Mental";

      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherSubjectName,
          classId: selectedClassIdToTeach,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalFeedbackMsg("Kelas pengampuan berhasil ditambahkan!");
        setSelectedClassIdToTeach("");
        fetchSubjects();
        await fetchTeacherDashboardData();
        setTimeout(() => {
          setShowAddClassModal(false);
          setModalFeedbackMsg(null);
        }, 1200);
      } else {
        setModalFeedbackMsg(
          json.message || "Gagal menambahkan kelas pengampuan.",
        );
      }
    } catch (e: any) {
      setModalFeedbackMsg(e.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmittingClass(false);
    }
  };

  const openAddSubjectModal = () => {
    fetchClasses();
    setNewSubjectClassIdInput("");
    setNewSubjectNameInput("");
    setIsCustomSubject(false);
    setCustomSubjectName("");
    setIsAddingNewClass(false);
    setNewClassName("");
    setNewClassMajor("");
    setModalFeedbackMsg(null);
    setShowAddSubjectModal(true);
  };

  const handleAddSubjectSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetClassId = newSubjectClassIdInput;

    // 1. If user chose to create a new class first
    if (newSubjectClassIdInput === "__NEW_CLASS__" || isAddingNewClass) {
      if (!newClassName.trim() || !newClassMajor.trim()) {
        setModalFeedbackMsg("Nama kelas dan jurusan baru wajib diisi.");
        return;
      }
      setSubmittingSubject(true);
      setModalFeedbackMsg(null);
      try {
        const classRes = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newClassName.trim(),
            major: newClassMajor.trim(),
            academic_year: newClassAcademicYear ? newClassAcademicYear.trim() : "2025/2026",
          }),
        });
        const classJson = await classRes.json();
        if (!classJson.success || !classJson.class?.id) {
          setModalFeedbackMsg(classJson.message || "Gagal membuat kelas baru.");
          setSubmittingSubject(false);
          return;
        }
        targetClassId = String(classJson.class.id);
      } catch (err: any) {
        setModalFeedbackMsg(err.message || "Gagal membuat kelas baru.");
        setSubmittingSubject(false);
        return;
      }
    }

    if (!targetClassId) {
      setModalFeedbackMsg("Silakan pilih kelas terlebih dahulu.");
      return;
    }

    const targetClass = classesList.find((c: any) => String(c.id) === String(targetClassId));
    const isNewMapel = isCustomSubject || isAddingNewClass || (targetClass && (!targetClass.subjects || targetClass.subjects.length === 0));
    const finalSubjectName = isNewMapel ? (customSubjectName.trim() || newSubjectNameInput.trim()) : newSubjectNameInput.trim();
    if (!finalSubjectName) {
      setModalFeedbackMsg("Nama mata pelajaran wajib diisi atau dipilih.");
      return;
    }

    setSubmittingSubject(true);
    setModalFeedbackMsg(null);
    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalSubjectName,
          classId: targetClassId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalFeedbackMsg("Pengampuan kelas & mata pelajaran berhasil ditambahkan!");
        setNewSubjectNameInput("");
        setNewSubjectClassIdInput("");
        setIsCustomSubject(false);
        setCustomSubjectName("");
        setIsAddingNewClass(false);
        setNewClassName("");
        setNewClassMajor("");
        fetchSubjects();
        fetchClasses();
        await fetchTeacherDashboardData();
        setTimeout(() => {
          setShowAddSubjectModal(false);
          setModalFeedbackMsg(null);
        }, 1200);
      } else {
        setModalFeedbackMsg(
          json.message || "Gagal menambahkan kelas & mata pelajaran.",
        );
      }
    } catch (e: any) {
      setModalFeedbackMsg(e.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectClassId) return;

    try {
      const res = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          classId: newSubjectClassId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewSubjectName("");
        setNewSubjectClassId("");
        setShowAddSubject(false);
        fetchSubjects();
        fetchClasses();
        await fetchTeacherDashboardData();
      } else {
        alert(json.message || "Gagal membuat mata pelajaran.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetModuleForm = () => {
    setEditingModuleId(null);
    setNewModuleTitle("");
    setNewModuleContent("");
    setNewModuleVideoUrl("");
    setNewModuleLevel("Beginner");
    setNewQuizTitle("");
    setPosttestQuestions([
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
    setActiveSubjectIdForModule(null);
    setShowModuleFormModal(false);
  };

  const handleStartAddModule = (subjectId: number) => {
    resetModuleForm();
    setActiveSubjectIdForModule(subjectId);
    setShowModuleFormModal(true);
  };

  const handleStartEditModule = (mod: any, subjectId: number) => {
    setActiveSubjectIdForModule(subjectId);
    setEditingModuleId(mod.id);
    setNewModuleTitle(mod.title || "");
    setNewModuleContent(mod.content || "");
    setNewModuleVideoUrl(mod.video_url || "");
    setNewModuleLevel(mod.level?.name || "Beginner");

    // Load Posttest
    const posttestQuiz = mod.quizzes?.find((q: any) => q.type === "posttest");
    if (posttestQuiz) {
      setNewQuizTitle(posttestQuiz.title || "");
      if (posttestQuiz.questions && posttestQuiz.questions.length > 0) {
        setPosttestQuestions(
          posttestQuiz.questions.map((q: any) => {
            const opts = q.options?.map((o: any) => o.option_text || "") || [
              "",
              "",
              "",
              "",
            ];
            const correctIdx =
              q.options?.findIndex((o: any) => o.is_correct) ?? 0;
            return {
              id: q.id,
              question: q.question || "",
              options:
                opts.length === 4
                  ? opts
                  : [...opts, "", "", "", ""].slice(0, 4),
              correctIndex: correctIdx >= 0 ? correctIdx : 0,
            };
          }),
        );
      } else {
        setPosttestQuestions([
          { question: "", options: ["", "", "", ""], correctIndex: 0 },
        ]);
      }
    } else {
      setNewQuizTitle("");
      setPosttestQuestions([
        { question: "", options: ["", "", "", ""], correctIndex: 0 },
      ]);
    }
    setShowModuleFormModal(true);
  };

  const handleDeleteModule = (moduleId: number) => {
    showConfirmDialog(
      "Hapus Modul Pembelajaran",
      "Apakah Anda yakin ingin menghapus modul ini beserta kuis di dalamnya?",
      async () => {
        try {
          const res = await fetch(`/api/teacher/modules?id=${moduleId}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (res.ok && json.success) {
            triggerToast("Modul berhasil dihapus!", "success");
            fetchSubjects();
          } else {
            triggerToast(json.message || "Gagal menghapus modul.", "error");
          }
        } catch (err: any) {
          triggerToast(err.message || "Gagal menghapus modul.", "error");
        }
      },
      "danger",
      "Hapus Modul"
    );
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newModuleTitle.trim() ||
      !newModuleContent.trim() ||
      !activeSubjectIdForModule
    )
      return;

    const posttestPayload = posttestQuestions
      .filter((q) => q.question.trim() !== "")
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt, idx) => ({
          optionText: opt.trim() || `Pilihan ${String.fromCharCode(65 + idx)}`,
          isCorrect: idx === q.correctIndex,
        })),
      }));

    const isEdit = !!editingModuleId;
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit
      ? {
          moduleId: editingModuleId,
          title: newModuleTitle.trim(),
          content: newModuleContent.trim(),
          videoUrl: newModuleVideoUrl.trim() || null,
          levelName: newModuleLevel,
          quizTitle: newQuizTitle.trim() || null,
          questions: posttestPayload,
        }
      : {
          subjectId: activeSubjectIdForModule,
          title: newModuleTitle.trim(),
          content: newModuleContent.trim(),
          videoUrl: newModuleVideoUrl.trim() || null,
          levelName: newModuleLevel,
          quizTitle: newQuizTitle.trim() || null,
          questions: posttestPayload,
        };

    try {
      const res = await fetch("/api/teacher/modules", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        resetModuleForm();
        fetchSubjects();
      } else {
        alert(json.message || "Gagal menyimpan modul.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan modul.");
    }
  };

  const fetchTeacherDashboardData = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditProfile = () => {
    if (!data?.teacher) return;
    setEditName(data.teacher.name || "");
    setEditSpecialization(data.teacher.specialization || "");
    setEditPosition(data.teacher.position || "");
    setEditPhone(data.teacher.phone_number || "");
    setNewPassword("");
    setConfirmPassword("");
    setProfileMessage(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage("Gagal: Konfirmasi password baru tidak cocok.");
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          specialization: editSpecialization,
          position: editPosition,
          phone_number: editPhone,
          password: newPassword || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setProfileMessage("Profil berhasil diperbarui!");
        setNewPassword("");
        setConfirmPassword("");
        setIsEditingProfile(false);
        await fetchTeacherDashboardData();
      } else {
        setProfileMessage(`Gagal: ${json.message}`);
      }
    } catch {
      setProfileMessage("Terjadi kesalahan koneksi.");
    } finally {
      setSavingProfile(false);
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
          studentId: activeChatStudentId,
        }),
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
    fetchClasses();
    fetchSubjects();

    // Auto-update student data, moods, and alerts in the background every 10 seconds and on window focus
    const interval = setInterval(() => {
      fetchTeacherDashboardData();
    }, 10000);

    const onFocus = () => {
      fetchTeacherDashboardData();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const fetchTeacherBadges = async () => {
    setLoadingBadges(true);
    try {
      const res = await fetch("/api/teacher/badges");
      const json = await res.json();
      if (res.ok && json.success) {
        setBadgeList(json.badges || []);
        setTeacherModulesForBadge(json.modules || []);
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
    } finally {
      setLoadingBadges(false);
    }
  };

  useEffect(() => {
    if (activeView === "badge") {
      fetchTeacherBadges();
    }
  }, [activeView]);

  const handleSaveBadge = async (e: FormEvent) => {
    e.preventDefault();
    if (!badgeForm.name.trim() || !badgeForm.module_id) {
      setBadgeMessage("Nama badge dan modul pelajaran wajib diisi.");
      return;
    }
    setSubmittingBadge(true);
    setBadgeMessage(null);

    try {
      const method = badgeForm.id ? "PUT" : "POST";
      const res = await fetch("/api/teacher/badges", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: badgeForm.id,
          name: badgeForm.name.trim(),
          description: badgeForm.description.trim(),
          image_url: badgeForm.image_url || "🏆",
          module_id: badgeForm.module_id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan badge.");
      }

      setBadgeMessage(
        badgeForm.id
          ? "Badge berhasil diperbarui!"
          : "Badge baru berhasil ditambahkan!",
      );
      setBadgeForm({
        id: null,
        name: "",
        description: "",
        image_url: "🏆",
        module_id: "",
      });
      fetchTeacherBadges();
    } catch (err: any) {
      setBadgeMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setSubmittingBadge(false);
    }
  };

  const handleDeleteBadge = (id: number) => {
    showConfirmDialog(
      "Hapus Badge Penghargaan",
      "Apakah Anda yakin ingin menghapus badge ini?",
      async () => {
        try {
          const res = await fetch(`/api/teacher/badges?id=${id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (res.ok && json.success) {
            triggerToast("Badge berhasil dihapus.", "success");
            setBadgeMessage("Badge berhasil dihapus.");
            fetchTeacherBadges();
          } else {
            triggerToast(json.message || "Gagal menghapus badge.", "error");
          }
        } catch (err: any) {
          triggerToast(err.message || "Gagal menghapus badge.", "error");
        }
      },
      "danger",
      "Hapus Badge"
    );
  };

  // Group teacher's subjects by Tahun Ajaran (Academic Year)
  const groupedSubjectsByTA = useMemo(() => {
    if (!data?.teacher?.subjects) return [];
    const map = new Map<string, any[]>();
    data.teacher.subjects.forEach((s: any) => {
      const rawYear = s.classYear || (s.academicYear ? s.academicYear.replace(/^TA\s*/i, "") : "2025/2026");
      const taLabel = rawYear.toLowerCase().startsWith("ta") ? rawYear : `TA ${rawYear}`;
      if (!map.has(taLabel)) {
        map.set(taLabel, []);
      }
      map.get(taLabel)!.push(s);
    });
    // Sort TAs descending
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data?.teacher?.subjects]);

  const activeTargetSubject = useMemo(() => {
    if (guruMapelStudentViewMode === "BY_MAPEL" && selectedMapelFilterId !== "ALL") {
      return data?.teacher?.subjects?.find((s: any) => String(s.id) === String(selectedMapelFilterId)) || null;
    }
    if (selectedSubjectFilter !== "ALL") {
      return data?.teacher?.subjects?.find((s: any) => s.name === selectedSubjectFilter) || null;
    }
    return null;
  }, [guruMapelStudentViewMode, selectedMapelFilterId, selectedSubjectFilter, data?.teacher?.subjects]);

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    
    // Determine the targeted subject from filters
    let targetSubj: any = null;
    const isFilteringByMapel =
      (guruMapelStudentViewMode === "BY_MAPEL" && selectedMapelFilterId !== "ALL") ||
      (selectedSubjectFilter !== "ALL");
      
    if (isFilteringByMapel) {
      targetSubj = data.teacher?.subjects?.find((s) => {
        if (selectedMapelFilterId !== "ALL" && String(s.id) === String(selectedMapelFilterId)) return true;
        if (selectedSubjectFilter !== "ALL" && s.name === selectedSubjectFilter) return true;
        return false;
      });
    }

    const filtered = data.students.filter((student) => {
      // 1. Status Filter: Siswa Aktif vs Siswa Terdahulu
      if (studentScopeFilter === "active" && student.isPastStudent) return false;
      if (studentScopeFilter === "past" && !student.isPastStudent) return false;

      // 2. Search filtering
      if (studentSearchQuery.trim()) {
        const query = studentSearchQuery.toLowerCase();
        if (
          !(student.name || "").toLowerCase().includes(query) &&
          !(student.nis || "").toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 3. Mapel filtering: "Semua Siswa" vs "By Mapel"
      if (isFilteringByMapel) {
        if (targetSubj) {
          const matchClass = student.classId === targetSubj.classId;
          const hasAttempts =
            (student.pretests || []).some((pt) => pt.subjectId === targetSubj.id || pt.subjectName === targetSubj.name) ||
            (student.posttests || []).some((pt) => pt.subjectId === targetSubj.id || pt.subjectName === targetSubj.name) ||
            (student.moduleProgressesList || []).some((mp) => mp.subjectId === targetSubj.id || mp.subjectName === targetSubj.name);
          if (!matchClass && !hasAttempts) return false;
        } else if (selectedSubjectFilter !== "ALL") {
          // If BK/Wali Kelas selected a subject but it's not in teacher.subjects
          const hasAttempts =
            (student.pretests || []).some((pt) => pt.subjectName === selectedSubjectFilter) ||
            (student.posttests || []).some((pt) => pt.subjectName === selectedSubjectFilter) ||
            (student.moduleProgressesList || []).some((mp) => mp.subjectName === selectedSubjectFilter);
          if (!hasAttempts) return false;
        }
      } else {
        // Filter by TA if selected
        if (selectedTAFilter !== "ALL") {
          const normFilterTA = selectedTAFilter.replace(/^TA\s*/i, "").trim();
          const studentTA = (student.classYear || student.academicYear || "").replace(/^TA\s*/i, "").trim();
          if (studentTA && studentTA !== normFilterTA) return false;
        }

        // Filter by class if selected (for BK or Wali Kelas)
        if (selectedClassFilter !== "ALL") {
          const matchClass =
            String(student.classId) === String(selectedClassFilter) ||
            student.className === selectedClassFilter ||
            student.className.startsWith(selectedClassFilter);
          if (!matchClass) return false;
        }
      }

      return true;
    });

    // Remap properties based on active subject filter if needed
    return filtered.map((student) => {
      if (!isFilteringByMapel) return student;

      const filterName = targetSubj ? targetSubj.name : selectedSubjectFilter;
      const filterId = targetSubj ? targetSubj.id : null;

      const filteredModuleProgresses = (student.moduleProgressesList || []).filter(
        (mp) => (filterId && mp.subjectId === filterId) || mp.subjectName === filterName
      );
      const filteredPretests = (student.pretests || []).filter(
        (pt) => (filterId && pt.subjectId === filterId) || pt.subjectName === filterName
      );
      const filteredPosttests = (student.posttests || []).filter(
        (pt) => (filterId && pt.subjectId === filterId) || pt.subjectName === filterName
      );

      const totalModProg = filteredModuleProgresses.reduce((sum, mp) => sum + mp.progress, 0);
      const newSubjectProgress = filteredModuleProgresses.length > 0 
        ? Math.round(totalModProg / filteredModuleProgresses.length) 
        : 0;

      return {
        ...student,
        moduleProgressesList: filteredModuleProgresses,
        pretests: filteredPretests,
        posttests: filteredPosttests,
        subjectProgress: newSubjectProgress,
      };
    });
  }, [
    data,
    studentScopeFilter,
    selectedTAFilter,
    guruMapelStudentViewMode,
    selectedMapelFilterId,
    selectedClassFilter,
    selectedSubjectFilter,
    studentSearchQuery,
  ]);

  const selectedStudent = useMemo(() => {
    const pool =
      filteredStudents.length > 0 ? filteredStudents : data?.students || [];
    if (!pool || pool.length === 0) return null;
    return (
      pool.find((student) => student.id === selectedStudentId) ??
      pool[0] ??
      null
    );
  }, [data, filteredStudents, selectedStudentId]);

  // Derived Student Grades list for Nilai Siswa Table
  const allStudentGrades = useMemo(() => {
    if (!data?.students) return [];
    const list: Array<{
      id: string;
      attemptId: number;
      studentId: number;
      studentName: string;
      nis: string;
      className: string;
      subjectName: string;
      quizTitle: string;
      type: "Pretest" | "Posttest";
      score: number;
      completedAt: string;
      answers: QuizAnswerDetail[];
    }> = [];

    data.students.forEach((student) => {
      (student.pretests || []).forEach((pt) => {
        list.push({
          id: `pretest-${student.id}-${pt.id}`,
          attemptId: pt.id,
          studentId: student.id,
          studentName: student.name,
          nis: student.nis || "-",
          className: student.className || "-",
          subjectName: pt.subjectName || "Mata Pelajaran Guru",
          quizTitle: pt.title,
          type: "Pretest",
          score: pt.score,
          completedAt: pt.completedAt,
          answers: pt.answers || [],
        });
      });

      (student.posttests || []).forEach((pt) => {
        list.push({
          id: `posttest-${student.id}-${pt.id}`,
          attemptId: pt.id,
          studentId: student.id,
          studentName: student.name,
          nis: student.nis || "-",
          className: student.className || "-",
          subjectName: pt.subjectName || "Mata Pelajaran Guru",
          quizTitle: pt.moduleTitle || "Kuis Modul",
          type: "Posttest",
          score: pt.score,
          completedAt: pt.completedAt,
          answers: pt.answers || [],
        });
      });
    });

    return list;
  }, [data?.students]);

  const filteredGrades = useMemo(() => {
    return allStudentGrades.filter((g) => {
      if (selectedClassFilter !== "ALL" && g.className !== selectedClassFilter) {
        return false;
      }
      if (selectedSubjectFilter !== "ALL" && g.subjectName !== selectedSubjectFilter) {
        return false;
      }
      if (gradeTypeFilter === "pretest" && g.type !== "Pretest") return false;
      if (gradeTypeFilter === "posttest" && g.type !== "Posttest") return false;

      if (gradeSearchQuery.trim()) {
        const q = gradeSearchQuery.toLowerCase();
        const match =
          g.studentName.toLowerCase().includes(q) ||
          g.nis.toLowerCase().includes(q) ||
          g.quizTitle.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allStudentGrades, selectedClassFilter, selectedSubjectFilter, gradeTypeFilter, gradeSearchQuery]);

  const viewingStudent = useMemo(() => {
    if (!viewingStudentGradesId || !data?.students) return null;
    return data.students.find((s) => s.id === viewingStudentGradesId) || null;
  }, [viewingStudentGradesId, data?.students]);

  const viewingStudentAttempts = useMemo(() => {
    if (!viewingStudent) return [];
    const list: Array<{
      id: string;
      attemptId: number;
      title: string;
      subjectName: string;
      className: string;
      academicYear: string;
      type: "Pretest" | "Posttest";
      score: number;
      completedAt: string;
      answers: QuizAnswerDetail[];
    }> = [];

    (viewingStudent.pretests || []).forEach((pt: any) => {
      list.push({
        id: `pretest-${pt.id}`,
        attemptId: pt.id,
        title: pt.title,
        subjectName: pt.subjectName || "Mata Pelajaran Guru",
        className: pt.className || viewingStudent.className,
        academicYear: pt.academicYear || viewingStudent.academicYear || "TA 2025/2026",
        type: "Pretest",
        score: pt.score,
        completedAt: pt.completedAt,
        answers: pt.answers || [],
      });
    });

    (viewingStudent.posttests || []).forEach((pt: any) => {
      list.push({
        id: `posttest-${pt.id}`,
        attemptId: pt.id,
        title: pt.moduleTitle || pt.title || "Kuis Modul",
        subjectName: pt.subjectName || "Mata Pelajaran Guru",
        className: pt.className || viewingStudent.className,
        academicYear: pt.academicYear || viewingStudent.academicYear || "TA 2025/2026",
        type: "Posttest",
        score: pt.score,
        completedAt: pt.completedAt,
        answers: pt.answers || [],
      });
    });

    return list;
  }, [viewingStudent]);

  const viewingStudentSubjectSummaries = useMemo(() => {
    if (!viewingStudentAttempts || viewingStudentAttempts.length === 0) return [];
    const map = new Map<string, {
      subjectName: string;
      teacherName: string;
      grades: typeof viewingStudentAttempts;
      avgScore: number;
      pretestCount: number;
      posttestCount: number;
    }>();

    // Populate grades into each subject from viewingStudentAttempts
    viewingStudentAttempts.forEach((g) => {
      const sName = g.subjectName || "Umum";
      let entry = map.get(sName);
      if (!entry) {
        const matchedSubj = (data?.teacher?.subjects || []).find((s: any) => s.name === sName);
        const tName = matchedSubj?.assignedTeacher?.name || data?.teacher?.name || "-";

        entry = {
          subjectName: sName,
          teacherName: tName,
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

    // Also include any subjects from moduleProgressesList if student has them
    (viewingStudent?.moduleProgressesList || []).forEach((mp: any) => {
      if (mp.subjectName && !map.has(mp.subjectName)) {
        const matchedSubj = (data?.teacher?.subjects || []).find((s: any) => s.name === mp.subjectName);
        const tName = matchedSubj?.assignedTeacher?.name || data?.teacher?.name || "-";
        map.set(mp.subjectName, {
          subjectName: mp.subjectName,
          teacherName: tName,
          grades: [],
          avgScore: 0,
          pretestCount: 0,
          posttestCount: 0,
        });
      }
    });

    // Compute average score for each subject
    map.forEach((entry) => {
      if (entry.grades.length > 0) {
        const sum = entry.grades.reduce((acc, g) => acc + g.score, 0);
        entry.avgScore = Math.round(sum / entry.grades.length);
      } else {
        entry.avgScore = 0;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [viewingStudentAttempts, viewingStudent?.moduleProgressesList, data?.teacher?.subjects, data?.teacher?.name]);

  const viewingOverallAvgScore = useMemo(() => {
    const activeSummaries = viewingStudentSubjectSummaries.filter((s) => s.grades.length > 0);
    if (activeSummaries.length === 0) return 0;
    const total = activeSummaries.reduce((sum, s) => sum + s.avgScore, 0);
    return Math.round(total / activeSummaries.length);
  }, [viewingStudentSubjectSummaries]);

  const filteredViewingSubjectSummaries = useMemo(() => {
    if (!gradeSearchQuery.trim()) return viewingStudentSubjectSummaries;
    const q = gradeSearchQuery.toLowerCase();
    return viewingStudentSubjectSummaries.filter((s) =>
      s.subjectName.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q)
    );
  }, [viewingStudentSubjectSummaries, gradeSearchQuery]);

  const availableViewingSubjects = useMemo(() => {
    if (!viewingStudentAttempts || viewingStudentAttempts.length === 0) return [];
    const set = new Set<string>();
    viewingStudentAttempts.forEach((a) => {
      if (a.subjectName) set.add(a.subjectName);
    });
    return Array.from(set);
  }, [viewingStudentAttempts]);

  const filteredViewingStudentAttempts = useMemo(() => {
    let list = viewingStudentAttempts;
    if (viewingGradeSubjectFilter !== "ALL") {
      list = list.filter((a) => a.subjectName === viewingGradeSubjectFilter);
    }
    if (gradeSearchQuery.trim()) {
      const q = gradeSearchQuery.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.subjectName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [viewingStudentAttempts, viewingGradeSubjectFilter, gradeSearchQuery]);

  const handleExportViewingStudentCSV = () => {
    if (!viewingStudent) {
      alert("Tidak ada data siswa untuk diekspor.");
      return;
    }
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (viewingGradeSubjectFilter === "ALL") {
      if (viewingStudentSubjectSummaries.length === 0) {
        alert("Tidak ada data nilai untuk diekspor pada siswa ini.");
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
      rows = viewingStudentSubjectSummaries.map((s, idx) => [
        idx + 1,
        `"${(viewingStudent.nis || "").replace(/"/g, '""')}"`,
        `"${(viewingStudent.name || "").replace(/"/g, '""')}"`,
        `"${(viewingStudent.className || "").replace(/"/g, '""')} (${(viewingStudent.academicYear || "TA 2025/2026").replace(/"/g, '""')})"`,
        `"${s.subjectName.replace(/"/g, '""')}"`,
        `"${s.teacherName.replace(/"/g, '""')}"`,
        s.grades.length,
        s.grades.length > 0 ? s.avgScore : "-",
        s.grades.length === 0 ? "Belum Ada Nilai" : s.avgScore >= 70 ? "Tuntas" : "Perlu Bimbingan",
      ]);
      rows.push([
        "",
        "",
        "",
        "",
        `"RATA-RATA SELURUH MAPEL"`,
        "",
        `"${viewingStudentAttempts.length} total kuis"`,
        viewingOverallAvgScore,
        viewingOverallAvgScore >= 70 ? "Tuntas" : "Perlu Bimbingan",
      ]);
    } else {
      if (filteredViewingStudentAttempts.length === 0) {
        alert("Tidak ada data nilai untuk diekspor pada filter ini.");
        return;
      }
      headers = [
        "No",
        "NIS",
        "Nama Siswa",
        "Kelas",
        "Tahun Ajaran (TA)",
        "Judul Kuis",
        "Mata Pelajaran",
        "Tipe Kuis",
        "Nilai",
        "Tanggal Selesai",
      ];
      const avgScore = Math.round(
        filteredViewingStudentAttempts.reduce((sum, a) => sum + a.score, 0) / filteredViewingStudentAttempts.length
      );
      rows = filteredViewingStudentAttempts.map((a: any, idx) => [
        idx + 1,
        `"${(viewingStudent.nis || "").replace(/"/g, '""')}"`,
        `"${(viewingStudent.name || "").replace(/"/g, '""')}"`,
        `"${(a.className || viewingStudent.className || "").replace(/"/g, '""')}"`,
        `"${(a.academicYear || viewingStudent.academicYear || "TA 2025/2026").replace(/"/g, '""')}"`,
        `"${(a.title || "").replace(/"/g, '""')}"`,
        `"${(a.subjectName || "").replace(/"/g, '""')}"`,
        `"${a.type}"`,
        a.score,
        `"${(a.completedAt || "").replace(/"/g, '""')}"`,
      ]);
      rows.push([
        "",
        "",
        "",
        "",
        "",
        `"RATA-RATA NILAI"`,
        `"${viewingGradeSubjectFilter}"`,
        "",
        avgScore,
        `"Dari ${filteredViewingStudentAttempts.length} kuis"`,
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filterSlug = viewingGradeSubjectFilter === "ALL" ? "Rekap_SemuaMapel" : viewingGradeSubjectFilter.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute(
      "download",
      `Nilai_${viewingStudent.name.replace(/[^a-zA-Z0-9]/g, "_")}_${filterSlug}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintViewingStudentGrades = () => {
    if (!viewingStudent) {
      alert("Tidak ada data nilai untuk dicetak.");
      return;
    }
    const isAll = viewingGradeSubjectFilter === "ALL";
    if (isAll && viewingStudentSubjectSummaries.length === 0) {
      alert("Tidak ada data nilai untuk dicetak pada siswa ini.");
      return;
    }
    if (!isAll && filteredViewingStudentAttempts.length === 0) {
      alert("Tidak ada data nilai untuk dicetak pada filter mapel ini.");
      return;
    }

    const avgScore = isAll
      ? viewingOverallAvgScore
      : Math.round(
          filteredViewingStudentAttempts.reduce((sum, a) => sum + a.score, 0) /
            filteredViewingStudentAttempts.length
        );

    const academicYearStr = (viewingStudent.academicYear || "2025/2026").replace(/^TA\s*/i, "");

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
            ${viewingStudentSubjectSummaries
              .map(
                (s, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td><strong>${s.subjectName}</strong></td>
                <td>${s.teacherName}</td>
                <td class="text-center">${s.grades.length > 0 ? `${s.grades.length} Kuis (${s.pretestCount} Pretest, ${s.posttestCount} Posttest)` : "Belum ada evaluasi"}</td>
                <td class="text-center ${s.grades.length > 0 ? (s.avgScore >= 70 ? "score-pass" : "score-fail") : ""}">${s.grades.length > 0 ? s.avgScore : "-"}</td>
                <td class="text-center ${s.avgScore >= 70 && s.grades.length > 0 ? "score-pass" : ""}">${s.grades.length === 0 ? "Belum Diambil" : s.avgScore >= 70 ? "Tuntas" : "Perlu Bimbingan"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #64748b;">
              <td colspan="3" style="border: 1px solid #cbd5e1; background-color: #ffffff;"></td>
              <td class="text-center" style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; text-transform: uppercase;">Rata-rata Nilai Seluruh Mapel:</td>
              <td class="text-center ${avgScore >= 70 ? "score-pass" : "score-fail"}" style="border: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; padding: 10px;">${avgScore}</td>
              <td class="text-center" style="border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">(${viewingStudentSubjectSummaries.filter((s) => s.grades.length > 0).length} mapel dengan evaluasi)</td>
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
              <th class="text-center">Nilai</th>
              <th>Tanggal Selesai</th>
            </tr>
          </thead>
          <tbody>
            ${filteredViewingStudentAttempts
              .map(
                (a: any, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td><strong>${a.title}</strong></td>
                <td>${a.subjectName}</td>
                <td>${a.className || viewingStudent.className} <br/><span style="font-size: 10px; color: #64748b;">${a.academicYear || viewingStudent.academicYear || "TA 2025/2026"}</span></td>
                <td class="text-center">${a.type}</td>
                <td class="text-center ${a.score >= 70 ? "score-pass" : "score-fail"}">${a.score}</td>
                <td>${a.completedAt || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #64748b;">
              <td colspan="4" style="border: 1px solid #cbd5e1; background-color: #ffffff;"></td>
              <td class="text-center" style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; text-transform: uppercase;">Rata-rata Nilai:</td>
              <td class="text-center ${avgScore >= 70 ? "score-pass" : "score-fail"}" style="border: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; padding: 10px;">${avgScore}</td>
              <td class="text-center" style="border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">(Total ${filteredViewingStudentAttempts.length} kuis)</td>
            </tr>
          </tfoot>
        </table>
      `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transkrip Nilai Siswa - ${viewingStudent.name}</title>
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
                <td class="value">${viewingStudent.name}</td>
              </tr>
              <tr>
                <td class="label">NIS</td>
                <td class="colon">:</td>
                <td class="value">${viewingStudent.nis || "-"}</td>
              </tr>
              <tr>
                <td class="label">kelas</td>
                <td class="colon">:</td>
                <td class="value">${viewingStudent.className}</td>
              </tr>
              <tr>
                <td class="label">Tahun Ajaran</td>
                <td class="colon">:</td>
                <td class="value">${academicYearStr}</td>
              </tr>
            </tbody>
          </table>
          ${tableHtml}
        </body>
      </html>
    `;

    let printIframe = document.getElementById("teacher-student-print-frame") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "teacher-student-print-frame";
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

  const handleImportPretest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingPretest(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quiz/import-questions", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Gagal mengimpor soal.");
        return;
      }

      const importedQuestions = result.questions.map((q: any) => ({
        question: q.question,
        options: q.options && q.options.length >= 2 ? q.options : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      }));

      setSubjectPretestQuestions(importedQuestions);
      alert(`Berhasil mengimpor ${importedQuestions.length} soal dari file ke form pretest!`);
    } catch (err: any) {
      alert("Terjadi kesalahan saat memproses file: " + (err?.message || "Error"));
    } finally {
      setImportingPretest(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleImportPosttest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingPosttest(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quiz/import-questions", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Gagal mengimpor soal.");
        return;
      }

      const importedQuestions = result.questions.map((q: any) => ({
        question: q.question,
        options: q.options && q.options.length >= 2 ? q.options : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      }));

      setPosttestQuestions(importedQuestions);
      alert(`Berhasil mengimpor ${importedQuestions.length} soal dari file ke form posttest!`);
    } catch (err: any) {
      alert("Terjadi kesalahan saat memproses file: " + (err?.message || "Error"));
    } finally {
      setImportingPosttest(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleExportTeacherGradesCSV = () => {
    if (filteredGrades.length === 0) {
      alert("Tidak ada data nilai siswa untuk diekspor.");
      return;
    }
    const headers = ["No", "NIS", "Nama Siswa", "Kelas", "Mata Pelajaran", "Kuis / Evaluasi", "Tipe Kuis", "Nilai", "Tanggal Selesai"];
    const rows = filteredGrades.map((g, idx) => [
      idx + 1,
      `"${(g.nis || "").replace(/"/g, '""')}"`,
      `"${(g.studentName || "").replace(/"/g, '""')}"`,
      `"${(g.className || "").replace(/"/g, '""')}"`,
      `"${(g.subjectName || "").replace(/"/g, '""')}"`,
      `"${(g.quizTitle || "").replace(/"/g, '""')}"`,
      `"${g.type}"`,
      `${g.score}%`,
      `"${(g.completedAt || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekapitulasi_Nilai_Siswa_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTeacherGrades = () => {
    if (filteredGrades.length === 0) {
      alert("Tidak ada data nilai siswa untuk dicetak.");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Nilai Siswa - ${data?.teacher?.name || "Guru"}</title>
          <style>
            @page {
              size: A4 landscape;
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
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0;
              color: #0f172a;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 5px;
            }
            .meta {
              font-size: 12px;
              margin-bottom: 15px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .text-center {
              text-align: center !important;
            }
            .score-pass {
              color: #047857;
              font-weight: bold;
            }
            .score-fail {
              color: #b91c1c;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DIGIMIND - LAPORAN REKAPITULASI NILAI SISWA</div>
            <div class="subtitle">Sistem Monitoring Literasi & Evaluasi Akademik Adaptif</div>
          </div>
          <div class="meta">
            <div><strong>Guru Pengampu:</strong> ${data?.teacher?.name || "-"} (${data?.teacher?.nip || "NIP: -"})</div>
            <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</div>
            <div><strong>Filter Kelas:</strong> ${selectedClassFilter === "ALL" ? "Semua Kelas" : selectedClassFilter}</div>
            <div><strong>Total Data:</strong> ${filteredGrades.length} Lembar Pengerjaan</div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 35px;">No</th>
                <th style="width: 80px;">NIS</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Kuis / Evaluasi</th>
                <th class="text-center">Tipe</th>
                <th class="text-center">Nilai</th>
                <th>Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGrades
                .map(
                  (g, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${g.nis}</td>
                  <td><strong>${g.studentName}</strong></td>
                  <td>${g.className}</td>
                  <td>${g.subjectName}</td>
                  <td>${g.quizTitle}</td>
                  <td class="text-center">${g.type}</td>
                  <td class="text-center ${g.score >= 70 ? "score-pass" : "score-fail"}">${g.score}</td>
                  <td>${g.completedAt || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    let printIframe = document.getElementById("teacher-grades-print-frame") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "teacher-grades-print-frame";
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
    const isSessionExpired =
      error?.toLowerCase().includes("login") ||
      error?.toLowerCase().includes("akses ditolak") ||
      error?.toLowerCase().includes("sesi") ||
      error?.toLowerCase().includes("unauthorized");

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] p-6 text-white">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-zinc-950/80 p-8 text-center shadow-2xl space-y-4 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-2xl font-black">
            {isSessionExpired ? <Lock className="w-7 h-7 text-rose-400" /> : <AlertTriangle className="w-7 h-7 text-rose-400" />}
          </div>
          <h3 className="text-lg font-black text-rose-400">
            {isSessionExpired ? "Sesi Login Berakhir" : "Gagal Memuat Data"}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            {error || "Data tidak tersedia atau terjadi gangguan koneksi."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {isSessionExpired ? (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2.5 text-xs font-bold text-white transition shadow-md cursor-pointer"
              >
                Login Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2.5 text-xs font-bold text-white transition shadow-md cursor-pointer"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isWaliKelas = data?.teacher?.type === "wali_kelas";

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 w-full">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-[#5A77DF]/5 blur-[140px]" />
        <div className="absolute top-1/3 right-10 h-[350px] w-[350px] rounded-full bg-emerald-900/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="DigiMind"
              className="h-9 sm:h-12 w-auto max-w-[130px] sm:max-w-none object-contain"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            {data?.teacher && (
              <button
                type="button"
                onClick={() => setActiveView("profil")}
                className="flex items-center gap-2.5 text-left hover:opacity-90 transition cursor-pointer group"
              >
                <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full p-[2px] bg-gradient-to-tr from-[#5A77DF] via-[#7B93EC] to-purple-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-[#5A77DF] to-[#3E53A2] text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-inner">
                    {data.teacher.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h4 className="text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-[#5A77DF] transition-colors">
                    {data.teacher.name}
                  </h4>
                  <p className="text-xs font-semibold text-zinc-400 leading-tight">
                    {data.teacher.position || "Guru BK"}
                  </p>
                </div>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-full text-zinc-900 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center"
                title="Notifikasi Alert Siswa"
              >
                <Bell className="w-5 h-5 text-zinc-900 fill-zinc-900" />
                {data?.alerts && data.alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white shadow-xs" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-88 max-w-xs rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl z-50 animate-fadeIn space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <h4 className="text-xs font-extrabold text-zinc-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#5A77DF]" /> Notifikasi
                      Alert Siswa
                    </h4>
                    <span className="text-3xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {data?.alerts?.filter(
                        (a) => !dismissedAlertIds.includes(a.id),
                      )?.length || 0}{" "}
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                    {data?.alerts &&
                    data.alerts.filter((a) => !dismissedAlertIds.includes(a.id))
                      .length > 0 ? (
                      data.alerts
                        .filter((a) => !dismissedAlertIds.includes(a.id))
                        .map((student) => (
                          <div
                            key={student.id}
                            className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-2xs space-y-1.5 text-left transition hover:bg-rose-50"
                          >
                            <div className="flex items-center justify-between font-bold text-rose-900">
                              <span className="flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Perlu Pendampingan!</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDismissedAlertIds((prev) => [
                                    ...prev,
                                    student.id,
                                  ]);
                                }}
                                className="text-3xs text-zinc-400 hover:text-zinc-700 font-extrabold px-1 cursor-pointer"
                                title="Tandai Dibaca"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-3xs text-zinc-700 leading-relaxed font-medium">
                              Siswa{" "}
                              <span className="font-bold text-zinc-900">
                                {student.name}
                              </span>{" "}
                              ({student.className || "Kelas Binaan"}) terdeteksi
                              berisiko kesehatan mental ({student.mentalStatus}
                              ).
                            </p>
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveView("siswa");
                                  setShowNotifDropdown(false);
                                }}
                                className="text-4xs font-extrabold text-[#3E53A2] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Lihat Detail Siswa</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="py-6 text-center space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-700">
                          Tidak Ada Alert Risiko!
                        </p>
                        <p className="text-3xs text-zinc-500">
                          Semua siswa saat ini dalam kondisi kesehatan mental
                          terpantau aman.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-6 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col gap-6 xl:flex-row items-start">
          {/* DESKTOP SIDEBAR (Visible on xl screens) */}
          <aside className="hidden xl:block w-72 shrink-0 xl:sticky xl:top-24 self-start z-30">
            <div className="rounded-2xl border border-[#5A77DF] bg-[#5A77DF] p-4 shadow-lg text-white space-y-3">
              <div className="border-b border-white/20 px-2 pb-3">
                <p className="text-2xs font-extrabold uppercase tracking-[0.25em] text-white/70 font-mono">
                  Menu
                </p>
                <h2 className="text-sm font-black text-white">
                  {isWaliKelas ? "Wali Kelas" : "Guru"}
                </h2>
              </div>
              <div className="mt-3 space-y-2">
                {(data?.teacher?.type === "bk"
                  ? [
                      {
                        id: "home",
                        label: "Home",
                        icon: <Home className="w-4 h-4" />,
                      },
                      {
                        id: "siswa",
                        label: "Siswa",
                        icon: <Users className="w-4 h-4" />,
                      },
                      // { id: "insight", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
                      {
                        id: "intervensi",
                        label: "Intervensi Chat",
                        icon: <MessageSquare className="w-4 h-4" />,
                      },
                      {
                        id: "profil",
                        label: "Profil",
                        icon: <User className="w-4 h-4" />,
                      },
                    ]
                  : isWaliKelas
                    ? [
                        {
                          id: "home",
                          label: "Home",
                          icon: <Home className="w-4 h-4" />,
                        },
                        {
                          id: "siswa",
                          label: "Semua Siswa",
                          icon: <Users className="w-4 h-4" />,
                        },
                        {
                          id: "guru_pengampu",
                          label: "Guru Pengampu Mapel",
                          icon: <GraduationCap className="w-4 h-4" />,
                        },
                        // { id: "insight", label: "Insight AI", icon: <Sparkles className="w-4 h-4" /> },
                        {
                          id: "mapel",
                          label: "Mata Pelajaran & Modul",
                          icon: <BookOpen className="w-4 h-4" />,
                        },
                        {
                          id: "badge",
                          label: "Lencana Kelas",
                          icon: <Award className="w-4 h-4" />,
                        },
                        {
                          id: "profil",
                          label: "Profil",
                          icon: <User className="w-4 h-4" />,
                        },
                      ]
                    : [
                        {
                          id: "home",
                          label: "Home",
                          icon: <Home className="w-4 h-4" />,
                        },
                        {
                          id: "siswa",
                          label: "Semua Siswa",
                          icon: <Users className="w-4 h-4" />,
                        },
                        // { id: "insight", label: "Insight", icon: <Sparkles className="w-4 h-4" /> },
                        {
                          id: "mapel",
                          label: "Mata Pelajaran & Modul",
                          icon: <BookOpen className="w-4 h-4" />,
                        },
                        {
                          id: "badge",
                          label: "Badge",
                          icon: <Award className="w-4 h-4" />,
                        },
                        {
                          id: "profil",
                          label: "Profil",
                          icon: <User className="w-4 h-4" />,
                        },
                      ]
                ).map((item) => {
                  const isActive = activeView === item.id;
                  const isSiswaMenu = item.id === "siswa";
                  const isMapelMenu = item.id === "mapel";

                  if (isSiswaMenu) {
                    const isExpanded = expandedMenu === "siswa";
                    const isWaliKelas = data?.teacher?.type === "wali_kelas";
                    const isBK = data?.teacher?.type === "bk";
                    
                    const hasMultipleClasses = !!(data?.teacher?.classes && data.teacher.classes.length > 0);
                    const hasSubjects = !!(data?.teacher?.subjects && data.teacher.subjects.length > 0 && !isWaliKelas && !isBK);
                    const hasChildMenus = hasMultipleClasses || hasSubjects;

                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView("siswa");
                            if (hasChildMenus) {
                              setExpandedMenu(isExpanded ? null : "siswa");
                            }
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? "border-white bg-white text-[#3E53A2] shadow-md"
                              : "border-transparent text-white/85 hover:bg-white/15 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {hasChildMenus && (
                            isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 opacity-75" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
                            )
                          )}
                        </button>

                        {isExpanded && hasChildMenus && (
                          <div className="ml-2 pl-2 space-y-2 py-1.5 text-xs animate-fadeIn">
                            {/* All Students Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClassFilter("ALL");
                                setSelectedSubjectFilter("ALL");
                                setSelectedMapelFilterId("ALL");
                                setSelectedTAFilter("ALL");
                                setGuruMapelStudentViewMode("ALL");
                                setActiveView("siswa");
                              }}
                              className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-3xs font-extrabold transition cursor-pointer ${
                                selectedClassFilter === "ALL" &&
                                selectedSubjectFilter === "ALL" &&
                                selectedMapelFilterId === "ALL" &&
                                selectedTAFilter === "ALL" &&
                                guruMapelStudentViewMode === "ALL"
                                  ? "bg-white text-[#3E53A2] shadow-sm font-black"
                                  : "bg-white/10 text-white hover:bg-white/20"
                              }`}
                            >
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span>Semua Siswa</span>
                            </button>

                            {/* Group 1: Filter Kelas Binaan (Untuk Guru BK atau Wali Kelas) */}
                            {(isBK || isWaliKelas) &&
                              data?.teacher?.classes &&
                              data.teacher.classes.length > 0 && (
                                <div className="space-y-1 bg-black/10 p-2 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-3xs font-extrabold tracking-wider uppercase text-cyan-200">
                                    <School className="w-3 h-3 text-cyan-300" />
                                    <span>Kelas Binaan</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {data.teacher.classes.map((c) => {
                                      const isClassSelected =
                                        selectedClassFilter === String(c.id) ||
                                        selectedClassFilter === c.name;
                                      return (
                                        <button
                                          key={`class-${c.id}`}
                                          type="button"
                                          onClick={() => {
                                            setSelectedClassFilter(String(c.id));
                                            setSelectedSubjectFilter("ALL");
                                            setSelectedMapelFilterId("ALL");
                                            setSelectedTAFilter("ALL");
                                            setGuruMapelStudentViewMode("ALL");
                                            setActiveView("siswa");
                                          }}
                                          className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-3xs font-bold transition cursor-pointer ${
                                            isClassSelected
                                              ? "bg-white text-[#3E53A2] shadow-2xs font-extrabold"
                                              : "text-white/85 hover:bg-white/15 hover:text-white"
                                          }`}
                                        >
                                          <span className="truncate">
                                            {c.name}
                                          </span>
                                          <span className="text-4xs font-mono bg-white/20 px-1.5 py-0.5 rounded-md text-white shrink-0 ml-1">
                                            {c.academicYear || (c.year ? `TA ${c.year}` : "TA 2025/2026")}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            {/* Group 2: Filter Mapel Berdasarkan Tahun Ajaran */}
                            {(!isWaliKelas && !isBK) &&
                              groupedSubjectsByTA.length > 0 && (
                                <div className="space-y-2">
                                  {groupedSubjectsByTA.map(([taName, subjectsInTA]) => {
                                    const rawYear = taName.replace(/^TA\s*/i, "").trim();
                                    const isTAActive =
                                      selectedTAFilter !== "ALL" &&
                                      selectedTAFilter.replace(/^TA\s*/i, "").trim() === rawYear &&
                                      guruMapelStudentViewMode === "ALL";

                                    return (
                                      <div
                                        key={`ta-group-${taName}`}
                                        className="space-y-1 bg-black/10 p-2 rounded-xl border border-white/10"
                                      >
                                        {/* TA Header Button */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedTAFilter(rawYear);
                                            setSelectedSubjectFilter("ALL");
                                            setSelectedMapelFilterId("ALL");
                                            setSelectedClassFilter("ALL");
                                            setGuruMapelStudentViewMode("ALL");
                                            setActiveView("siswa");
                                          }}
                                          className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-3xs font-extrabold tracking-wider uppercase transition cursor-pointer ${
                                            isTAActive
                                              ? "bg-white text-[#3E53A2] shadow-2xs font-black"
                                              : "text-cyan-200 hover:bg-white/10 hover:text-white"
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <Calendar className={`w-3 h-3 shrink-0 ${isTAActive ? "text-[#3E53A2]" : "text-cyan-300"}`} />
                                            <span className="truncate">{taName}</span>
                                          </div>
                                          <span
                                            className={`text-4xs font-mono px-1.5 py-0.5 rounded-md shrink-0 ml-1 font-bold ${
                                              isTAActive ? "bg-[#3E53A2]/15 text-[#3E53A2]" : "bg-white/20 text-white"
                                            }`}
                                          >
                                            {subjectsInTA.length} Mapel
                                          </span>
                                        </button>

                                        {/* List Mapel under this TA */}
                                        <div className="space-y-1 pl-1">
                                          {subjectsInTA.map((s: any) => {
                                            const isSelected =
                                              guruMapelStudentViewMode === "BY_MAPEL" &&
                                              String(selectedMapelFilterId) === String(s.id);

                                            const classTitle = s.rawClassName
                                              ? (s.rawClassName.toLowerCase().startsWith("kelas") ? s.rawClassName : `Kelas ${s.rawClassName}`)
                                              : (s.className?.toLowerCase().startsWith("kelas") ? s.className : `Kelas ${s.className || "-"}`);
                                            const majorTitle = s.classMajor ? `• ${s.classMajor}` : "";

                                            return (
                                              <button
                                                key={`subj-${s.id}`}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedSubjectFilter(s.name);
                                                  setSelectedMapelFilterId(s.id);
                                                  setSelectedTAFilter(rawYear);
                                                  setGuruMapelStudentViewMode("BY_MAPEL");
                                                  setSelectedClassFilter("ALL");
                                                  setActiveView("siswa");
                                                }}
                                                className={`flex w-full flex-col gap-0.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                                                  isSelected
                                                    ? "bg-white text-[#3E53A2] shadow-sm font-extrabold"
                                                    : "text-white/85 hover:bg-white/15 hover:text-white"
                                                }`}
                                              >
                                                <div className="flex items-center justify-between w-full gap-1">
                                                  <span className="truncate text-xs font-black">
                                                    {s.name}
                                                  </span>
                                                </div>
                                                <div
                                                  className={`text-[10px] font-mono font-medium truncate ${
                                                    isSelected ? "text-zinc-600 font-semibold" : "text-white/75"
                                                  }`}
                                                >
                                                  {classTitle} {majorTitle}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isMapelMenu) {
                    const isExpanded = expandedMenu === "mapel";
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView("mapel");
                            if (
                              data?.teacher?.subjects &&
                              data.teacher.subjects.length > 0 &&
                              (selectedMapelFilterId === "ALL" ||
                                !selectedMapelFilterId)
                            ) {
                              const firstId = data.teacher.subjects[0].id;
                              setSelectedMapelFilterId(firstId);
                              setActiveSubjectIdForModule(firstId);
                            }
                            setExpandedMenu(isExpanded ? null : "mapel");
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? "border-white bg-white text-[#3E53A2] shadow-md"
                              : "border-transparent text-white/85 hover:bg-white/15 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 opacity-75" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 opacity-75" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="ml-2 pl-2 space-y-2 py-1.5 text-xs animate-fadeIn">
                            {data?.teacher?.subjects &&
                              data.teacher.subjects.length > 0 && (
                                <div className="space-y-1 bg-black/10 p-2 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-3xs font-extrabold tracking-wider uppercase text-violet-200">
                                    <BookOpen className="w-3 h-3 text-violet-300" />
                                    <span>Daftar Modul</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {data.teacher.subjects.map((s) => (
                                      <button
                                        key={`mod-subj-${s.id}`}
                                        type="button"
                                        onClick={() => {
                                          setSelectedMapelFilterId(s.id);
                                          setActiveSubjectIdForModule(s.id);
                                          setActiveView("mapel");
                                        }}
                                        className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-3xs font-bold transition cursor-pointer ${
                                          selectedMapelFilterId === s.id
                                            ? "bg-white text-[#3E53A2] shadow-2xs font-extrabold"
                                            : "text-white/85 hover:bg-white/15 hover:text-white"
                                        }`}
                                      >
                                        <span className="truncate">
                                          {s.name}
                                        </span>
                                        <span className="text-4xs font-mono bg-white/20 px-1.5 py-0.5 rounded-md text-white shrink-0">
                                          {s.classYear ? `TA ${s.classYear}` : "TA 2025/2026"}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {!isWaliKelas && (
                              <div className="space-y-1 pt-1 border-t border-white/15">
                                <button
                                  type="button"
                                  onClick={openAddSubjectModal}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-3xs font-extrabold bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/45 transition border border-emerald-400/40 cursor-pointer shadow-2xs"
                                >
                                  <PlusCircle className="w-4 h-4 shrink-0 text-emerald-300" />
                                  <span>+ Tambah Kelas & Mapel</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveView(item.id as any);
                        if (
                          item.id === "intervensi" &&
                          data?.students?.[0]?.id
                        ) {
                          setActiveChatStudentId(data.students[0].id);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "border-white bg-white text-[#3E53A2] shadow-md"
                          : "border-transparent text-white/85 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tombol Tambah / Kelola Kelas Binaan untuk Guru BK */}
              {(data?.teacher?.type === "bk" || data?.teacher?.position?.toLowerCase().includes("bk") || data?.teacher?.specialization?.toLowerCase().includes("bk")) && (
                <div className="pt-3 border-t border-white/20 space-y-2">
                  {/* <p className="text-3xs font-extrabold uppercase tracking-widest text-white/70 font-mono">
                    Kelas Binaan BK
                  </p> */}
                  <button
                    type="button"
                    onClick={() => {
                      fetchClasses();
                      setShowManageBkClassModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#3E53A2] hover:bg-zinc-100 px-3.5 py-2.5 text-xs font-black transition shadow-md cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-[#5A77DF]" />
                    <span>+ Tambah / Kelola Kelas</span>
                  </button>

                </div>
              )}
            </div>
          </aside>

          {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on mobile/tablet screens for Teachers) */}
          <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-2xl px-1 py-1.5 flex items-center justify-around">
            {(data?.teacher?.type === "bk"
              ? [
                  {
                    id: "home",
                    label: "Home",
                    icon: <Home className="w-4 h-4" />,
                  },
                  {
                    id: "siswa",
                    label: "Siswa",
                    icon: <Users className="w-4 h-4" />,
                  },
                  {
                    id: "insight",
                    label: "Insight",
                    icon: <Sparkles className="w-4 h-4" />,
                  },
                  {
                    id: "intervensi",
                    label: "Chat BK",
                    icon: <MessageSquare className="w-4 h-4" />,
                  },
                  {
                    id: "profil",
                    label: "Profil",
                    icon: <User className="w-4 h-4" />,
                  },
                ]
              : isWaliKelas
                ? [
                    {
                      id: "home",
                      label: "Home",
                      icon: <Home className="w-4 h-4" />,
                    },
                    {
                      id: "siswa",
                      label: "Siswa",
                      icon: <Users className="w-4 h-4" />,
                    },
                    {
                      id: "guru_pengampu",
                      label: "Guru",
                      icon: <GraduationCap className="w-4 h-4" />,
                    },
                    {
                      id: "mapel",
                      label: "Modul",
                      icon: <BookOpen className="w-4 h-4" />,
                    },
                    {
                      id: "badge",
                      label: "Lencana",
                      icon: <Award className="w-4 h-4" />,
                    },
                    {
                      id: "profil",
                      label: "Profil",
                      icon: <User className="w-4 h-4" />,
                    },
                  ]
                : [
                    {
                      id: "home",
                      label: "Home",
                      icon: <Home className="w-4 h-4" />,
                    },
                    {
                      id: "siswa",
                      label: "Siswa",
                      icon: <Users className="w-4 h-4" />,
                    },
                    {
                      id: "mapel",
                      label: "Modul",
                      icon: <BookOpen className="w-4 h-4" />,
                    },
                    {
                      id: "badge",
                      label: "Badge",
                      icon: <Award className="w-4 h-4" />,
                    },
                    {
                      id: "profil",
                      label: "Profil",
                      icon: <User className="w-4 h-4" />,
                    },
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
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "text-[#5A77DF] font-extrabold"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <span
                    className={`p-1 rounded-lg ${isActive ? "bg-[#5A77DF]/15 text-[#5A77DF]" : ""}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[9px] sm:text-[10px] leading-tight font-semibold mt-0.5 truncate max-w-[54px] sm:max-w-[70px]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <main className="flex-1 min-w-0 w-full space-y-6">
            {activeView === "profil" && (
              <section className="w-full animate-fadeIn">
                <div className="rounded-3xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <h2 className="text-xl font-black text-zinc-900">Profil</h2>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 px-4 py-2 text-2xs font-extrabold text-[#3E53A2] hover:bg-[#5A77DF]/20 transition cursor-pointer shadow-2xs"
                      >
                        Edit Profil
                      </button>
                    )}
                  </div>

                  {profileMessage && (
                    <div
                      className={`p-4 rounded-xl text-xs font-semibold ${
                        profileMessage.includes("berhasil")
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {profileMessage}
                    </div>
                  )}

                  {isEditingProfile ? (
                    /* Edit Profile Mode */
                    <form
                      onSubmit={handleSaveProfile}
                      className="space-y-4 text-left"
                    >
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
                            Keahlian / Spesialisasi
                          </label>
                          <input
                            type="text"
                            value={editSpecialization}
                            onChange={(e) =>
                              setEditSpecialization(e.target.value)
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Jabatan
                          </label>
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            No. Telepon / HP
                          </label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Contoh: 0812xxxxxxxx"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Status Akun
                          </label>
                          <input
                            type="text"
                            disabled
                            value="Aktif & Terverifikasi"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 font-bold outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Password Baru (Opsional)
                          </label>
                          <div className="relative">
                            <input
                              type={showProfileNewPass ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Password baru"
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowProfileNewPass(!showProfileNewPass)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                            >
                              {showProfileNewPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Konfirmasi Password Baru
                          </label>
                          <div className="relative">
                            <input
                              type={
                                showProfileConfirmPass ? "text" : "password"
                              }
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Ulangi password baru"
                              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowProfileConfirmPass(
                                  !showProfileConfirmPass,
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                            >
                              {showProfileConfirmPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-bold transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="flex-1 py-3 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* View Profile Mode */
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5A77DF]/10 border border-[#5A77DF]/30 shadow-xs text-[#3E53A2]">
                          <User className="w-8 h-8 text-[#5A77DF]" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-xl font-black text-zinc-900">
                            {data?.teacher?.name}
                          </h2>
                          <p className="text-xs text-[#3E53A2] font-extrabold mt-0.5">
                            {data?.teacher?.type === "bk"
                              ? "Guru Bimbingan Konseling (BK)"
                              : "Guru Mata Pelajaran"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-left shadow-xs">
                            <span className="block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              NIP / NUPTK
                            </span>
                            <span className="mt-1 block text-sm font-extrabold text-zinc-900">
                              {data?.teacher?.nip}
                            </span>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-left shadow-xs">
                            <span className="block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              Keahlian / Spesialisasi
                            </span>
                            <span className="mt-1 block text-sm font-extrabold text-zinc-900">
                              {data?.teacher?.specialization || "-"}
                            </span>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-left shadow-xs">
                            <span className="block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              No. Telepon / HP
                            </span>
                            <span className="mt-1 block text-sm font-extrabold text-zinc-900">
                              {data?.teacher?.phone_number || "-"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-left shadow-xs">
                            <span className="block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              Jabatan
                            </span>
                            <span className="mt-1 block text-sm font-extrabold text-zinc-900">
                              {data?.teacher?.position || "-"}
                            </span>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-left shadow-xs">
                            <span className="block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                              Status Akun
                            </span>
                            <span className="mt-1 inline-block text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                              Aktif & Terverifikasi
                            </span>
                          </div>
                        </div>

                        {/* Keamanan & Ganti Password Section */}
                        <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 text-left space-y-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lock className="h-5 w-5 text-[#5A77DF]" />
                              <h4 className="text-sm font-extrabold text-zinc-900">
                                Keamanan & Ganti Password
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setShowChangePasswordSection(
                                  !showChangePasswordSection,
                                )
                              }
                              className="text-xs font-extrabold text-[#5A77DF] hover:underline cursor-pointer"
                            >
                              {showChangePasswordSection
                                ? "Tutup Form"
                                : "Ubah Password"}
                            </button>
                          </div>

                          {showChangePasswordSection && (
                            <form
                              onSubmit={handleChangePasswordTeacher}
                              className="space-y-4 pt-2 border-t border-zinc-100"
                            >
                              {changePasswordMsg && (
                                <div
                                  className={`p-3.5 rounded-xl text-2xs font-bold ${changePasswordMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}
                                >
                                  {changePasswordMsg.text}
                                </div>
                              )}

                              <div className="space-y-1.5">
                                <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                                  Password Lama
                                </label>
                                <div className="relative">
                                  <input
                                    type={showOldPass ? "text" : "password"}
                                    required
                                    value={oldPassword}
                                    onChange={(e) =>
                                      setOldPassword(e.target.value)
                                    }
                                    placeholder="Masukkan password saat ini"
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowOldPass(!showOldPass)}
                                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                                  >
                                    {showOldPass ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                                    Password Baru
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showNewPass ? "text" : "password"}
                                      required
                                      value={newPassword}
                                      onChange={(e) =>
                                        setNewPassword(e.target.value)
                                      }
                                      placeholder="Minimal 6 karakter"
                                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowNewPass(!showNewPass)
                                      }
                                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                                    >
                                      {showNewPass ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                                    Konfirmasi Password Baru
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={
                                        showConfirmPass ? "text" : "password"
                                      }
                                      required
                                      value={confirmPassword}
                                      onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                      }
                                      placeholder="Ulangi password baru"
                                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowConfirmPass(!showConfirmPass)
                                      }
                                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                                    >
                                      {showConfirmPass ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={changingPassword}
                                className="w-full py-2.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] text-white text-xs font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50"
                              >
                                {changingPassword
                                  ? "Memproses..."
                                  : "Simpan Password Baru"}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 border-t border-zinc-100 pt-6 flex justify-end">
                        <button
                          onClick={handleLogout}
                          className="rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-extrabold text-white transition shadow-xs cursor-pointer"
                        >
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeView === "home" && (
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
                        <span>
                          {new Date().toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                        Selamat Datang Kembali,{" "}
                        {data.teacher.name.split(" ")[0]}!
                      </h1>

                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                        Selalu terhubung di portal guru Anda. Pantau
                        perkembangan emosional, hasil kuis, dan intervensi siswa
                        secara real-time di DigiMind!
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-2.5">
                        <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-3xs font-extrabold text-white flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-cyan-300" />
                          <span>
                            {data.classSummary.totalStudents} Siswa Binaan
                          </span>
                        </div>
                        <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-3xs font-extrabold text-white flex items-center gap-2">
                          {data.teacher.type === "bk" ? (
                            <>
                              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Guru Bimbingan Konseling (BK)</span>
                            </>
                          ) : data.teacher.type === "wali_kelas" ||
                            isWaliKelas ? (
                            <>
                              <School className="w-3.5 h-3.5 text-amber-300" />
                              <span>
                                {data.teacher.assignedClass
                                  ? `Wali Kelas ${data.teacher.assignedClass.name}`
                                  : data.classSummary.classes.length > 0
                                    ? `Wali Kelas ${data.classSummary.classes.join(", ")}`
                                    : "Wali Kelas"}
                              </span>
                            </>
                          ) : data.teacher.subjects &&
                            data.teacher.subjects.length > 0 ? (
                            <>
                              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                              <span>
                                {
                                  Array.from(
                                    new Set(
                                      data.teacher.subjects.map((s) => s.name),
                                    ),
                                  ).length
                                }{" "}
                                Mapel Diampu
                              </span>
                            </>
                          ) : (
                            <>
                              <School className="w-3.5 h-3.5 text-amber-300" />
                              <span>Guru • Wali Kelas</span>
                            </>
                          )}
                        </div>

                        {data.teacher.type === "bk" && (
                          <div className="flex items-center gap-1.5">
                            <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-3xs font-extrabold text-white flex items-center gap-2">
                              <School className="w-3.5 h-3.5 text-emerald-300" />
                              <span>
                                {data.teacher.assignedClass
                                  ? `Kelas Binaan: ${data.teacher.assignedClass.name} (${data.teacher.assignedClass.major})`
                                  : "Kelas Binaan: Semua Kelas"}
                              </span>
                            </div>
                          </div>
                        )}
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

                {isWaliKelas && (
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-4 text-xs font-semibold text-[#3E53A2] flex items-center gap-3 animate-fadeIn shadow-sm">
                    <School className="w-5 h-5 text-[#5A77DF] shrink-0" />
                    <div className="text-left">
                      <div className="font-extrabold text-[#3E53A2] flex items-center gap-2">
                        <span>
                          Mode Akses Wali Kelas (Pemantauan Read-Only)
                        </span>
                        <span className="rounded-full bg-[#5A77DF]/10 px-2 py-0.5 text-3xs font-mono font-bold text-[#3E53A2] uppercase border border-[#5A77DF]/20">
                          {data.classSummary.classes.join(", ")}
                        </span>
                      </div>
                      <div className="text-3xs text-zinc-600 font-normal mt-0.5">
                        Anda memiliki akses pemantauan lengkap untuk seluruh
                        mata pelajaran & perkembangan siswa di kelas binaan ini.
                        Pengelolaan isi modul & kuis dilakukan oleh
                        masing-masing Guru Mata Pelajaran.
                      </div>
                    </div>
                  </div>
                )}
                <section className="grid gap-4 animate-fadeIn">
                  <div className="space-y-4">
                    {/* Single Unified Card: Progres Modul Mapel di Semua Siswa */}
                    <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                      <div className="space-y-1">
                        <p className="text-2xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                          Rata-rata Progres Belajar Kelas
                        </p>
                        <h2 className="text-xl font-black text-zinc-900">
                          Progres Modul Mapel di Semua Siswa
                        </h2>
                        <p className="text-xs text-zinc-600 max-w-xl leading-relaxed">
                          Persentase rata-rata penyelesaian modul pembelajaran
                          mata pelajaran oleh seluruh siswa terdaftar di kelas
                          Anda.
                        </p>
                      </div>

                      {/* Circle Diagram SVG (Diagram Lingkaran Progress) */}
                      <div className="flex items-center gap-5 bg-[#5A77DF]/5 border border-[#5A77DF]/20 px-6 py-4 rounded-2xl shrink-0 shadow-xs">
                        <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
                          <svg
                            className="h-20 w-20 transform -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#E4E4E7"
                              strokeWidth="10"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#5A77DF"
                              strokeWidth="10"
                              strokeDasharray={251.2}
                              strokeDashoffset={
                                251.2 -
                                (251.2 *
                                  (data.classSummary.averageSubjectProgress ||
                                    0)) /
                                  100
                              }
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-base font-black text-[#3E53A2] leading-none">
                              {data.classSummary.averageSubjectProgress}%
                            </span>
                          </div>
                        </div>
                        <div className="text-left space-y-1">
                          <span className="text-xs font-black text-[#3E53A2] block">
                            Progres Rata-rata
                          </span>
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-zinc-500 font-mono block">
                            Seluruh Siswa
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A77DF] bg-[#5A77DF]/10 px-2 py-0.5 rounded-full border border-[#5A77DF]/20">
                            <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" />{" "}
                            Aktif
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 text-left">
                      {/* Card Diagram Batang SVG: Mood Siswa Minggu Ini */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-3">
                            <div>
                              <p className="text-2xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                                Grafik Mood Siswa
                              </p>
                              <h2 className="mt-1 text-base font-extrabold text-zinc-900">
                                Mood Siswa Minggu Ini (Diagram Batang)
                              </h2>
                            </div>
                            <div className="rounded-full border border-[#5A77DF]/20 bg-[#5A77DF]/10 px-3 py-1 text-2xs font-bold text-[#3E53A2] shrink-0">
                              {data.classSummary.totalStudents} Siswa Aktif
                            </div>
                          </div>

                          <div className="mt-5 space-y-4">
                            {(() => {
                              const totalStudents = data?.classSummary?.totalStudents ?? 0;
                              const positiveMoodCount = totalStudents > 0 ? Math.max(0, totalStudents - lowMoodCount) : 0;
                              const positiveMoodPercentage = totalStudents > 0 ? Math.max(0, 100 - lowMoodPercentage) : 0;
                              const displayLowMoodPercentage = totalStudents > 0 ? lowMoodPercentage : 0;

                              return (
                                <div className="space-y-3">
                                  {/* Bar 1: Mood Stabil & Positif */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                      <span className="text-zinc-700 font-extrabold flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                                        Mood Stabil & Positif
                                      </span>
                                      <span className="font-extrabold text-emerald-600 font-mono">
                                        {positiveMoodCount} Siswa ({positiveMoodPercentage}%)
                                      </span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden p-0.5 border border-zinc-200/60">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                                        style={{
                                          width: `${positiveMoodPercentage}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Bar 2: Mood Perhatian & Rendah */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                      <span className="text-zinc-700 font-extrabold flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                                        Mood Perhatian / Rendah
                                      </span>
                                      <span className="font-extrabold text-amber-600 font-mono">
                                        {totalStudents > 0 ? lowMoodCount : 0} Siswa ({displayLowMoodPercentage}%)
                                      </span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden p-0.5 border border-zinc-200/60">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
                                        style={{ width: `${displayLowMoodPercentage}%` }}
                                      />
                                    </div>
                                  </div>

                                  {totalStudents === 0 && (
                                    <p className="text-3xs text-zinc-400 italic pt-1">
                                      Belum ada data siswa terdaftar untuk menampilkan distribusi mood.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 mt-4">
                          <p className="text-3xs text-zinc-500 leading-relaxed font-medium">
                            Diagram batang ini menyajikan distribusi kondisi
                            emosional siswa berdasarkan pencatatan jurnal
                            refleksi harian terbaru.
                          </p>
                        </div>
                      </div>

                      {/* Unified Alert Risiko Card */}
                      <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <div>
                              <p className="text-2xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                                Alert Risiko
                              </p>
                              <h2 className="mt-1 text-base font-extrabold text-zinc-900">
                                Peringatan Siswa yang Butuh Perhatian
                              </h2>
                            </div>
                            <span className="rounded-full border border-[#5A77DF]/20 bg-[#5A77DF]/10 px-3 py-1 text-2xs font-bold text-[#3E53A2] shrink-0">
                              {data.alerts.length} Aktif
                            </span>
                          </div>
                          <div className="mt-4 space-y-3 max-h-[440px] overflow-y-auto pr-1">
                            {data.alerts.length > 0 ? (
                              data.alerts.map((student) => (
                                <div
                                  key={student.id}
                                  className="rounded-2xl border border-[#5A77DF]/20 bg-white p-4 text-xs text-zinc-900 shadow-xs space-y-2.5 transition hover:border-[#5A77DF]"
                                >
                                  {/* Header row */}
                                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-xl bg-[#5A77DF]/10 border border-[#5A77DF]/30 text-[#3E53A2] font-extrabold flex items-center justify-center text-xs shrink-0">
                                        {student.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-extrabold text-zinc-900 text-xs">
                                          {student.name}
                                        </h4>
                                        <p className="text-4xs text-zinc-500 font-mono">
                                          {student.className || "Kelas Binaan"}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-4xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0">
                                      Perlu Pendampingan
                                    </span>
                                  </div>

                                  {/* Full-width Diagnostic Alert Box */}
                                  <div className="rounded-xl bg-[#5A77DF]/5 border border-[#5A77DF]/20 p-2.5 text-3xs font-extrabold text-[#3E53A2] leading-relaxed">
                                    <span className="text-[#5A77DF] font-bold flex items-center gap-1 mb-0.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />{" "}
                                      Status Diagnostik Mental:
                                    </span>
                                    {student.mentalStatus}
                                  </div>

                                  {/* Reason */}
                                  <p className="text-3xs text-zinc-600 leading-relaxed font-medium pt-0.5">
                                    {student.riskReason}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="py-8 text-center space-y-1 bg-[#5A77DF]/5 rounded-xl border border-[#5A77DF]/20">
                                <CheckCircle2 className="w-8 h-8 text-[#5A77DF] mx-auto" />
                                <p className="text-xs font-bold text-zinc-800">
                                  Semua Kondisi Stabil!
                                </p>
                                <p className="text-3xs text-zinc-600">
                                  Tidak ada siswa dengan status risiko aktif
                                  saat ini.
                                </p>
                              </div>
                            )}
                          </div>
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
              </div>
            )}

            {activeView === "siswa" && (
              viewingStudentGradesId && viewingStudent ? (
                /* DEDICATED STUDENT DETAIL & GRADES PAGE */
                <section className="w-full space-y-6 animate-fadeIn text-left">
                  {/* Top Bar: Back Button & Export / Print */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingStudentGradesId(null)}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700 transition cursor-pointer shadow-xs self-start"
                    >
                      <ArrowLeft className="w-4 h-4 text-zinc-500" />
                      <span>Kembali ke Daftar Siswa</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportViewingStudentCSV}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-2xs font-extrabold text-emerald-800 transition cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Export CSV / Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintViewingStudentGrades}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-2xs font-extrabold text-zinc-700 transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Cetak Nilai</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Profile Card Banner */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-3xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                            Halaman Nilai Siswa
                          </span>
                          <span className="rounded-lg bg-[#5A77DF]/10 border border-[#5A77DF]/20 px-2.5 py-0.5 text-2xs font-extrabold text-[#3E53A2]">
                            {viewingStudent.className}
                          </span>
                          <span
                            className={`rounded-lg border px-2.5 py-0.5 text-2xs font-extrabold ${
                              viewingStudent.levelName === "Belum Pretest"
                                ? "bg-zinc-100 border-zinc-200 text-zinc-600"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                            }`}
                          >
                            Level: {viewingStudent.levelName || "Belum Pretest"}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900">
                          {viewingStudent.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                          <span>NIS: <strong className="text-zinc-800">{viewingStudent.nis || "-"}</strong></span>
                          <span>•</span>
                          <span>Kelas: <strong className="text-zinc-800">{viewingStudent.className}</strong></span>
                          <span>•</span>
                          <span>Mood: <strong className="text-zinc-800">{viewingStudent.moodScore}/5</strong></span>
                          <span>•</span>
                          <span>Status: <strong className={viewingStudent.riskFlag ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{viewingStudent.riskFlag ? "Perlu Perhatian" : "Stabil"}</strong></span>
                        </div>
                      </div>

                    </div>

                    {/* METRIC OVERVIEW CARDS */}
                    {(() => {
                      const currentMapelAvg = filteredViewingStudentAttempts.length > 0
                        ? Math.round(
                            filteredViewingStudentAttempts.reduce((sum, a) => sum + a.score, 0) /
                              filteredViewingStudentAttempts.length
                          )
                        : 0;

                      return (
                        <div className="space-y-5 mt-5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {viewingGradeSubjectFilter === "ALL" ? (
                              <>
                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Total Mata Pelajaran
                                  </span>
                                  <p className="text-xl sm:text-2xl font-black text-zinc-800 font-mono">
                                    {viewingStudentSubjectSummaries.length} <span className="text-xs font-normal text-zinc-400">Mapel</span>
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Rata-Rata Seluruh Mapel
                                  </span>
                                  <p className={`text-xl sm:text-2xl font-black font-mono ${
                                    viewingOverallAvgScore >= 70 ? "text-emerald-600" : "text-rose-600"
                                  }`}>
                                    {viewingOverallAvgScore}
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Total Kuis Selesai
                                  </span>
                                  <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                                    {viewingStudentAttempts.length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Mapel Tuntas (≥ 70)
                                  </span>
                                  <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                                    {viewingStudentSubjectSummaries.filter((s) => s.grades.length > 0 && s.avgScore >= 70).length} <span className="text-xs font-normal text-zinc-400">Mapel</span>
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
                                    {filteredViewingStudentAttempts.length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Rata-Rata Nilai Mapel
                                  </span>
                                  <p className={`text-xl sm:text-2xl font-black font-mono ${
                                    currentMapelAvg >= 70 ? "text-emerald-600" : "text-rose-600"
                                  }`}>
                                    {currentMapelAvg}
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Kuis Pretest
                                  </span>
                                  <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                                    {filteredViewingStudentAttempts.filter((g) => g.type === "Pretest").length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
                                  </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                                  <span className="text-3xs uppercase tracking-wider text-zinc-400 font-black font-mono">
                                    Kuis Posttest
                                  </span>
                                  <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                                    {filteredViewingStudentAttempts.filter((g) => g.type === "Posttest").length} <span className="text-xs font-normal text-zinc-400">Kuis</span>
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
                                  {viewingGradeSubjectFilter === "ALL"
                                    ? "Rekap Nilai Rata-Rata per Mata Pelajaran"
                                    : `Daftar Nilai Kuis Mapel - ${viewingGradeSubjectFilter}`}
                                </h3>
                                {viewingGradeSubjectFilter !== "ALL" && (
                                  <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-[#5A77DF]/10 text-[#3E53A2]">
                                    Mapel: {viewingGradeSubjectFilter}
                                  </span>
                                )}
                              </div>

                              {viewingGradeSubjectFilter !== "ALL" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingGradeSubjectFilter("ALL");
                                    setGradeSearchQuery("");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF] text-[#3E53A2] hover:text-white text-xs font-bold transition cursor-pointer shadow-2xs self-start sm:self-auto"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                  <span>Kembali ke Rekap Semua Nilai</span>
                                </button>
                              ) : (
                                <span className="text-3xs text-zinc-400 font-mono hidden sm:block">
                                  Menampilkan nilai rata-rata tiap mata pelajaran yang diikuti siswa
                                </span>
                              )}
                            </div>

                            <div className="flex justify-end mb-2">
                              <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                  type="text"
                                  placeholder={
                                    viewingGradeSubjectFilter === "ALL"
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
                                  {viewingGradeSubjectFilter === "ALL" ? (
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
                                        {filteredViewingSubjectSummaries.length === 0 ? (
                                          <tr>
                                            <td
                                              colSpan={7}
                                              className="px-4 py-12 text-center text-xs text-zinc-400 italic"
                                            >
                                              Belum ada data mata pelajaran atau evaluasi untuk siswa ini.
                                            </td>
                                          </tr>
                                        ) : (
                                          filteredViewingSubjectSummaries.map((subSummary, idx) => {
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
                                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                                      }`}
                                                    >
                                                      {isPassed ? "Tuntas" : "Perlu Bimbingan"}
                                                    </span>
                                                  ) : (
                                                    <span className="text-3xs text-zinc-400 font-mono">Belum Diambil</span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                  {hasGrades ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setViewingGradeSubjectFilter(subSummary.subjectName);
                                                        setGradeSearchQuery("");
                                                      }}
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
                                      {filteredViewingSubjectSummaries.length > 0 && (
                                        <tfoot className="bg-[#f8faff] border-t-2 border-[#5A77DF]/30">
                                          <tr className="divide-x divide-zinc-150">
                                            <td
                                              colSpan={4}
                                              className="px-4 py-3.5 text-right font-black uppercase tracking-wider text-xs text-zinc-700 font-mono"
                                            >
                                              Rata-Rata Seluruh Mapel:
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                              <span
                                                className={`inline-block font-black text-xs font-mono px-3 py-1 rounded-lg border shadow-xs ${
                                                  viewingOverallAvgScore >= 70
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : "bg-rose-100 text-rose-800 border-rose-300"
                                                }`}
                                              >
                                                {viewingOverallAvgScore}
                                              </span>
                                            </td>
                                            <td colSpan={2} className="px-4 py-3.5 text-zinc-400 text-3xs italic font-medium">
                                              (Dihitung dari {viewingStudentSubjectSummaries.filter((s) => s.grades.length > 0).length} mapel dengan evaluasi)
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
                                            Nilai / Skor
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
                                        {filteredViewingStudentAttempts.length === 0 ? (
                                          <tr>
                                            <td
                                              colSpan={8}
                                              className="px-4 py-12 text-center text-xs text-zinc-400 italic"
                                            >
                                              Siswa ini belum memiliki riwayat kuis untuk mata pelajaran "{viewingGradeSubjectFilter}".
                                            </td>
                                          </tr>
                                        ) : (
                                          filteredViewingStudentAttempts.map((attempt, idx) => (
                                            <tr key={attempt.id} className="hover:bg-[#5A77DF]/5 transition">
                                              <td className="px-4 py-3.5 text-center font-bold text-zinc-400 font-mono">
                                                {idx + 1}
                                              </td>
                                              <td className="px-4 py-3.5 font-bold text-zinc-900">
                                                {attempt.title}
                                              </td>
                                              <td className="px-4 py-3.5 text-zinc-700 font-medium">
                                                {attempt.subjectName}
                                              </td>
                                              <td className="px-4 py-3.5 text-zinc-600">
                                                <span className="font-bold text-zinc-800 text-xs">{(attempt as any).className || viewingStudent.className}</span>
                                                <span className="block text-3xs text-zinc-400 font-mono mt-0.5">{(attempt as any).academicYear || viewingStudent.academicYear || "TA 2025/2026"}</span>
                                              </td>
                                              <td className="px-4 py-3.5 text-center">
                                                <span
                                                  className={`rounded-md px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider border ${
                                                    attempt.type === "Pretest"
                                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                                  }`}
                                                >
                                                  {attempt.type}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3.5 text-center">
                                                <span
                                                  className={`inline-block font-black text-xs font-mono px-2.5 py-0.5 rounded-lg border ${
                                                    attempt.score >= 70
                                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                                  }`}
                                                >
                                                  {attempt.score}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3.5 text-zinc-500 font-mono text-2xs">
                                                {attempt.completedAt || "-"}
                                              </td>
                                              <td className="px-4 py-3.5 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedGradeRecord({
                                                      studentName: viewingStudent.name,
                                                      nis: viewingStudent.nis,
                                                      className: `${(attempt as any).className || viewingStudent.className} (${(attempt as any).academicYear || viewingStudent.academicYear || "TA 2025/2026"})`,
                                                      subjectName: attempt.subjectName,
                                                      quizTitle: attempt.title,
                                                      type: attempt.type,
                                                      score: attempt.score,
                                                      completedAt: attempt.completedAt,
                                                      answers: attempt.answers,
                                                    });
                                                    setShowGradeAnswersModal(true);
                                                  }}
                                                  title="Lihat Lembar Jawaban Siswa"
                                                  className="p-1.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#5A77DF] transition cursor-pointer inline-flex items-center justify-center shadow-2xs group"
                                                >
                                                  <Eye className="w-4 h-4 text-[#5A77DF] group-hover:scale-110 transition-transform" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                      {filteredViewingStudentAttempts.length > 0 && (
                                        <tfoot className="bg-[#f8faff] border-t-2 border-[#5A77DF]/30">
                                          <tr className="divide-x divide-zinc-150">
                                            <td
                                              colSpan={5}
                                              className="px-4 py-3.5 text-right font-black uppercase tracking-wider text-xs text-zinc-700 font-mono"
                                            >
                                              Rata-Rata Nilai Mapel:
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                              <span
                                                className={`inline-block font-black text-xs font-mono px-3 py-1 rounded-lg border shadow-xs ${
                                                  currentMapelAvg >= 70
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : "bg-rose-100 text-rose-800 border-rose-300"
                                                }`}
                                              >
                                                {currentMapelAvg}
                                              </span>
                                            </td>
                                            <td colSpan={2} className="px-4 py-3.5 text-zinc-400 text-3xs italic font-medium">
                                              (Dihitung dari {filteredViewingStudentAttempts.length} kuis)
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
                      );
                    })()}
                  </div>
                </section>
              ) : (
                <section className="w-full space-y-6 animate-fadeIn">
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm space-y-5 text-left">
                    <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-3xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                          Monitoring Siswa Guru
                        </p>
                        <h2 className="mt-1 text-xl font-black text-zinc-900">
                          Daftar Siswa & Progres Belajar Mapel
                        </h2>
                      </div>
                      
                      {/* <button
                        type="button"
                        onClick={handleExportTeacherGradesCSV}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-extrabold text-emerald-800 transition cursor-pointer shadow-2xs self-start sm:self-center shrink-0"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>Export Semua Nilai CSV</span>
                      </button> */}
                    </div>

                  {/* Clean Sub-Navigation Context & Search for Data Siswa */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5">
                    {/* Active Context Indicator */}
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTargetSubject ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#5A77DF]/30 text-xs font-black text-[#3E53A2] shadow-2xs">
                            <BookOpen className="w-3.5 h-3.5 text-[#5A77DF]" />
                            {activeTargetSubject.name}
                          </span>
                          <span className="text-xs font-bold text-zinc-600 bg-white/80 px-2.5 py-1 rounded-lg border border-zinc-200/60">
                            {activeTargetSubject.className} ({activeTargetSubject.classYear ? `TA ${activeTargetSubject.classYear}` : "TA 2025/2026"})
                          </span>
                        </div>
                      ) : selectedTAFilter !== "ALL" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#5A77DF]/30 text-xs font-black text-[#3E53A2] shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-[#5A77DF]" />
                            {selectedTAFilter.startsWith("TA") ? selectedTAFilter : `TA ${selectedTAFilter}`}
                          </span>
                          <span className="text-xs font-medium text-zinc-600">
                            Semua Siswa pada Tahun Ajaran ini
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#5A77DF]/30 text-xs font-black text-[#3E53A2] shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-[#5A77DF]" />
                            Semua Siswa
                          </span>
                          <span className="text-xs font-medium text-zinc-500 hidden sm:inline">
                            Menampilkan seluruh siswa binaan
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Search Input & Student Count */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="Cari nama atau NIS siswa..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A77DF] focus:border-[#5A77DF] transition text-zinc-700 font-medium shadow-2xs"
                        />
                      </div>
                      <span className="text-3xs text-zinc-500 font-mono font-bold shrink-0">
                        Total: <span className="text-[#3E53A2] font-black">{filteredStudents.length}</span> siswa
                      </span>
                    </div>
                  </div>

                  {/* Full-Width Card Table */}
                  <div className="overflow-hidden rounded-2xl border border-[#5A77DF]/20 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                      <thead className="bg-[#5A77DF]/10 border-b border-[#5A77DF]/20">
                        <tr>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Siswa & NIS
                          </th>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Kelas
                          </th>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono text-center">
                            Status
                          </th>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Level
                          </th>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Progres Belajar
                          </th>
                          {/* <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Mood
                          </th> */}
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                            Status Risiko
                          </th>
                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-10 text-center text-xs text-zinc-500 italic"
                            >
                              Tidak ada data siswa ditemukan untuk kriteria filter ini.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student) => (
                            <tr
                              key={student.id}
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setModalStudentId(student.id);
                              }}
                              className="cursor-pointer hover:bg-[#5A77DF]/5 transition group"
                            >
                              <td className="px-4 py-3.5">
                                <div className="font-extrabold text-zinc-900 group-hover:text-[#5A77DF] transition text-xs">
                                  {student.name}
                                </div>
                                <div className="text-3xs text-zinc-400 font-mono mt-0.5">
                                  NIS:{" "}
                                  <span className="text-zinc-600 font-bold">
                                    {student.nis || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="rounded-lg bg-[#5A77DF]/10 border border-[#5A77DF]/20 px-2.5 py-1 text-2xs font-extrabold text-[#3E53A2]">
                                  {student.className}
                                </span>
                                <span className="text-3xs text-zinc-400 font-mono block mt-1">
                                  {student.academicYear || "TA 2025/2026"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-3xs font-extrabold border ${
                                    student.isPastStudent
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  {student.isPastStudent ? "Terdahulu" : "Aktif"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`rounded-lg border px-2.5 py-1 text-2xs font-extrabold ${
                                  student.levelName === "Belum Pretest"
                                    ? "bg-zinc-100 border-zinc-200 text-zinc-600"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}>
                                  {student.levelName || "Belum Pretest"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="h-2.5 w-28 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2]"
                                      style={{
                                        width: `${student.subjectProgress}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="font-black text-xs text-[#3E53A2] font-mono">
                                    {student.subjectProgress}%
                                  </span>
                                </div>
                              </td>
                              {/* <td className="px-4 py-3.5">
                                {student.moodScore > 0 ? (
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span
                                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-black border shadow-2xs ${
                                        student.moodScore <= 2
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : student.moodScore === 3
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      }`}
                                    >
                                      {student.moodScore}/5
                                    </span>
                                    {student.latestJournal && (
                                      <span className="text-3xs text-zinc-400 font-sans font-medium">
                                        Update
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-3xs text-zinc-400 italic font-mono">Belum isi</span>
                                )}
                              </td> */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`rounded-full px-3 py-1 text-3xs font-extrabold border ${
                                    student.riskFlag
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : student.mentalStatus?.includes("Sudah Pendampingan")
                                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                                      : student.mentalStatus === "Baik"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                  }`}
                                >
                                  {student.riskFlag
                                    ? "Perlu Pendampingan"
                                    : student.mentalStatus?.includes("Sudah Pendampingan")
                                    ? "Sudah Pendampingan"
                                    : student.mentalStatus || "Stabil"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  title="Lihat Halaman Nilai & Evaluasi Siswa"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudentId(student.id);
                                    setViewingStudentGradesId(student.id);
                                    setViewingGradeSubjectFilter("ALL");
                                    setGradeSearchQuery("");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-3 py-1.5 text-white transition shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-bold"
                                >
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                  {/* <span>Lihat Nilai</span> */}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pop-Up Data Siswa Modal */}
                {modalStudentId &&
                  (() => {
                    const modalStudent = data.students.find(
                      (s) => s.id === modalStudentId,
                    );
                    if (!modalStudent) return null;
                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                        <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-[#5A77DF]/20 bg-white p-6 shadow-2xl overflow-y-auto custom-scrollbar space-y-6 text-left text-zinc-900">
                          {/* Modal Header */}
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                                  Pop-Up Detail Siswa
                                </span>
                                <span className="rounded-md bg-[#5A77DF]/10 px-2 py-0.5 text-2xs font-extrabold text-[#3E53A2] border border-[#5A77DF]/20">
                                  {modalStudent.className}
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-2xs font-extrabold border ${
                                  modalStudent.levelName === "Belum Pretest"
                                    ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  Level: {modalStudent.levelName || "Belum Pretest"}
                                </span>
                              </div>
                              <h2 className="text-xl font-black text-zinc-900 mt-1 flex items-center gap-3">
                                {modalStudent.name}
                                <span className="text-xs font-mono font-medium text-zinc-500">
                                  (NIS: {modalStudent.nis || "-"})
                                </span>
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => setModalStudentId(null)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer font-bold"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="space-y-4">
                            {/* 1. Health & Mood */}
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
                              <p className="text-3xs font-extrabold uppercase tracking-wider text-amber-700 font-mono">
                                Status Kesehatan Mental & Mood
                              </p>
                              <p className="text-sm font-bold text-zinc-900 mt-1">
                                {modalStudent.mentalStatus}
                              </p>
                              <p className="text-xs text-zinc-600 font-medium">
                                Mood rata-rata:{" "}
                                <span className="font-bold text-amber-700">
                                  {modalStudent.moodScore}/5
                                </span>{" "}
                                • Screen time:{" "}
                                <span className="font-bold text-zinc-800">
                                  {modalStudent.screenTime} jam
                                </span>
                              </p>
                            </div>

                            {/* 2. Progres Modul Mapel Guru */}
                            <div className="rounded-2xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 p-4 space-y-3">
                              <div className="flex items-center justify-between border-b border-[#5A77DF]/10 pb-2">
                                <div>
                                  <span className="text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                                    Status Progres Modul Pelajaran Ibu/Bapak
                                    Guru
                                  </span>
                                  <p className="text-3xs text-zinc-500 font-medium">
                                    Hanya menampilkan modul untuk mata pelajaran
                                    yang Anda ampu
                                  </p>
                                </div>
                                <span className="text-sm font-black text-[#3E53A2] bg-white px-3 py-1 rounded-xl border border-[#5A77DF]/20 font-mono shadow-xs">
                                  {modalStudent.subjectProgress}%
                                </span>
                              </div>

                              {modalStudent.moduleProgressesList &&
                              modalStudent.moduleProgressesList.length > 0 ? (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                  {modalStudent.moduleProgressesList.map(
                                    (m) => (
                                      <div
                                        key={m.moduleId}
                                        className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2 shadow-xs"
                                      >
                                        <div className="flex items-center justify-between text-xs">
                                          <span
                                            className="font-bold text-zinc-900"
                                            title={m.moduleTitle}
                                          >
                                            {m.moduleTitle}
                                          </span>
                                          <span
                                            className={`text-3xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                              m.isCompleted
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : m.progress > 0
                                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                                            }`}
                                          >
                                            {m.isCompleted
                                              ? "Selesai 100%"
                                              : m.progress > 0
                                                ? `Dibaca ${m.progress}%`
                                                : "Belum Dibaca"}
                                          </span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                                          <div
                                            className={`h-full rounded-full ${m.isCompleted ? "bg-emerald-500" : "bg-amber-500"}`}
                                            style={{ width: `${m.progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-500 italic p-2">
                                  Belum ada modul pelajaran yang dibuat di mapel
                                  ini.
                                </p>
                              )}
                            </div>

                            {/* 3. Hasil & Jawaban Pretest */}
                            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
                              <div className="flex items-center justify-between border-b border-cyan-200/60 pb-2">
                                <span className="text-3xs font-extrabold uppercase tracking-wider text-cyan-800 font-mono">
                                  Hasil & Jawaban Pretest
                                </span>
                                <span className="text-2xs text-zinc-500 font-medium">
                                  {modalStudent.pretests?.length
                                    ? `${modalStudent.pretests.length} Kuis`
                                    : "Belum Isi"}
                                </span>
                              </div>

                              {modalStudent.pretests &&
                              modalStudent.pretests.length > 0 ? (
                                modalStudent.pretests.map((pretest) => (
                                  <div
                                    key={pretest.id}
                                    className="rounded-xl border border-cyan-200 bg-white p-3.5 space-y-2 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-zinc-900">
                                          {pretest.title}
                                        </span>
                                        {pretest.subjectName && (
                                          <span className="text-3xs font-extrabold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800">
                                            {pretest.subjectName}
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-black text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 font-mono">
                                        Nilai: {pretest.score}%
                                      </span>
                                    </div>
                                    <p className="text-3xs text-zinc-500">
                                      Diselesaikan: {pretest.completedAt}
                                    </p>

                                    {pretest.answers &&
                                      pretest.answers.length > 0 && (
                                        <div className="pt-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setShowPretestAnswers(
                                                !showPretestAnswers,
                                              )
                                            }
                                            className="text-3xs font-bold text-cyan-700 hover:underline flex items-center gap-1 cursor-pointer"
                                          >
                                            {showPretestAnswers ? (
                                              <span className="flex items-center gap-1">
                                                <EyeOff className="w-3.5 h-3.5" />
                                                <span>Sembunyikan Rincian Jawaban</span>
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Lihat Rincian Jawaban Pretest</span>
                                              </span>
                                            )}
                                          </button>

                                          {showPretestAnswers && (
                                            <div className="mt-2 space-y-2 pt-2 border-t border-cyan-100">
                                              {pretest.answers.map(
                                                (ans, idx) => (
                                                  <div
                                                    key={ans.id || idx}
                                                    className="p-2.5 rounded-lg bg-cyan-50/50 border border-cyan-100 text-xs space-y-1"
                                                  >
                                                    <p className="font-semibold text-zinc-900">
                                                      {idx + 1}. {ans.question}
                                                    </p>
                                                    <p className="text-3xs text-zinc-600">
                                                      Jawaban Siswa:{" "}
                                                      <span className="font-bold text-cyan-800">
                                                        {ans.selectedOption}
                                                      </span>
                                                    </p>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-zinc-500 italic p-2">
                                  Siswa belum mengerjakan kuis pretest untuk mata pelajaran Anda.
                                </p>
                              )}
                            </div>

                            {/* 4. Hasil & Rincian Jawaban Posttest */}
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
                              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                                <div>
                                  <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 font-mono">
                                    Hasil & Rincian Jawaban Posttest Modul
                                  </span>
                                  <p className="text-3xs text-zinc-500 font-medium">
                                    Menampilkan nilai & rincian jawaban
                                    percobaan terakhir per modul
                                  </p>
                                </div>
                                <span className="text-2xs font-mono text-zinc-500">
                                  {modalStudent.posttests?.length
                                    ? `${modalStudent.posttests.length} Modul Selesai`
                                    : "Belum Ada Posttest"}
                                </span>
                              </div>

                              {modalStudent.posttests &&
                              modalStudent.posttests.length > 0 ? (
                                modalStudent.posttests.map((posttest) => (
                                  <div
                                    key={posttest.id}
                                    className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3 shadow-xs"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-3">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-extrabold text-sm text-zinc-900">
                                            {posttest.moduleTitle}
                                          </h4>
                                          {posttest.subjectName && (
                                            <span className="text-3xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                              {posttest.subjectName}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-3xs text-zinc-500 font-mono mt-0.5">
                                          Waktu Penyelesaian:{" "}
                                          {posttest.completedAt}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-2xs font-bold px-2.5 py-1 rounded-lg border ${
                                            posttest.score >= 70
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                          }`}
                                        >
                                          {posttest.score >= 70
                                            ? "LULUS (≥70%)"
                                            : "PERLU PERBAIKAN (<70%)"}
                                        </span>
                                        <span className="font-black text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 font-mono">
                                          Nilai: {posttest.score}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Rincian Jawaban Siswa per Soal */}
                                    {posttest.answers &&
                                      posttest.answers.length > 0 && (
                                        <div className="pt-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setActivePosttestAnswerId(
                                                activePosttestAnswerId ===
                                                  posttest.id
                                                  ? null
                                                  : posttest.id,
                                              )
                                            }
                                            className="text-3xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                          >
                                            {activePosttestAnswerId === posttest.id ? (
                                              <span className="flex items-center gap-1">
                                                <EyeOff className="w-3.5 h-3.5" />
                                                <span>Sembunyikan Rincian Jawaban</span>
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Lihat Rincian Jawaban Posttest</span>
                                              </span>
                                            )}
                                          </button>

                                          {activePosttestAnswerId ===
                                            posttest.id && (
                                            <div className="mt-3 space-y-2 pt-2 border-t border-emerald-100">
                                              <p className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 font-mono">
                                                Rincian Jawaban Siswa per Butir
                                                Soal:
                                              </p>
                                              {posttest.answers.map(
                                                (ans, idx) => (
                                                  <div
                                                    key={ans.id || idx}
                                                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                                                      ans.isCorrect
                                                        ? "border-emerald-200 bg-emerald-50/40"
                                                        : "border-rose-200 bg-rose-50/40"
                                                    }`}
                                                  >
                                                    <div className="flex items-start justify-between gap-3">
                                                      <p className="font-semibold text-zinc-900">
                                                        <span className="font-mono text-zinc-500 mr-1">
                                                          {idx + 1}.
                                                        </span>
                                                        {ans.question}
                                                      </p>
                                                      <span
                                                        className={`shrink-0 text-3xs font-extrabold px-2 py-0.5 rounded-md border font-mono ${
                                                          ans.isCorrect
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                        }`}
                                                      >
                                                        {ans.isCorrect ? (
                                                          <span className="inline-flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />{" "}
                                                            BENAR
                                                          </span>
                                                        ) : (
                                                          <span className="inline-flex items-center gap-1">
                                                            <X className="w-3 h-3 text-rose-600" />{" "}
                                                            SALAH
                                                          </span>
                                                        )}
                                                      </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-3xs pt-1 border-t border-zinc-100">
                                                      <div>
                                                        <span className="text-zinc-500">
                                                          Pilihan Siswa:{" "}
                                                        </span>
                                                        <span
                                                          className={`font-bold ${ans.isCorrect ? "text-emerald-700" : "text-rose-700"}`}
                                                        >
                                                          {ans.selectedOption}
                                                        </span>
                                                      </div>

                                                      {!ans.isCorrect &&
                                                        ans.correctOption && (
                                                          <div>
                                                            <span className="text-zinc-500">
                                                              Kunci
                                                              Jawaban:{" "}
                                                            </span>
                                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                              {
                                                                ans.correctOption
                                                              }
                                                            </span>
                                                          </div>
                                                        )}
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-zinc-500 italic p-2">
                                  Siswa belum menyelesaikan kuis posttest untuk modul mata pelajaran Anda.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="border-t border-zinc-100 pt-4 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const sId = modalStudentId;
                                setModalStudentId(null);
                                setViewingStudentGradesId(sId);
                                setViewingGradeSubjectFilter("ALL");
                                setGradeSearchQuery("");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 px-4 py-2 text-xs font-extrabold text-[#3E53A2] transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#5A77DF]" />
                              <span>Lihat Halaman Nilai & Lembar Jawaban</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalStudentId(null)}
                              className="rounded-xl bg-zinc-200 hover:bg-zinc-300 px-5 py-2 text-xs font-extrabold text-zinc-700 transition cursor-pointer shadow-xs"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </section>
            )
          )}

            {/* Pop-Up Lembar Jawaban Siswa Modal */}
            {showGradeAnswersModal && selectedGradeRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl overflow-y-auto custom-scrollbar space-y-5 text-left text-zinc-900">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                          Lembar Jawaban Siswa
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-3xs font-black uppercase tracking-wider border ${
                            selectedGradeRecord.type === "Pretest"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {selectedGradeRecord.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-zinc-900">
                        {selectedGradeRecord.studentName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-2xs text-zinc-500 font-mono mt-1">
                        <span>NIS: <strong className="text-zinc-700">{selectedGradeRecord.nis}</strong></span>
                        <span>•</span>
                        <span>Kelas: <strong className="text-zinc-700">{selectedGradeRecord.className}</strong></span>
                        <span>•</span>
                        <span>Mapel: <strong className="text-zinc-700">{selectedGradeRecord.subjectName}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGradeAnswersModal(false)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quiz Summary Banner */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
                        Kuis / Evaluasi
                      </p>
                      <p className="text-sm font-extrabold text-zinc-800 mt-0.5">
                        {selectedGradeRecord.quizTitle}
                      </p>
                      <p className="text-3xs text-zinc-500 font-mono mt-0.5">
                        Diselesaikan: {selectedGradeRecord.completedAt || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
                        Skor Akhir
                      </p>
                      <span
                        className={`inline-block text-xl font-black font-mono mt-0.5 ${
                          selectedGradeRecord.score >= 70 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {selectedGradeRecord.score}%
                      </span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider font-mono">
                      Rincian Jawaban Soal ({selectedGradeRecord.answers?.length || 0} Soal)
                    </h4>

                    {(!selectedGradeRecord.answers || selectedGradeRecord.answers.length === 0) ? (
                      <div className="p-6 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-xl border border-zinc-200">
                        Tidak ada rincian jawaban tersimpan untuk kuis ini.
                      </div>
                    ) : (
                      selectedGradeRecord.answers.map((ans: any, qIdx: number) => (
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
                              <span className="font-mono font-bold uppercase mr-1">Jawaban Siswa:</span>{" "}
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
                      onClick={() => setShowGradeAnswersModal(false)}
                      className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white transition cursor-pointer shadow-xs"
                    >
                      Tutup Lembar Jawaban
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeView === "guru_pengampu" && (
              <section className="w-full space-y-6 animate-fadeIn">
                <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm space-y-5 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
                    <div>
                      <p className="text-3xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                        Informasi Wali Kelas
                      </p>
                      <h2 className="mt-1 text-xl font-black text-zinc-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#5A77DF]" />
                        <span>
                          Daftar Guru Pengampu Mapel (
                          {data?.teacher?.assignedClass?.name || "Kelas Binaan"}
                          )
                        </span>
                      </h2>
                    </div>
                    <span className="text-3xs uppercase tracking-wider text-zinc-400 font-mono font-medium">
                      Total {data?.teacher?.subjects?.length || 0} Mata
                      Pelajaran Terdaftar
                    </span>
                  </div>

                  <div className="flex justify-end mb-4">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Cari guru atau mapel..."
                        value={guruPengampuSearchQuery}
                        onChange={(e) => setGuruPengampuSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none focus:border-[#5A77DF] transition"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-150">
                    <table className="min-w-full text-left text-xs divide-y divide-zinc-150">
                      <thead className="bg-[#f5f7fc]">
                        <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-3">Mata Pelajaran</th>
                          <th className="px-4 py-3">Guru Pengampu</th>
                          <th className="px-4 py-3">NIP</th>
                          <th className="px-4 py-3">Jabatan & Spesialisasi</th>
                          <th className="px-4 py-3">Email & Kontak</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {(() => {
                          const list = data?.teacher?.subjects || [];
                          const query = guruPengampuSearchQuery.toLowerCase();
                          const filteredList = list.filter((sub: any) => {
                            if (!query) return true;
                            const tName = sub.assignedTeacher?.name?.toLowerCase() || "";
                            const mName = sub.name?.toLowerCase() || "";
                            return tName.includes(query) || mName.includes(query);
                          });

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-400 italic">
                                  Belum ada mata pelajaran atau guru pengampu yang dialokasikan di kelas ini.
                                </td>
                              </tr>
                            );
                          }

                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-400 italic">
                                  Tidak ada hasil yang sesuai dengan pencarian.
                                </td>
                              </tr>
                            );
                          }

                          return filteredList.map((sub: any) => {
                            const g = sub.assignedTeacher;
                            return (
                              <tr
                                key={sub.id}
                                className="hover:bg-zinc-50 transition"
                              >
                                <td className="px-4 py-3.5 font-bold text-zinc-800 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-[#5A77DF]" />
                                  <span>{sub.name}</span>
                                </td>
                                <td className="px-4 py-3.5 font-extrabold text-zinc-900">
                                  {g?.name ? (
                                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{g.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 italic font-medium">
                                      Belum Ada Pengampu
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600 font-mono text-3xs font-semibold">
                                  {g?.nip || "-"}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600">
                                  <div className="text-2xs font-semibold text-zinc-800">
                                    {g?.position || "Guru Mapel"}
                                  </div>
                                  <div className="text-3xs text-zinc-400 font-medium">
                                    {g?.specialization || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600">
                                  <div className="text-2xs font-medium text-zinc-700">
                                    {g?.email || "-"}
                                  </div>
                                  <div className="text-3xs text-zinc-400">
                                    {g?.phone_number || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  {g ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                      <span>Aktif Mengampu</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-3xs font-extrabold text-amber-800 border border-amber-200">
                                      <span>Belum Ditentukan</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeView === "insight" && (
              <section className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm space-y-4 text-left">
                <p className="text-3xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                  Insight AI
                </p>
                <h2 className="text-xl font-black text-zinc-900">
                  Rekomendasi Berbasis Pola Kelas
                </h2>
                <div className="space-y-3 pt-2">
                  {data.aiInsights.map((insight) => (
                    <div
                      key={insight}
                      className="rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 p-4 text-xs font-semibold text-zinc-800 leading-relaxed shadow-xs"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeView === "intervensi" && (
              <section className="space-y-6 animate-fadeIn">
                {/* Top Header Card */}
                <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-[#5A77DF]" />
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                      Layanan Konseling & Bimbingan Interaktif
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Pilih siswa di daftar sebelah kiri untuk meninjau status
                    mental dan memulai percakapan bimbingan/konseling secara
                    langsung.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[280px_1fr] h-[560px]">
                  {/* Left Column: Student List Card */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm flex flex-col h-full overflow-hidden">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Daftar Siswa Binaan
                    </p>

                    {/* Search bar */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder="Cari nama siswa..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 pl-9 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] focus:bg-white font-medium"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {data.students && data.students.length > 0 ? (
                        data.students
                          .filter((student) =>
                            student.name
                              .toLowerCase()
                              .includes(chatSearchQuery.toLowerCase()),
                          )
                          .map((student) => {
                            const isSelected =
                              activeChatStudentId === student.id;
                            const isAlert = student.riskFlag;
                            return (
                              <button
                                key={student.id}
                                onClick={() =>
                                  setActiveChatStudentId(student.id)
                                }
                                className={`w-full text-left rounded-xl p-3 border transition-all flex flex-col gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? "bg-[#5A77DF]/10 border-[#5A77DF] text-[#3E53A2] font-extrabold shadow-2xs"
                                    : "bg-white border-zinc-200 hover:border-[#5A77DF]/50 hover:bg-zinc-50 text-zinc-800 font-medium"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <span className="font-extrabold text-xs truncate max-w-[150px]">
                                    {student.name}
                                  </span>
                                  {isAlert && (
                                    <span
                                      title="Siswa Perlu Pendampingan"
                                      className="rounded-full bg-rose-50 border border-rose-200 p-1 text-rose-600 animate-pulse flex items-center justify-center shrink-0 shadow-2xs"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                  <span>{student.className}</span>
                                  <span
                                    className={
                                      isAlert
                                        ? "text-rose-600 font-extrabold"
                                        : "text-zinc-500 font-bold"
                                    }
                                  >
                                    Mood: {student.moodScore}/5
                                  </span>
                                </div>
                              </button>
                            );
                          })
                      ) : (
                        <p className="text-center text-xs text-zinc-500 mt-4 italic">
                          Tidak ada data siswa.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Main Chat Box Card */}
                  <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm flex flex-col h-full overflow-hidden">
                    {activeChatStudentId ? (
                      (() => {
                        const selectedStudent = data.students.find(
                          (s) => s.id === activeChatStudentId,
                        );
                        return (
                          <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            {selectedStudent && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 mb-4">
                                <div>
                                  <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                                    {selectedStudent.name}
                                    <span className="text-[10px] font-bold text-[#3E53A2] bg-[#5A77DF]/10 border border-[#5A77DF]/20 px-2.5 py-0.5 rounded-full uppercase">
                                      {selectedStudent.className}
                                    </span>
                                  </h3>
                                  <p className="text-2xs text-zinc-600 mt-0.5 font-medium">
                                    Status:{" "}
                                    <span
                                      className={
                                        selectedStudent.riskFlag
                                          ? "text-rose-600 font-extrabold"
                                          : selectedStudent.mentalStatus?.includes("Sudah Pendampingan")
                                          ? "text-emerald-600 font-extrabold"
                                          : "text-[#5A77DF] font-extrabold"
                                      }
                                    >
                                      {selectedStudent.mentalStatus}
                                    </span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {selectedStudent.riskFlag ? (
                                    <button
                                      type="button"
                                      onClick={() => handleResolveMentoring(selectedStudent.id, selectedStudent.name)}
                                      disabled={resolvingMentoring}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#5A77DF] hover:bg-[#3E53A2] text-white shadow-sm hover:shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                                      title="Tandai pendampingan siswa ini selesai"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                      <span>Tandai Selesai</span>
                                    </button>
                                  ) : (
                                    <div className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Sudah Selesai</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Chat messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-4 custom-scrollbar">
                              {loadingChat ? (
                                <div className="flex flex-col items-center justify-center h-full text-xs text-zinc-500 space-y-2 font-medium">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#5A77DF] border-t-transparent" />
                                  <span>Memuat pesan...</span>
                                </div>
                              ) : chatMessages.length === 0 ? (
                                <div className="text-center text-xs text-zinc-500 my-auto py-10 italic">
                                  Belum ada chat intervensi. Kirim pesan ke
                                  siswa untuk memulai bimbingan.
                                </div>
                              ) : (
                                chatMessages.map((msg) => {
                                  const isSelf = msg.sender === "teacher";
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                                    >
                                      <span className="text-[10px] font-extrabold text-zinc-500 mb-1">
                                        {isSelf ? "Anda" : "Siswa"}
                                      </span>
                                      <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${isSelf ? "bg-[#5A77DF] text-white rounded-tr-none shadow-xs" : "bg-white text-zinc-900 border border-zinc-200 rounded-tl-none shadow-2xs"}`}
                                      >
                                        {msg.message}
                                      </div>
                                      <span className="text-[8px] text-zinc-500 mt-1 font-mono">
                                        {new Date(
                                          msg.created_at,
                                        ).toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Input bar */}
                            <form
                              onSubmit={handleSendChat}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={`Kirim pesan intervensi ke ${selectedStudent?.name || "siswa"}...`}
                                className="flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] focus:bg-white font-medium"
                              />
                              <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="px-5 py-2.5 bg-[#5A77DF] hover:bg-[#3E53A2] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer"
                              >
                                Kirim
                              </button>
                            </form>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-zinc-50 rounded-xl border border-zinc-200">
                        <MessageSquare className="h-10 w-10 text-zinc-400 mb-3" />
                        <p className="text-xs text-zinc-600 font-medium">
                          Pilih siswa di sebelah kiri untuk membuka ruang
                          intervensi bimbingan.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeView === "mapel" &&
              (() => {
                const activeSubjectId =
                  selectedMapelFilterId === "ALL" || !selectedMapelFilterId
                    ? subjects[0]?.id
                    : selectedMapelFilterId;
                const filteredMapelSubjects = subjects.filter(
                  (s) =>
                    s.id === activeSubjectId ||
                    String(s.id) === String(activeSubjectId),
                );

                return (
                  <section className="space-y-6 animate-fadeIn text-left">
                    {/* Header */}
                    <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-3xs font-extrabold uppercase tracking-[0.25em] text-[#5A77DF] font-mono">
                            Mata Pelajaran {isWaliKelas ? "Kelas Binaan" : ""}
                          </p>
                          <h2 className="mt-1 text-xl font-black text-zinc-900">
                            {isWaliKelas
                              ? "Daftar Mata Pelajaran & Modul Pembelajaran di Kelas Binaan Anda"
                              : "Kelola Mata Pelajaran, Modul Pembelajaran, & Postest Kuis Anda"}
                          </h2>
                        </div>

                        {!isWaliKelas && (
                          <button
                            type="button"
                            onClick={openAddSubjectModal}
                            className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-4 h-4 text-white" />
                            <span>+ Tambah Kelas & Mapel</span>
                          </button>
                        )}
                      </div>
                    </div>


                    {/* Subject List & Modules */}
                    <div className="grid gap-6">
                      {filteredMapelSubjects.length === 0 ? (
                        <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-10 text-center text-xs font-medium text-zinc-500 shadow-sm">
                          {isWaliKelas
                            ? "Belum ada mata pelajaran yang terdaftar untuk kelas ini."
                            : "Belum ada mata pelajaran yang Anda ampu atau cocok dengan filter ini."}
                        </div>
                      ) : (
                        filteredMapelSubjects.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                              <div>
                                <span className="rounded-full bg-[#5A77DF]/10 border border-[#5A77DF]/20 px-2.5 py-1 text-2xs font-extrabold text-[#3E53A2]">
                                  {sub.class.name} • {sub.class.major}
                                </span>
                                <h3 className="text-lg font-black text-zinc-900 mt-2">
                                  {sub.name}
                                </h3>
                              </div>
                              {!isWaliKelas && (
                                <button
                                  type="button"
                                  onClick={() => handleStartAddModule(sub.id)}
                                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs flex items-center gap-1.5"
                                >
                                  <PlusCircle className="w-4 h-4 text-white" />
                                  <span>Tambah Modul</span>
                                </button>
                              )}
                            </div>

                            {/* Subject Pretest Bar */}
                            {(() => {
                              const subjectPretest = sub.quizzes?.find(
                                (q: any) =>
                                  q.type === "pretest" && !q.module_id,
                              );
                              return (
                                <div className="mt-3 p-4 rounded-xl border border-cyan-200 bg-cyan-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center shrink-0 shadow-xs">
                                      <ClipboardList className="w-5 h-5 text-cyan-700" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-extrabold text-cyan-900 flex items-center gap-2">
                                        <span>
                                          {subjectPretest
                                            ? `Pretest Mapel: ${subjectPretest.title}`
                                            : "Pretest Mata Pelajaran Belum Dibuat"}
                                        </span>
                                      </div>
                                      <div className="text-3xs text-zinc-600 font-medium font-mono mt-0.5">
                                        {subjectPretest
                                          ? `${subjectPretest.questions?.length || 0} Soal Pretest Aktif Untuk Mata Pelajaran Ini`
                                          : "Tes awal pengetahuan siswa untuk seluruh modul di mata pelajaran ini"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isWaliKelas ? (
                                      subjectPretest ? (
                                        <span className="text-2xs font-extrabold text-cyan-800 font-mono bg-cyan-100 border border-cyan-200 px-3 py-1 rounded-lg inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-cyan-700" />{" "}
                                          Pretest Aktif (
                                          {subjectPretest.questions?.length ||
                                            0}{" "}
                                          Soal)
                                        </span>
                                      ) : (
                                        <span className="text-2xs font-bold text-zinc-500 italic bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-200">
                                          Belum Ada Pretest
                                        </span>
                                      )
                                    ) : subjectPretest ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenSubjectPretestModal(
                                              sub,
                                              subjectPretest,
                                            )
                                          }
                                          className="rounded-xl border border-cyan-300 bg-white px-3 py-1.5 text-xs font-extrabold text-cyan-800 hover:bg-cyan-100 transition cursor-pointer flex items-center gap-1 shadow-xs"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Edit Pretest</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubjectPretest(sub.id)
                                          }
                                          className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-xs"
                                          title="Hapus Pretest"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenSubjectPretestModal(
                                            sub,
                                            null,
                                          )
                                        }
                                        className="rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-xs flex items-center gap-1.5"
                                      >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>Buat Pretest Mapel</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Modules Table List */}
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                                  Daftar Modul Pelajaran ({sub.modules.length})
                                </p>
                              </div>

                              {sub.modules.length === 0 ? (
                                <div className="p-8 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-xs text-zinc-500 italic">
                                  Belum ada modul yang dibuat untuk mata
                                  pelajaran ini. Klik tombol{" "}
                                  <strong className="text-zinc-700 font-bold">
                                    &quot;Tambah Modul&quot;
                                  </strong>{" "}
                                  di atas untuk membuat modul pertama Anda.
                                </div>
                              ) : (
                                <div className="overflow-hidden rounded-2xl border border-[#5A77DF]/20 bg-white shadow-sm">
                                  <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                                    <thead className="bg-[#5A77DF]/10 border-b border-[#5A77DF]/20">
                                      <tr>
                                        <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono w-12 text-center">
                                          No
                                        </th>
                                        <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                                          Judul Modul & Ringkasan Materi
                                        </th>
                                        <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                                          Level Penempatan
                                        </th>
                                        <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                                          Postest Kuis
                                        </th>
                                        {!isWaliKelas && (
                                          <th className="px-4 py-3.5 text-3xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono text-right">
                                            Aksi
                                          </th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 bg-white">
                                      {sub.modules.map(
                                        (mod: any, idx: number) => {
                                          const postQ = mod.quizzes?.find(
                                            (q: any) => q.type === "posttest",
                                          );
                                          const preQ = mod.quizzes?.find(
                                            (q: any) => q.type === "pretest",
                                          );
                                          const plainTextSnippet = mod.content
                                            ? mod.content
                                                .replace(/<[^>]*>/g, " ")
                                                .replace(/&[a-z0-9]+;/gi, " ")
                                                .replace(/\s+/g, " ")
                                                .trim()
                                            : "";

                                          const levelName =
                                            mod.level?.name || "Beginner";
                                          const levelBadgeColor = levelName
                                            .toLowerCase()
                                            .includes("advan")
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : levelName
                                                  .toLowerCase()
                                                  .includes("intermed")
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : "bg-[#5A77DF]/10 text-[#3E53A2] border-[#5A77DF]/20";

                                          return (
                                            <tr
                                              key={mod.id}
                                              className="hover:bg-[#5A77DF]/5 transition group"
                                            >
                                              {/* No */}
                                              <td className="px-4 py-3.5 text-center font-extrabold text-zinc-500 font-mono text-2xs">
                                                {idx + 1}
                                              </td>

                                              {/* Title & Content Snippet */}
                                              <td className="px-4 py-3.5 max-w-md">
                                                <div className="font-extrabold text-zinc-900 text-xs group-hover:text-[#5A77DF] transition">
                                                  {mod.title}
                                                </div>
                                                {plainTextSnippet && (
                                                  <p className="text-3xs text-zinc-500 line-clamp-1 font-medium mt-0.5 leading-relaxed">
                                                    {plainTextSnippet}
                                                  </p>
                                                )}
                                                {mod.video_url && (
                                                  <div className="mt-1 flex items-center gap-1 text-3xs font-mono font-semibold text-[#5A77DF]">
                                                    <Video className="w-3 h-3 text-[#5A77DF] shrink-0" />
                                                    <a
                                                      href={mod.video_url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="underline hover:text-[#3E53A2] truncate max-w-[280px]"
                                                    >
                                                      Video YouTube
                                                    </a>
                                                  </div>
                                                )}
                                              </td>

                                              {/* Level */}
                                              <td className="px-4 py-3.5">
                                                <span
                                                  className={`inline-block rounded-full px-3 py-1 text-3xs font-extrabold border font-mono uppercase ${levelBadgeColor}`}
                                                >
                                                  {levelName}
                                                </span>
                                              </td>

                                              {/* Posttest */}
                                              <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  {postQ ? (
                                                    <span className="rounded-full bg-[#5A77DF]/10 px-2.5 py-1 text-3xs font-extrabold text-[#3E53A2] uppercase border border-[#5A77DF]/20 font-mono flex items-center gap-1">
                                                      <FileText className="w-3 h-3 text-[#5A77DF]" />{" "}
                                                      Postest (
                                                      {postQ.questions
                                                        ?.length || 0}{" "}
                                                      Soal)
                                                    </span>
                                                  ) : (
                                                    <span className="text-3xs text-zinc-400 italic font-mono">
                                                      Tanpa Postest
                                                    </span>
                                                  )}
                                                  {preQ && (
                                                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-3xs font-extrabold text-cyan-800 uppercase border border-cyan-200 font-mono flex items-center gap-1">
                                                      <ClipboardList className="w-3 h-3 text-cyan-600" />{" "}
                                                      Pretest (
                                                      {preQ.questions?.length ||
                                                        0}{" "}
                                                      Soal)
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              {/* Action Buttons */}
                                              {!isWaliKelas && (
                                                <td className="px-4 py-3.5 text-right">
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                      type="button"
                                                      title="Edit Modul"
                                                      onClick={() =>
                                                        handleStartEditModule(
                                                          mod,
                                                          sub.id,
                                                        )
                                                      }
                                                      className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                                    >
                                                      <Edit3 className="w-3.5 h-3.5" />
                                                      <span className="hidden sm:inline">
                                                        Edit
                                                      </span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      title="Hapus Modul"
                                                      onClick={() =>
                                                        handleDeleteModule(
                                                          mod.id,
                                                        )
                                                      }
                                                      className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                      <span className="hidden sm:inline">
                                                        Hapus
                                                      </span>
                                                    </button>
                                                  </div>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        },
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                );
              })()}

            {activeView === "badge" && (
              <section className="w-full space-y-6 animate-fadeIn">
                <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4">
                    <div>
                      <h2 className="mt-1 text-xl font-black text-zinc-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-[#5A77DF]" />
                        {isWaliKelas || data?.teacher?.type === "bk"
                          ? "Lencana & Badge Pencapaian"
                          : "Manajemen & Tambah Badge / Lencana Belajar"}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                        {isWaliKelas || data?.teacher?.type === "bk"
                          ? "Daftar lencana penghargaan pencapaian belajar siswa."
                          : "Buat dan kelola badge lencana penghargaan khusus yang dapat diraih siswa setelah menyelesaikan modul pelajaran Anda."}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-[#3E53A2] bg-[#5A77DF]/10 px-4 py-2.5 rounded-xl border border-[#5A77DF]/30 font-black shrink-0 flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#5A77DF]" /> Total Badge:{" "}
                      {badgeList.length}
                    </div>
                  </div>

                  {isWaliKelas || data?.teacher?.type === "bk" ? (
                    /* Read-Only Direct Badge Grid for Wali Kelas & Guru BK */
                    loadingBadges ? (
                      <div className="p-12 text-center text-xs text-zinc-500 font-medium">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#5A77DF] border-t-transparent mb-2" />
                        <p>Memuat daftar badge...</p>
                      </div>
                    ) : badgeList.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 italic">
                        Belum ada badge yang dibuat.
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-left">
                        {badgeList.map((badge) => (
                          <div
                            key={badge.id}
                            className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-3 flex flex-col justify-between hover:border-[#5A77DF] hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left"
                          >
                            <div className="space-y-2.5">
                              {/* Emblem & Title Row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-2xl shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                                    {badge.image_url?.startsWith("/") ||
                                    badge.image_url?.startsWith("http") ? (
                                      <img
                                        src={badge.image_url}
                                        alt={badge.name}
                                        className="h-full w-full object-cover p-1"
                                      />
                                    ) : (
                                      <span>{badge.image_url || "🏆"}</span>
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-[#5A77DF] transition leading-snug">
                                      {badge.name}
                                    </h4>
                                    {badge.module?.subject?.name && (
                                      <span className="text-xs font-mono font-extrabold text-[#3E53A2] bg-[#5A77DF]/10 px-2 py-0.5 rounded border border-[#5A77DF]/20 uppercase inline-block mt-0.5">
                                        {badge.module.subject.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed font-medium">
                                {badge.description || "Tidak ada deskripsi."}
                              </p>

                              {/* Target Module Pill */}
                              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl text-xs font-mono">
                                <span className="text-zinc-500 font-bold uppercase">
                                  Modul :
                                </span>
                                <span className="font-extrabold text-[#3E53A2] truncate max-w-[200px]">
                                  {badge.module?.title || "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    /* 2-Column Form & Grid for Subject Teacher */
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                      {/* Left Column: Form Tambah/Edit Badge */}
                      <form
                        onSubmit={handleSaveBadge}
                        className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 space-y-4 text-left shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                          <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                            {badgeForm.id ? (
                              <Edit3 className="h-4 w-4 text-[#5A77DF]" />
                            ) : (
                              <PlusCircle className="h-4 w-4 text-[#5A77DF]" />
                            )}
                            <span>
                              {badgeForm.id
                                ? "Edit Badge"
                                : "Tambah Badge Baru"}
                            </span>
                          </h3>
                          {badgeForm.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setBadgeForm({
                                  id: null,
                                  name: "",
                                  description: "",
                                  image_url: "🏆",
                                  module_id: "",
                                })
                              }
                              className="text-3xs text-rose-600 hover:underline font-extrabold cursor-pointer"
                            >
                              Batal Edit
                            </button>
                          )}
                        </div>

                        {badgeMessage && (
                          <div
                            className={`rounded-xl p-3 text-xs font-semibold ${badgeMessage.includes("berhasil") ? "bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}
                          >
                            {badgeMessage}
                          </div>
                        )}

                        {/* Nama Badge */}
                        <div className="space-y-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Nama Badge / Lencana *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Pakar SPLDV, Master Matriks, Juara Aljabar"
                            value={badgeForm.name}
                            onChange={(e) =>
                              setBadgeForm({
                                ...badgeForm,
                                name: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] focus:bg-white font-medium"
                          />
                        </div>

                        {/* Pilihan Modul Pelajaran */}
                        <div className="space-y-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Target Modul Pelajaran *
                          </label>
                          <select
                            required
                            value={badgeForm.module_id}
                            onChange={(e) =>
                              setBadgeForm({
                                ...badgeForm,
                                module_id: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] focus:bg-white font-semibold"
                          >
                            <option value="">
                              -- Pilih Modul Pelajaran --
                            </option>
                            {teacherModulesForBadge.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.subject?.name ? `[${m.subject.name}] ` : ""}
                                {m.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Gambar Icon / Emoji Badge */}
                        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 text-left">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono block">
                            Gambar Icon / Logo Badge *
                          </label>

                          <div className="flex items-center gap-4">
                            {/* Live Preview Box */}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#5A77DF]/30 bg-white text-2xl shadow-xs overflow-hidden">
                              {badgeForm.image_url?.startsWith("/") ||
                              badgeForm.image_url?.startsWith("http") ? (
                                <img
                                  src={badgeForm.image_url}
                                  alt="Preview Badge"
                                  className="h-full w-full object-cover p-1"
                                />
                              ) : (
                                <span>{badgeForm.image_url || "🏆"}</span>
                              )}
                            </div>

                            {/* File Upload Button & Status */}
                            <div className="flex-1 space-y-1">
                              <label className="inline-flex items-center gap-2 rounded-xl border border-[#5A77DF]/30 bg-white hover:bg-[#5A77DF]/10 px-4 py-2.5 text-xs font-extrabold text-[#3E53A2] transition cursor-pointer shadow-xs">
                                <Upload className="w-4 h-4 text-[#5A77DF]" />
                                <span>
                                  {uploadingBadgeImage
                                    ? "Mengunggah..."
                                    : "Unggah Gambar Badge"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingBadgeImage}
                                  onChange={handleUploadBadgeImage}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-4xs text-zinc-500 font-medium">
                                Format: PNG, JPG, GIF, WebP (Maks 50MB)
                              </p>
                            </div>
                          </div>

                          {/* Preset Emoji Picker */}
                          <div className="pt-2 border-t border-zinc-200/80">
                            <span className="text-4xs font-mono text-zinc-500 font-bold uppercase block mb-1.5">
                              Atau Pilih Emoji Preset:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                "🏆",
                                "⭐",
                                "🥇",
                                "🎖️",
                                "🚀",
                                "💡",
                                "🧠",
                                "🎯",
                                "👑",
                              ].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() =>
                                    setBadgeForm({
                                      ...badgeForm,
                                      image_url: emoji,
                                    })
                                  }
                                  className={`h-8 w-8 text-sm rounded-xl border flex items-center justify-center transition cursor-pointer ${
                                    badgeForm.image_url === emoji
                                      ? "border-[#5A77DF] bg-[#5A77DF] text-white shadow-xs font-bold scale-105"
                                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Deskripsi Badge */}
                        <div className="space-y-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                            Deskripsi Penghargaan
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Jelaskan syarat atau apresiasi dari badge ini..."
                            value={badgeForm.description}
                            onChange={(e) =>
                              setBadgeForm({
                                ...badgeForm,
                                description: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] focus:bg-white custom-scrollbar font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingBadge}
                          className="w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2.5 text-xs font-extrabold text-white transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="h-4 w-4" />
                          {submittingBadge
                            ? "Menyimpan..."
                            : badgeForm.id
                              ? "Simpan Perubahan Badge"
                              : "Tambah Badge Baru"}
                        </button>
                      </form>

                      {/* Right Column: List of Existing Badges */}
                      <div className="space-y-4 text-left">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                          <h3 className="text-xs font-extrabold text-[#5A77DF] font-mono uppercase tracking-wider">
                            Daftar Badge Yang Sudah Aktif
                          </h3>
                        </div>

                        {loadingBadges ? (
                          <div className="p-8 text-center text-xs text-zinc-500 font-medium">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#5A77DF] border-t-transparent mb-2" />
                            <p>Memuat daftar badge...</p>
                          </div>
                        ) : badgeList.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 italic">
                            Belum ada badge yang dibuat di modul kelas ini.
                          </div>
                        ) : (
                          <div className="grid gap-3.5 sm:grid-cols-1 md:grid-cols-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
                            {badgeList.map((badge) => (
                              <div
                                key={badge.id}
                                className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-3 flex flex-col justify-between hover:border-[#5A77DF] hover:shadow-md transition-all duration-200 group relative overflow-hidden text-left"
                              >
                                <div className="space-y-2.5">
                                  {/* Emblem & Title Row */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-2xl shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                                        {badge.image_url?.startsWith("/") ||
                                        badge.image_url?.startsWith("http") ? (
                                          <img
                                            src={badge.image_url}
                                            alt={badge.name}
                                            className="h-full w-full object-cover p-1"
                                          />
                                        ) : (
                                          <span>{badge.image_url || "🏆"}</span>
                                        )}
                                      </div>

                                      <div>
                                        <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-[#5A77DF] transition leading-snug">
                                          {badge.name}
                                        </h4>
                                        {badge.module?.subject?.name && (
                                          <span className="text-xs font-mono font-extrabold text-[#3E53A2] bg-[#5A77DF]/10 px-2 py-0.5 rounded border border-[#5A77DF]/20 uppercase inline-block mt-0.5">
                                            {badge.module.subject.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Icon Action Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        title="Edit Badge"
                                        onClick={() =>
                                          setBadgeForm({
                                            id: badge.id,
                                            name: badge.name,
                                            description:
                                              badge.description || "",
                                            image_url: badge.image_url || "🏆",
                                            module_id: String(badge.module_id),
                                          })
                                        }
                                        className="h-8 w-8 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 transition cursor-pointer flex items-center justify-center shadow-2xs"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Hapus Badge"
                                        onClick={() =>
                                          handleDeleteBadge(badge.id)
                                        }
                                        className="h-8 w-8 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 transition cursor-pointer flex items-center justify-center shadow-2xs"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed font-medium">
                                    {badge.description || "Tidak ada deskripsi."}
                                  </p>

                                  {/* Target Module Pill */}
                                  <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl text-xs font-mono">
                                    <span className="text-zinc-500 font-bold uppercase">
                                      Modul :
                                    </span>
                                    <span className="font-extrabold text-[#3E53A2] truncate max-w-[200px]">
                                      {badge.module?.title || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Subject Pretest Modal Dialog */}
      {activePretestSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-200 bg-white p-6 space-y-5 shadow-2xl text-left custom-scrollbar text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-cyan-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-600 shrink-0" />
                  <span>Kelola Pretest Mata Pelajaran</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Mata Pelajaran:{" "}
                  <span className="font-bold text-zinc-900">
                    {activePretestSubject.name}
                  </span>{" "}
                  ({activePretestSubject.class?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSubjectPretestModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer font-bold text-xs"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectPretest} className="space-y-4">
              <div>
                <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-cyan-800 font-mono">
                  Judul Kuis Pretest Mata Pelajaran *
                </label>
                <input
                  type="text"
                  value={subjectPretestTitle}
                  onChange={(e) => setSubjectPretestTitle(e.target.value)}
                  placeholder="Contoh: Pretest Kemampuan Dasar Matematika Kelas 9"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 font-bold shadow-xs"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-800">
                    Soal-Soal Pretest Mata Pelajaran ({subjectPretestQuestions.length} Soal):
                  </p>
                  <div>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      ref={pretestFileInputRef}
                      onChange={handleImportPretest}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={importingPretest}
                      onClick={() => pretestFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300 bg-white hover:bg-cyan-50 px-3 py-1.5 text-2xs font-extrabold text-cyan-800 transition cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{importingPretest ? "Memproses File..." : "Import Soal (Word / PDF)"}</span>
                    </button>
                  </div>
                </div>
                {subjectPretestQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="space-y-3 border border-cyan-200 bg-cyan-50/40 rounded-2xl p-4 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-cyan-900 font-mono">
                        Soal Pretest #{qIdx + 1}:
                      </span>
                      {subjectPretestQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSubjectPretestQuestion(qIdx)
                          }
                          className="text-3xs text-rose-700 hover:text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Soal</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) =>
                        handleSubjectPretestQuestionChange(
                          qIdx,
                          "question",
                          e.target.value,
                        )
                      }
                      placeholder={`Tulis pertanyaan pretest ke-${qIdx + 1}...`}
                      required
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-cyan-500 font-medium"
                    />
                    <div className="grid gap-2 sm:grid-cols-2 mt-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`subj_pretest_${qIdx}_correct`}
                            checked={q.correctIndex === optIdx}
                            onChange={() =>
                              handleSubjectPretestQuestionChange(
                                qIdx,
                                "correctIndex",
                                optIdx,
                              )
                            }
                            className="accent-cyan-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              handleSubjectPretestQuestionChange(
                                qIdx,
                                "option",
                                e.target.value,
                                optIdx,
                              )
                            }
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                            required
                            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSubjectPretestQuestion}
                  className="w-full py-2.5 rounded-xl border border-cyan-300 bg-white hover:bg-cyan-50 text-cyan-800 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-cyan-600" />
                  <span>Tambah Soal Pretest</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseSubjectPretestModal}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSubjectPretest}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 px-5 py-2 text-xs font-extrabold text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingSubjectPretest
                    ? "Menyimpan..."
                    : "Simpan Pretest Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tambah Pengampuan Kelas & Mapel Modal Dialog (Unified) */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <School className="w-4 h-4 text-[#5A77DF]" />
                <span>Tambah Pengampuan Kelas & Mata Pelajaran</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubjectModal(false);
                  setModalFeedbackMsg(null);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-medium">
              Pilih kelas terlebih dahulu, kemudian tentukan mata pelajaran yang Anda ampu pada kelas tersebut.
            </p>

            {modalFeedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  modalFeedbackMsg.includes("berhasil")
                    ? "bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {modalFeedbackMsg}
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmitModal} className="space-y-4">
              {/* Step 1: Pilih Kelas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                    1. Pilih Kelas Pengampuan 
                  </label>
                  {/* {!isAddingNewClass && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewClass(true);
                        setNewSubjectClassIdInput("__NEW_CLASS__");
                      }}
                      className="text-3xs text-[#5A77DF] hover:underline font-bold cursor-pointer"
                    >
                      + Tambah Kelas Baru
                    </button>
                  )} */}
                </div>

                {!isAddingNewClass ? (
                  <select
                    required
                    value={newSubjectClassIdInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__NEW_CLASS__") {
                        setIsAddingNewClass(true);
                        setNewSubjectClassIdInput("__NEW_CLASS__");
                        setNewSubjectNameInput("");
                        setIsCustomSubject(false);
                        setCustomSubjectName("");
                      } else {
                        setNewSubjectClassIdInput(val);
                        setIsAddingNewClass(false);
                        setNewSubjectNameInput("");
                        setIsCustomSubject(false);
                        setCustomSubjectName("");
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="">-- Pilih Kelas Pengampuan --</option>
                    {classesList.length === 0 ? (
                      <option value="" disabled>Memuat daftar kelas...</option>
                    ) : (
                      classesList.map((c: any) => {
                        const count = c.subjects ? c.subjects.length : 0;
                        const label = `${c.displayName || (c.major ? `${c.name} ${c.major}` : c.name)} (${count > 0 ? `${count} Mapel` : "Belum ada mapel"})`;
                        return (
                          <option key={c.id} value={c.id}>
                            {label}
                          </option>
                        );
                      })
                    )}
                    {/* <option value="__NEW_CLASS__">
                      + Tambah / Daftarkan Kelas Baru...
                    </option> */}
                  </select>
                ) : (
                  <div className="p-3.5 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-[#3E53A2]">
                        Daftarkan Kelas Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewClass(false);
                          setNewSubjectClassIdInput("");
                          setNewSubjectNameInput("");
                          setIsCustomSubject(false);
                          setCustomSubjectName("");
                        }}
                        className="text-3xs text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Batal (Pilih dari daftar)
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-3xs font-semibold text-zinc-600 block mb-1">
                          Nama Kelas *
                        </label>
                        <input
                          type="text"
                          required
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Contoh: Kelas 10 IPA 2"
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-[#5A77DF]"
                        />
                      </div>
                      <div>
                        <label className="text-3xs font-semibold text-zinc-600 block mb-1">
                          Jurusan *
                        </label>
                        <input
                          type="text"
                          required
                          value={newClassMajor}
                          onChange={(e) => setNewClassMajor(e.target.value)}
                          placeholder="Contoh: IPA"
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-[#5A77DF]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-3xs font-semibold text-zinc-600 block mb-1">
                        Tahun Ajaran
                      </label>
                      <input
                        type="text"
                        value={newClassAcademicYear}
                        onChange={(e) => setNewClassAcademicYear(e.target.value)}
                        placeholder="2025/2026"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-[#5A77DF]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Pilih / Masukkan Mata Pelajaran (Muncul setelah kelas dipilih / sedang dibuat) */}
              {(newSubjectClassIdInput || isAddingNewClass) && (() => {
                const selectedClassObj = classesList.find(
                  (c: any) => String(c.id) === String(newSubjectClassIdInput)
                );
                const classSubjects: any[] = selectedClassObj?.subjects || [];

                return (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-2xs font-extrabold uppercase tracking-wider text-[#3E53A2] font-mono">
                        2. Pilih Mata Pelajaran *
                      </label>
                      {/* {selectedClassObj && !isAddingNewClass && (
                        <span className="text-3xs text-zinc-500 font-mono font-bold">
                          {classSubjects.length} Mapel di Database
                        </span>
                      )} */}
                    </div>

                    {isAddingNewClass ? (
                      <div className="space-y-1.5 p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                        <label className="text-3xs font-semibold text-blue-900 block">
                          Nama Mata Pelajaran untuk Kelas Baru:
                        </label>
                        <input
                          type="text"
                          required
                          value={customSubjectName}
                          onChange={(e) => {
                            setCustomSubjectName(e.target.value);
                            setNewSubjectNameInput(e.target.value);
                          }}
                          placeholder="Contoh: Matematika, Fisika, Biologi..."
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                        />
                      </div>
                    ) : classSubjects.length > 0 ? (
                      !isCustomSubject ? (
                        <div className="space-y-2">
                          <select
                            required
                            value={newSubjectNameInput}
                            onChange={(e) => {
                              if (e.target.value === "__NEW_SUBJECT__") {
                                setIsCustomSubject(true);
                                setCustomSubjectName("");
                                setNewSubjectNameInput("");
                              } else {
                                setNewSubjectNameInput(e.target.value);
                              }
                            }}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] focus:bg-white font-semibold cursor-pointer"
                          >
                            <option value="">Pilih Mata Pelajaran</option>
                            {classSubjects.map((cs: any) => {
                              const isMine = cs.teacher_id === data?.teacher?.id;
                              const isOther = cs.teacher_id && !isMine;
                              const teacherLabel = isMine
                                ? "✓ (Sudah Anda ampu)"
                                : isOther
                                ? `(Sudah diampu: ${cs.teacher?.name || "Guru lain"})`
                                : "(Tersedia)";
                              return (
                                <option
                                  key={`cs-${cs.id}`}
                                  value={cs.name}
                                  disabled={isMine}
                                >
                                  {cs.name} {teacherLabel}
                                </option>
                              );
                            })}
                            {/* <option value="__NEW_SUBJECT__" className="text-[#3E53A2] font-bold">
                              + Tambah Mata Pelajaran Baru ke Kelas Ini...
                            </option> */}
                          </select>
                          {/* <p className="text-3xs text-zinc-500 font-medium">
                            💡 Hanya menampilkan mata pelajaran yang terdaftar untuk <strong>{selectedClassObj?.displayName || selectedClassObj?.name}</strong> di database.
                          </p> */}
                        </div>
                      ) : (
                        <div className="space-y-2 p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                          <div className="flex items-center justify-between">
                            <span className="text-2xs font-bold text-blue-900">
                              Tambah Mapel Baru ke {selectedClassObj?.displayName || selectedClassObj?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomSubject(false);
                                setCustomSubjectName("");
                                setNewSubjectNameInput("");
                              }}
                              className="text-3xs text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Batal (Pilih Mapel dari Database)
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={customSubjectName}
                            onChange={(e) => {
                              setCustomSubjectName(e.target.value);
                              setNewSubjectNameInput(e.target.value);
                            }}
                            placeholder="Ketikkan nama mata pelajaran baru..."
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                          />
                        </div>
                      )
                    ) : (
                      <div className="space-y-2.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">
                              Belum ada mata pelajaran terdaftar di {selectedClassObj?.displayName || selectedClassObj?.name}
                            </p>
                            <p className="text-3xs text-amber-700 mt-0.5">
                              Kelas ini belum memiliki mata pelajaran di database. Silakan ketik nama mata pelajaran untuk mendaftarkannya ke kelas ini.
                            </p>
                          </div>
                        </div>
                        <input
                          type="text"
                          required
                          value={customSubjectName}
                          onChange={(e) => {
                            setCustomSubjectName(e.target.value);
                            setNewSubjectNameInput(e.target.value);
                          }}
                          placeholder="Ketikkan nama mata pelajaran (contoh: Matematika, Fisika)..."
                          className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setModalFeedbackMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 text-xs font-bold transition hover:bg-zinc-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSubject}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] text-white text-xs font-bold shadow-md transition hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {submittingSubject ? "Menyimpan..." : "Simpan Pengampuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola / Tambah Kelas Binaan Guru BK */}
      {showManageBkClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <School className="w-4 h-4 text-[#5A77DF]" />
                <span>Tambah & Kelola Kelas Binaan BK</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManageBkClassModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Tambah kelas binaan baru untuk bimbingan konseling Anda. Data siswa dari seluruh kelas binaan yang Anda tambahkan akan otomatis tampil di dashboard & intervensi pesan.
            </p>

            {/* List of currently assigned BK classes */}
            {data?.teacher?.classes && data.teacher.classes.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-zinc-100">
                <label className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                  Daftar Kelas Binaan Terdaftar ({data.teacher.classes.length})
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {data.teacher.classes.map((c: any) => {
                    const subjObj = data?.teacher?.subjects?.find((s: any) => s.classId === c.id);
                    return (
                      <div
                        key={`bina-${c.id}`}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-[#5A77DF]" />
                          <span>{c.name} ({c.major || "Umum"})</span>
                        </div>
                        {subjObj && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBkClass(subjObj.id)}
                            className="text-3xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 font-extrabold cursor-pointer transition"
                            title="Lepas Kelas Binaan ini"
                          >
                            Lepas
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBkClass} className="space-y-4 pt-2 border-t border-zinc-100">
              <div className="space-y-1.5">
                <label className="text-2xs font-bold uppercase tracking-wider text-zinc-600">
                  Tambah Kelas Binaan Baru *
                </label>
                <select
                  value={selectedBkClassId}
                  onChange={(e) => setSelectedBkClassId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="">
                    -- Pilih Kelas Sekolah untuk Ditambahkan --
                  </option>
                  {classesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName || (c.major ? `${c.name} ${c.major}` : c.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManageBkClassModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 text-xs font-bold transition hover:bg-zinc-200 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={updatingBkClass || !selectedBkClassId}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] text-white text-xs font-bold shadow-md transition hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {updatingBkClass ? "Menambahkan..." : "+ Tambah Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Module Form Modal Overlay */}
      {showModuleFormModal && activeSubjectIdForModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn overflow-hidden">
          <div className="w-full max-w-5xl h-full max-h-[90vh] rounded-3xl border border-zinc-200/80 bg-white shadow-2xl flex flex-col overflow-hidden text-zinc-900">
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 sm:px-8 py-5 shrink-0 bg-white rounded-t-3xl">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-[#5A77DF] font-mono">
                  Formulir Modul Pembelajaran
                </span>
                <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2 mt-0.5">
                  {editingModuleId ? (
                    <>
                      <Edit3 className="w-5 h-5 text-amber-600" />
                      <span>Edit Modul & Postest</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5 text-[#5A77DF]" />
                      <span>Tambah Modul & Postest Baru</span>
                    </>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => resetModuleForm()}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body INSIDE Modal */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar text-left">
              <form
                id="module-form-modal"
                onSubmit={handleAddModule}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                      Judul Modul *
                    </label>
                    <input
                      type="text"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      placeholder="Contoh: Pengenalan Aljabar"
                      required
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                      Target Level Penempatan *
                    </label>
                    <select
                      value={newModuleLevel}
                      onChange={(e) => setNewModuleLevel(e.target.value)}
                      required
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-bold shadow-xs cursor-pointer"
                    >
                      <option value="Beginner">Beginner (Dasar)</option>
                      <option value="Intermediate">
                        Intermediate (Menengah)
                      </option>
                      <option value="Advanced">Advanced (Lanjutan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                      URL Video (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newModuleVideoUrl}
                      onChange={(e) => setNewModuleVideoUrl(e.target.value)}
                      placeholder="Contoh: https://youtube.com/..."
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                    Materi Modul Pembelajaran *
                  </label>
                  <RichTextEditor
                    value={newModuleContent}
                    onChange={setNewModuleContent}
                    placeholder="Tuliskan materi pelajaran secara mendalam di sini, Anda juga dapat menyisipkan gambar dan video..."
                  />
                </div>

                {/* Posttest Creation Fields */}
                <div className="border border-[#5A77DF]/20 rounded-2xl p-5 bg-[#5A77DF]/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#5A77DF]/10 pb-2">
                    <div>
                      <h5 className="font-extrabold text-[#3E53A2] text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#5A77DF]" />
                        <span>Kuis Postest Pelajaran (Opsional)</span>
                      </h5>
                      <p className="text-3xs text-zinc-500 font-medium">
                        Diisi untuk menguji pemahaman siswa setelah membaca
                        materi modul ini.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                      Judul Kuis Postest
                    </label>
                    <input
                      type="text"
                      value={newQuizTitle}
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="Contoh: Kuis Postest Aljabar Kelas 9"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] font-bold shadow-xs"
                    />
                  </div>

                  {newQuizTitle.trim() && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-2xs font-extrabold uppercase tracking-wider text-zinc-600 font-mono">
                          Daftar Soal Postest ({posttestQuestions.length} Soal):
                        </label>
                        <div>
                          <input
                            type="file"
                            accept=".docx,.pdf,.txt"
                            ref={posttestFileInputRef}
                            onChange={handleImportPosttest}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={importingPosttest}
                            onClick={() => posttestFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#5A77DF]/40 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 px-3 py-1.5 text-2xs font-extrabold text-[#3E53A2] transition cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#5A77DF]" />
                            <span>{importingPosttest ? "Memproses File..." : "Import Soal (Word / PDF)"}</span>
                          </button>
                        </div>
                      </div>
                      {posttestQuestions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="space-y-3 border border-zinc-200 bg-white rounded-xl p-4 relative shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-[#3E53A2] font-mono">
                              Soal Postest #{qIdx + 1}:
                            </span>
                            {posttestQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePosttestQuestion(qIdx)
                                }
                                className="text-3xs text-rose-700 hover:text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus Soal</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handlePosttestQuestionChange(
                                qIdx,
                                "question",
                                e.target.value,
                              )
                            }
                            placeholder={`Tulis pertanyaan postest ke-${qIdx + 1}...`}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium"
                          />
                          <div className="grid gap-2 sm:grid-cols-2 mt-2">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={`posttest_${qIdx}_correct`}
                                  checked={q.correctIndex === optIdx}
                                  onChange={() =>
                                    handlePosttestQuestionChange(
                                      qIdx,
                                      "correctIndex",
                                      optIdx,
                                    )
                                  }
                                  className="accent-[#5A77DF]"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) =>
                                    handlePosttestQuestionChange(
                                      qIdx,
                                      "option",
                                      e.target.value,
                                      optIdx,
                                    )
                                  }
                                  placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddPosttestQuestion}
                        className="w-full py-2.5 rounded-xl border border-[#5A77DF]/30 bg-white hover:bg-[#5A77DF]/10 text-[#3E53A2] font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4 text-[#5A77DF]" />
                        <span>Tambah Soal Postest</span>
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 sm:px-8 py-4 bg-zinc-50/80 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => resetModuleForm()}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 px-5 py-2.5 text-xs font-extrabold text-zinc-600 transition cursor-pointer shadow-2xs"
              >
                Batal
              </button>
              <button
                type="submit"
                form="module-form-modal"
                className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition cursor-pointer"
              >
                {editingModuleId
                  ? "Simpan Perubahan Modul"
                  : "Simpan Modul & Postest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-[99999] p-4 rounded-xl text-xs font-bold shadow-2xl animate-fadeIn flex items-center gap-2.5 border ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : toastMsg.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-300"
              : "bg-blue-50 text-blue-700 border-blue-300"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModalState.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-zinc-200">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className={`p-2.5 rounded-full shrink-0 ${
                confirmModalState.type === "danger"
                  ? "bg-rose-100 text-rose-600"
                  : confirmModalState.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
              }`}>
                {confirmModalState.type === "danger" ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmModalState.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">{confirmModalState.title}</h3>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              {confirmModalState.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
              >
                {confirmModalState.cancelText || "Batal"}
              </button>
              <button
                type="button"
                onClick={confirmModalState.onConfirm}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-sm ${
                  confirmModalState.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmModalState.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#5A77DF] hover:bg-[#3E53A2]"
                }`}
              >
                {confirmModalState.confirmText || "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
