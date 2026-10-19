"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  School,
  BookOpen,
  FileCode,
  HelpCircle,
  Target,
  RefreshCw,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Save,
  Search,
  X,
  RotateCcw,
  FileText,
  Brain,
  Key,
  Check,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Bell,
  Settings,
  Menu,
  Download,
  Printer,
  Upload,
  FileSpreadsheet
} from "lucide-react";

type DashboardTab = "overview" | "users" | "teachers" | "actors" | "classes" | "subjects" | "modules" | "quizzes" | "pretest_screening" | "attempts" | "screening";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Loaded DB data
  const [summary, setSummary] = useState({ modules: 0, quizzes: 0, users: 0, journals: 0, atRisk: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [screeningAttempts, setScreeningAttempts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [adminActors, setAdminActors] = useState<any[]>([]);

  // Modal Control States
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [activeQuizForQuestions, setActiveQuizForQuestions] = useState<any>(null);

  const [showQuestionEditModal, setShowQuestionEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const [showAttemptDetailModal, setShowAttemptDetailModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  // Admin Change Password states
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminOldPassword, setAdminOldPassword] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [changingAdminPass, setChangingAdminPass] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
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
    confirmText = "Hapus",
    cancelText = "Batal"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
    });
  };

  const handleChangePasswordAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOldPassword || !adminNewPassword) {
      setAdminPassMsg({ text: "Password lama dan password baru wajib diisi.", type: "error" });
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPassMsg({ text: "Konfirmasi password baru tidak cocok.", type: "error" });
      return;
    }
    if (adminNewPassword.length < 6) {
      setAdminPassMsg({ text: "Password baru minimal 6 karakter.", type: "error" });
      return;
    }

    setChangingAdminPass(true);
    setAdminPassMsg(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: adminOldPassword,
          newPassword: adminNewPassword,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAdminPassMsg({ text: "Password Admin berhasil diperbarui!", type: "success" });
        setAdminOldPassword("");
        setAdminNewPassword("");
        setAdminConfirmPassword("");
      } else {
        setAdminPassMsg({ text: json.message || "Gagal mengubah password Admin.", type: "error" });
      }
    } catch {
      setAdminPassMsg({ text: "Terjadi kesalahan koneksi server.", type: "error" });
    } finally {
      setChangingAdminPass(false);
    }
  };

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [tName, setTName] = useState("");
  const [tNip, setTNip] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tType, setTType] = useState("subject");
  const [tSpecialization, setTSpecialization] = useState("");
  const [tPosition, setTPosition] = useState("");
  const [tClassId, setTClassId] = useState("");
  const [tSelectedSubjectIds, setTSelectedSubjectIds] = useState<number[]>([]);

  // Admin Actor Modal States
  const [showActorModal, setShowActorModal] = useState(false);
  const [selectedActor, setSelectedActor] = useState<any>(null);
  const [actorName, setActorName] = useState("");
  const [actorUsername, setActorUsername] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [actorPassword, setActorPassword] = useState("");
  const [showActorPassword, setShowActorPassword] = useState(false);
  const [actorDivision, setActorDivision] = useState("");
  const [actorUnit, setActorUnit] = useState("");
  const [actorPermissions, setActorPermissions] = useState<string[]>([]);

  // Search & Filter States for Dashboard Tabs
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeacherType, setFilterTeacherType] = useState("all");
  const [filterClassId, setFilterClassId] = useState("all");
  const [filterQuizType, setFilterQuizType] = useState("all");

  // Form Field States
  // User Form
  const [uUsername, setUUsername] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [showUPassword, setShowUPassword] = useState(false);
  const [uRole, setURole] = useState("student");
  const [uName, setUName] = useState("");
  const [uNis, setUNis] = useState("");
  const [uClassId, setUClassId] = useState("");
  const [uNip, setUNip] = useState("");
  const [uPhoneNumber, setUPhoneNumber] = useState("");
  const [uTeacherType, setUTeacherType] = useState("subject");
  const [uSubjectId, setUSubjectId] = useState("");
  const [uSpecialization, setUSpecialization] = useState("");
  const [uPosition, setUPosition] = useState("");
  const [uDivision, setUDivision] = useState("");
  const [uUnit, setUUnit] = useState("");

  // Class Form
  const [cName, setCName] = useState("");
  const [cMajor, setCMajor] = useState("");
  const [cAcademicYear, setCAcademicYear] = useState("2025/2026");

  // Subject Form
  const [sName, setSName] = useState("");
  const [sClassId, setSClassId] = useState("");
  const [sTeacherId, setSTeacherId] = useState("");

  // Module Form
  const [mTitle, setMTitle] = useState("");
  const [mContent, setMContent] = useState("");
  const [mVideoUrl, setMVideoUrl] = useState("");
  const [mCategoryId, setMCategoryId] = useState("");
  const [mLevelId, setMLevelId] = useState("");
  const [mSubjectId, setMSubjectId] = useState("");

  // Quiz Form
  const [qTitle, setQTitle] = useState("");
  const [qType, setQType] = useState("posttest");
  const [qModuleId, setQModuleId] = useState("");

  // Question Form
  const [questionText, setQuestionText] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);

  // Fetch admin dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          router.push("/admin");
        }
        return;
      }

      setSummary(data.summary || { modules: 0, quizzes: 0, users: 0, journals: 0, atRisk: 0 });
      setUsers(data.users || []);
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setModules(data.modules || []);
      setQuizzes(data.quizzes || []);
      setQuizAttempts(data.quizAttempts || []);
      setScreeningAttempts(data.screeningAttempts || []);
      setCategories(data.categories || []);
      setLevels(data.levels || []);
      setTeachers(data.teachers || []);
      setAdminActors(data.adminActors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      router.push("/admin");
    } catch {
      router.push("/admin");
    }
  };

  // ========================================================
  // CRUD SUBMISSION HANDLERS
  // ========================================================

  // USER CRUD
  const handleOpenUserCreate = () => {
    setSelectedUser(null);
    setUUsername("");
    setUEmail("");
    setUPassword("");
    setURole("student");
    setUName("");
    setUNis("");
    setUClassId(classes[0]?.id?.toString() || "");
    setUNip("");
    setUPhoneNumber("");
    setUTeacherType("subject");
    setUSubjectId("");
    setUSpecialization("");
    setUPosition("");
    setUDivision("");
    setUUnit("");
    setShowUserModal(true);
  };

  const handleOpenUserEdit = (user: any) => {
    setSelectedUser(user);
    setUUsername(user.username || "");
    setUEmail(user.email || "");
    setUPassword("");
    setURole(user.role || "student");
    setUName(user.name || "");
    setUNis(user.nis || "");
    setUClassId(user.class_id?.toString() || "");
    setUNip(user.nip || "");
    setUPhoneNumber(user.phone_number || "");
    setUTeacherType(user.teacher_type || "subject");
    setUSubjectId(user.subject_id?.toString() || "");
    setUSpecialization(user.specialization || "");
    setUPosition(user.position || "");
    setUDivision(user.division || "");
    setUUnit(user.unit || "");
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedUser ? "update" : "create",
      entity: "user",
      data: {
        id: selectedUser?.id,
        username: uUsername,
        email: uEmail,
        password: uPassword || undefined,
        role: uRole,
        name: uName,
        nis: uRole === "student" ? uNis : undefined,
        class_id: (uRole === "student" || uRole === "teacher") ? uClassId : undefined,
        nip: uRole === "teacher" ? uNip : undefined,
        phone_number: uRole === "teacher" ? uPhoneNumber : undefined,
        teacher_type: uRole === "teacher" ? uTeacherType : undefined,
        subject_id: uRole === "teacher" && uTeacherType === "subject" ? uSubjectId : undefined,
        specialization: uRole === "teacher" ? uSpecialization : undefined,
        position: uRole === "teacher" ? uPosition : undefined,
        division: uRole === "admin" ? uDivision : undefined,
        unit: uRole === "admin" ? uUnit : undefined,
      }
    };

    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowUserModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Terjadi kesalahan koneksi.", "error");
    }
  };

  const handleUserDelete = (id: number) => {
    showConfirmDialog("Hapus Akun Pengguna", "Apakah Anda yakin ingin menghapus user ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "user", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus user.", "error");
      }
    });
  };

  // CLASS CRUD
  const handleOpenClassCreate = () => {
    setSelectedClass(null);
    setCName("");
    setCMajor("");
    setCAcademicYear("2025/2026");
    setShowClassModal(true);
  };

  const handleOpenClassEdit = (cls: any) => {
    setSelectedClass(cls);
    setCName(cls.name);
    setCMajor(cls.major || "");
    setCAcademicYear(cls.academic_year || cls.year || "2025/2026");
    setShowClassModal(true);
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedClass ? "update" : "create",
      entity: "class",
      data: {
        id: selectedClass?.id,
        name: cName,
        major: cMajor,
        academic_year: cAcademicYear
      }
    };
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowClassModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan kelas.", "error");
    }
  };

  const handleClassDelete = (id: number) => {
    showConfirmDialog("Hapus Data Kelas", "Apakah Anda yakin ingin menghapus kelas ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "class", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus kelas.", "error");
      }
    });
  };

  // TEACHER CRUD & ASSIGNMENT
  const handleOpenTeacherEdit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTName(teacher.name || "");
    setTNip(teacher.nip || "");
    setTPhone(teacher.phone_number || "");
    setTType(teacher.type || "subject");
    setTSpecialization(teacher.specialization || "");
    setTPosition(teacher.position || "");
    setTClassId(teacher.class_id?.toString() || "");
    
    // Pre-select subject IDs assigned to this teacher
    const assignedIds = (teacher.subjects || []).map((s: any) => s.id);
    setTSelectedSubjectIds(assignedIds);
    
    setShowTeacherModal(true);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const payload = {
      action: "assign_subjects",
      entity: "teacher",
      data: {
        id: selectedTeacher.id,
        name: tName,
        nip: tNip,
        phone_number: tPhone,
        type: tType,
        specialization: tSpecialization,
        position: tPosition,
        class_id: tClassId || null,
        subject_ids: tSelectedSubjectIds
      }
    };

    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowTeacherModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan data pengampuan Guru.", "error");
    }
  };

  const toggleSubjectSelection = (subjectId: number) => {
    setTSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  // ADMIN ACTOR & PERMISSIONS CRUD
  const ALL_ADMIN_PERMISSIONS = [
    { key: "manage_users", label: "Manajemen Akun & Siswa", desc: "Akses ke tab Manajemen Akun (kelola akun siswa, NIS, registrasi, & password)." },
    { key: "manage_teachers", label: "Pengampuan & Jabatan Guru", desc: "Akses ke tab Pengampuan Guru (kelola NIP, jenis guru wali kelas/BK, alokasi mapel)." },
    { key: "manage_roles", label: "Aktor Admin & Hak Akses", desc: "Hak Superadmin untuk membuat akun aktor admin baru dan mengatur matriks perizinan." },
    { key: "manage_classes", label: "Data Kelas & Tahun Ajaran", desc: "Akses ke tab Data Kelas (kelola daftar kelas, jurusan, dan Tahun Ajaran/TA)." },
    { key: "manage_subjects", label: "Mata Pelajaran Sekolah", desc: "Akses ke tab Mata Pelajaran (tambah, edit, & alokasikan mapel ke guru)." },
    { key: "manage_modules", label: "Modul Pembelajaran", desc: "Akses ke tab Modul Pembelajaran (kelola isi konten modul, video youtube, kategori)." },
    { key: "manage_quizzes", label: "Kuis & Bank Soal Evaluation", desc: "Akses ke tab Kuis & Soal (kelola kuis evaluasi modul & pretest penempatan level)." },
    { key: "manage_pretest_screening", label: "Pretest Screening Mental (SRQ-29)", desc: "Akses ke tab Pretest Screening Mental (pengaturan kuesioner awal SRQ-29)." },
    { key: "manage_attempts", label: "Hasil Kuis Siswa", desc: "Akses ke tab Hasil Kuis Siswa (melihat rekapitulasi & detail lembar jawaban kuis)." },
    { key: "manage_screening", label: "Hasil Screening SRQ-29 Siswa", desc: "Akses ke tab Hasil Screening SRQ-29 (melihat rekap riwayat screening mental bulanan)." },
    { key: "manage_academics", label: "Manajemen Akademik (Gabungan)", desc: "Izin menyeluruh mencakup Kelas, Mapel, Modul Pembelajaran, dan Kuis." },
    { key: "manage_reports", label: "Laporan & Rekapitulasi (Gabungan)", desc: "Izin menyeluruh mencakup Hasil Kuis dan Hasil Screening SRQ-29." },
  ];

  const handleOpenActorCreate = () => {
    setSelectedActor(null);
    setActorName("");
    setActorUsername("");
    setActorEmail("");
    setActorPassword("");
    setActorDivision("Kurikulum & Akademik");
    setActorUnit("Sekolah Utama");
    setActorPermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.key));
    setShowActorModal(true);
  };

  const handleOpenActorEdit = (actor: any) => {
    setSelectedActor(actor);
    setActorName(actor.name || "");
    setActorUsername(actor.username || "");
    setActorEmail(actor.email || "");
    setActorPassword("");
    setActorDivision(actor.division || "");
    setActorUnit(actor.unit || "");
    setActorPermissions(Array.isArray(actor.permissions) ? actor.permissions : []);
    setShowActorModal(true);
  };

  const handleActorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedActor ? "update" : "create",
      entity: "admin_actor",
      data: {
        id: selectedActor?.id,
        name: actorName,
        username: actorUsername,
        email: actorEmail,
        password: actorPassword || undefined,
        division: actorDivision,
        unit: actorUnit,
        permissions: actorPermissions
      }
    };

    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowActorModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan data aktor admin.", "error");
    }
  };

  const handleActorDelete = (id: number) => {
    showConfirmDialog("Hapus Aktor Admin", "Apakah Anda yakin ingin menghapus akun Aktor Admin ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "admin_actor", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus aktor admin.", "error");
      }
    });
  };

  const togglePermission = (permKey: string) => {
    setActorPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  // SUBJECT CRUD
  const handleOpenSubjectCreate = () => {
    setSelectedSubject(null);
    setSName("");
    setSClassId(classes[0]?.id?.toString() || "");
    setSTeacherId("");
    setShowSubjectModal(true);
  };

  const handleOpenSubjectEdit = (sub: any) => {
    setSelectedSubject(sub);
    setSName(sub.name);
    setSClassId(sub.class_id?.toString() || "");
    setSTeacherId(sub.teacher_id?.toString() || "");
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedSubject ? "update" : "create",
      entity: "subject",
      data: {
        id: selectedSubject?.id,
        name: sName,
        class_id: sClassId,
        teacher_id: (sTeacherId && sTeacherId !== "" && sTeacherId !== "null") ? parseInt(sTeacherId) : null
      }
    };
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowSubjectModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan mata pelajaran.", "error");
    }
  };

  const handleSubjectDelete = (id: number) => {
    showConfirmDialog("Hapus Mata Pelajaran", "Apakah Anda yakin ingin menghapus mata pelajaran ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "subject", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus mata pelajaran.", "error");
      }
    });
  };

  // MODULE CRUD
  const handleOpenModuleCreate = () => {
    setSelectedModule(null);
    setMTitle("");
    setMContent("");
    setMVideoUrl("");
    setMCategoryId(categories[0]?.id?.toString() || "");
    setMLevelId(levels[0]?.id?.toString() || "");
    setMSubjectId("");
    setShowModuleModal(true);
  };

  const handleOpenModuleEdit = (mod: any) => {
    setSelectedModule(mod);
    setMTitle(mod.title);
    setMContent(mod.content || "");
    setMVideoUrl(mod.video_url || "");
    setMCategoryId(mod.category_id?.toString() || "");
    setMLevelId(mod.level_id?.toString() || "");
    setMSubjectId(mod.subject_id?.toString() || "");
    setShowModuleModal(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedModule ? "update" : "create",
      entity: "module",
      data: {
        id: selectedModule?.id,
        title: mTitle,
        content: mContent,
        video_url: mVideoUrl,
        category_id: mCategoryId,
        level_id: mLevelId,
        subject_id: mSubjectId || null
      }
    };
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowModuleModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan modul.", "error");
    }
  };

  const handleModuleDelete = (id: number) => {
    showConfirmDialog("Hapus Modul", "Apakah Anda yakin ingin menghapus modul ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "module", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus modul.", "error");
      }
    });
  };

  // QUIZ CRUD
  const handleOpenQuizCreate = () => {
    setSelectedQuiz(null);
    setQTitle("");
    setQType("posttest");
    setQModuleId(modules[0]?.id?.toString() || "");
    setShowQuizModal(true);
  };

  const handleOpenQuizEdit = (quiz: any) => {
    setSelectedQuiz(quiz);
    setQTitle(quiz.title);
    setQType(quiz.type);
    setQModuleId(quiz.module_id?.toString() || "");
    setShowQuizModal(true);
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      action: selectedQuiz ? "update" : "create",
      entity: "quiz",
      data: {
        id: selectedQuiz?.id,
        title: qTitle,
        type: qType,
        module_id: qType === "posttest" ? qModuleId : null
      }
    };
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowQuizModal(false);
        loadData();
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan kuis.", "error");
    }
  };

  const handleQuizDelete = (id: number) => {
    showConfirmDialog("Hapus Kuis", "Apakah Anda yakin ingin menghapus kuis ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "quiz", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          loadData();
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus kuis.", "error");
      }
    });
  };

  // QUIZ QUESTIONS CRUD
  const handleOpenQuestionsList = (quiz: any) => {
    setActiveQuizForQuestions(quiz);
    setShowQuestionsModal(true);
  };

  const handleOpenQuestionCreate = () => {
    setSelectedQuestion(null);
    setQuestionText("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setCorrectIndex(0);
    setShowQuestionEditModal(true);
  };

  const handleOpenQuestionEdit = (q: any) => {
    setSelectedQuestion(q);
    setQuestionText(q.question);
    setOption1(q.options[0]?.option_text || "");
    setOption2(q.options[1]?.option_text || "");
    setOption3(q.options[2]?.option_text || "");
    setOption4(q.options[3]?.option_text || "");
    
    const correctIdx = q.options.findIndex((o: any) => o.is_correct);
    setCorrectIndex(correctIdx !== -1 ? correctIdx : 0);
    
    setShowQuestionEditModal(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const optionsData = [
      { option_text: option1, is_correct: correctIndex === 0 },
      { option_text: option2, is_correct: correctIndex === 1 },
      { option_text: option3, is_correct: correctIndex === 2 },
      { option_text: option4, is_correct: correctIndex === 3 },
    ];

    const payload = {
      action: selectedQuestion ? "update" : "create",
      entity: "question",
      data: {
        id: selectedQuestion?.id,
        quiz_id: activeQuizForQuestions.id,
        question: questionText,
        options: optionsData
      }
    };

    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(data.message, "success");
        setShowQuestionEditModal(false);
        // Reload all data so that activeQuizForQuestions questions are updated
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const freshData = await response.json();
        if (freshData.success) {
          setQuizzes(freshData.quizzes || []);
          const freshQuiz = (freshData.quizzes || []).find((q: any) => q.id === activeQuizForQuestions.id);
          if (freshQuiz) {
            setActiveQuizForQuestions(freshQuiz);
          }
        }
      } else {
        triggerMessage(data.message, "error");
      }
    } catch {
      triggerMessage("Gagal menyimpan pertanyaan.", "error");
    }
  };

  const handleQuestionDelete = (id: number) => {
    showConfirmDialog("Hapus Pertanyaan", "Apakah Anda yakin ingin menghapus pertanyaan ini?", async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", entity: "question", data: { id } })
        });
        const data = await res.json();
        if (data.success) {
          triggerMessage(data.message, "success");
          // Reload questions list
          const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
          const freshData = await response.json();
          if (freshData.success) {
            setQuizzes(freshData.quizzes || []);
            const freshQuiz = (freshData.quizzes || []).find((q: any) => q.id === activeQuizForQuestions.id);
            if (freshQuiz) {
              setActiveQuizForQuestions(freshQuiz);
            }
          }
        } else {
          triggerMessage(data.message, "error");
        }
      } catch {
        triggerMessage("Gagal menghapus pertanyaan.", "error");
      }
    });
  };

  const questionsFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingQuestions, setIsImportingQuestions] = useState(false);

  const handleImportQuestionsAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeQuizForQuestions) return;

    setIsImportingQuestions(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quiz/import-questions", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!result.success) {
        triggerMessage(result.message || "Gagal mengimpor soal dari file.", "error");
        return;
      }

      // Bulk create questions for activeQuizForQuestions
      const saveRes = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-create",
          entity: "question",
          data: {
            quiz_id: activeQuizForQuestions.id,
            questions: result.questions.map((q: any) => ({
              question: q.question,
              options: q.options.map((optText: string, oIdx: number) => ({
                option_text: optText,
                is_correct: oIdx === q.correctIndex
              }))
            }))
          }
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        triggerMessage(`Berhasil mengimpor ${result.count} soal dari file!`, "success");
        // Reload questions list
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const freshData = await response.json();
        if (freshData.success) {
          setQuizzes(freshData.quizzes || []);
          const freshQuiz = (freshData.quizzes || []).find((q: any) => q.id === activeQuizForQuestions.id);
          if (freshQuiz) {
            setActiveQuizForQuestions(freshQuiz);
          }
        }
      } else {
        triggerMessage(saveData.message || "Gagal menyimpan soal ke kuis.", "error");
      }
    } catch (err: any) {
      triggerMessage("Terjadi kesalahan saat memproses file: " + (err?.message || "Error"), "error");
    } finally {
      setIsImportingQuestions(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleExportAttemptsCSV = () => {
    if (filteredQuizAttempts.length === 0) {
      triggerMessage("Tidak ada data hasil kuis untuk diekspor.", "error");
      return;
    }
    const headers = ["No", "Nama Siswa", "Kelas", "Kuis", "Tipe Kuis", "Skor Akhir", "Tanggal Selesai"];
    const rows = filteredQuizAttempts.map((a, idx) => [
      idx + 1,
      `"${(a.studentName || "").replace(/"/g, '""')}"`,
      `"${(a.className || "").replace(/"/g, '""')}"`,
      `"${(a.quizTitle || "").replace(/"/g, '""')}"`,
      `"${(a.quizType || "").toUpperCase()}"`,
      a.score,
      `"${(a.completedAt || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekapitulasi_Hasil_Kuis_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerMessage("Berhasil mengekspor data hasil kuis ke CSV/Excel!", "success");
  };

  const handlePrintAttempts = () => {
    if (filteredQuizAttempts.length === 0) {
      triggerMessage("Tidak ada data hasil kuis untuk dicetak.", "error");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Nilai & Hasil Kuis Siswa</title>
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
              display: flex;
              justify-content: space-between;
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
            <div class="title">DIGIMIND - LAPORAN REKAPITULASI HASIL KUIS SISWA</div>
            <div class="subtitle">Sistem Monitoring Literasi & Evaluasi Akademik Adaptif</div>
          </div>
          <div class="meta">
            <div><strong>Total Data:</strong> ${filteredQuizAttempts.length} Siswa / Pengerjaan</div>
            <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">No</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Kuis / Evaluasi</th>
                <th class="text-center">Tipe</th>
                <th class="text-center">Nilai</th>
                <th>Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody>
              ${filteredQuizAttempts
                .map(
                  (a, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td><strong>${a.studentName || "-"}</strong></td>
                  <td>${a.className || "-"}</td>
                  <td>${a.quizTitle || "-"}</td>
                  <td class="text-center">${(a.quizType || "").toUpperCase()}</td>
                  <td class="text-center ${a.score >= 70 ? "score-pass" : "score-fail"}">${a.score}</td>
                  <td>${a.completedAt || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    let printIframe = document.getElementById("admin-print-frame") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "admin-print-frame";
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

  // Filtered Data Calculations
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.nis && u.nis.toLowerCase().includes(q)) ||
      (u.nip && u.nip.toLowerCase().includes(q));
    
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.nip && t.nip.toLowerCase().includes(q)) ||
      (t.user?.email && t.user.email.toLowerCase().includes(q)) ||
      (t.specialization && t.specialization.toLowerCase().includes(q));
    
    const matchesType = filterTeacherType === "all" || t.type === filterTeacherType;
    const matchesClass = filterClassId === "all" || (t.class_id && t.class_id.toString() === filterClassId);
    return matchesSearch && matchesType && matchesClass;
  });

  const filteredActors = adminActors.filter((actor) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      q === "" ||
      (actor.name && actor.name.toLowerCase().includes(q)) ||
      (actor.username && actor.username.toLowerCase().includes(q)) ||
      (actor.email && actor.email.toLowerCase().includes(q)) ||
      (actor.division && actor.division.toLowerCase().includes(q)) ||
      (actor.unit && actor.unit.toLowerCase().includes(q))
    );
  });

  const filteredClasses = classes.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      q === "" ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.major && c.major.toLowerCase().includes(q))
    );
  });

  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.class?.name && s.class.name.toLowerCase().includes(q)) ||
      (s.teacher?.name && s.teacher.name.toLowerCase().includes(q));
    
    const matchesClass = filterClassId === "all" || (s.class_id && s.class_id.toString() === filterClassId);
    return matchesSearch && matchesClass;
  });

  const filteredModules = modules.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      q === "" ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    );
  });

  const filteredQuizzes = quizzes.filter((qObj) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (qObj.title && qObj.title.toLowerCase().includes(q)) ||
      (qObj.module && qObj.module.toLowerCase().includes(q));
    
    const matchesType = filterQuizType === "all" || qObj.type === filterQuizType;
    return matchesSearch && matchesType;
  });

  const filteredQuizAttempts = quizAttempts.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (a.studentName && a.studentName.toLowerCase().includes(q)) ||
      (a.className && a.className.toLowerCase().includes(q)) ||
      (a.quizTitle && a.quizTitle.toLowerCase().includes(q));
    
    const matchesType = filterQuizType === "all" || a.quizType === filterQuizType;
    const selectedClassName = classes.find((c) => String(c.id) === filterClassId)?.name;
    const matchesClass = filterClassId === "all" || a.className === selectedClassName;
    return matchesSearch && matchesType && matchesClass;
  });

  const filteredScreeningAttempts = screeningAttempts.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (a.studentName && a.studentName.toLowerCase().includes(q)) ||
      (a.className && a.className.toLowerCase().includes(q)) ||
      (a.quizTitle && a.quizTitle.toLowerCase().includes(q));

    const selectedClassName = classes.find((c) => String(c.id) === filterClassId)?.name;
    const matchesClass = filterClassId === "all" || a.className === selectedClassName;
    return matchesSearch && matchesClass;
  });

  const renderSearchFilterBar = () => {
    if (activeTab === "overview") return null;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200/80 mb-4 animate-fadeIn">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "users"
                ? "Cari nama, username, email, NIS, atau NIP..."
                : activeTab === "teachers"
                ? "Cari nama guru, NIP, email, spesialisasi..."
                : activeTab === "actors"
                ? "Cari nama aktor admin, username, divisi..."
                : activeTab === "classes"
                ? "Cari nama kelas atau jurusan..."
                : activeTab === "subjects"
                ? "Cari mata pelajaran, kelas, atau nama guru..."
                : activeTab === "modules"
                ? "Cari judul modul atau mata pelajaran..."
                : activeTab === "quizzes"
                ? "Cari judul kuis atau nama modul..."
                : "Cari nama siswa, kelas, atau judul kuis..."
            }
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-8 py-2 text-xs font-semibold text-zinc-800 focus:border-[#5A77DF] focus:ring-2 focus:ring-[#5A77DF]/20 transition-all outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab-Specific Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* User Role Filter */}
          {activeTab === "users" && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-hidden"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Admin</option>
              <option value="teacher">Guru</option>
              <option value="student">Siswa</option>
            </select>
          )}

          {/* Teacher Type Filter */}
          {activeTab === "teachers" && (
            <select
              value={filterTeacherType}
              onChange={(e) => setFilterTeacherType(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-hidden"
            >
              <option value="all">Semua Tipe Guru</option>
              <option value="subject">Guru Mapel</option>
              <option value="bk">Guru BK</option>
              <option value="wali_kelas">Wali Kelas</option>
            </select>
          )}

          {/* Class Filter */}
          {(activeTab === "subjects" || activeTab === "attempts") && (
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-hidden"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({c.major})
                </option>
              ))}
            </select>
          )}

          {/* Quiz Type Filter */}
          {activeTab === "quizzes" && (
            <select
              value={filterQuizType}
              onChange={(e) => setFilterQuizType(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-hidden"
            >
              <option value="all">Semua Tipe Kuis</option>
              <option value="pretest">Pretest</option>
              <option value="posttest">Posttest</option>
            </select>
          )}

          {/* Reset Filters Button */}
          {(searchQuery !== "" || filterRole !== "all" || filterTeacherType !== "all" || filterClassId !== "all" || filterQuizType !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterRole("all");
                setFilterTeacherType("all");
                setFilterClassId("all");
                setFilterQuizType("all");
              }}
              className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 text-2xs font-extrabold text-red-600 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 w-full font-sans">
      
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-[#5A77DF]/5 blur-[140px]" />
        <div className="absolute top-1/3 right-10 h-[350px] w-[350px] rounded-full bg-purple-900/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      {/* Floating Toast Message */}
      {message && (
        <div
          className={`fixed top-6 right-6 z-[9999] p-4 rounded-xl text-xs font-bold shadow-xl animate-fadeIn flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-zinc-700" />
            </button>
            <img src="/logo.png" alt="DigiMind" className="h-9 sm:h-12 w-auto max-w-[130px] sm:max-w-none object-contain" />
            {/* <div className="hidden sm:block">
              <p className="text-3xs font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.35em] text-[#5A77DF]">
                Portal Admin
              </p>
              <h1 className="text-xs sm:text-sm font-black text-[#2e384d] tracking-tight">
                Panel Manajemen & Kontrol Utama
              </h1>
            </div> */}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Admin Profile Card - Clickable to open Change Password Modal */}
            <button
              type="button"
              onClick={() => setShowAdminPassModal(true)}
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition cursor-pointer group"
              title="Klik untuk Ganti Password Admin"
            >
              <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full p-[2px] bg-gradient-to-tr from-[#5A77DF] via-[#7B93EC] to-purple-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-[#5A77DF] to-[#3E53A2] text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-inner">
                  A
                </div>
              </div>
              <div className="hidden md:block">
                <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-[#5A77DF] transition-colors">
                  Admin DigiMind
                </h4>
                <p className="text-3xs sm:text-xs font-semibold text-zinc-400 leading-tight">
                  Administrator
                </p>
              </div>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={loadData}
                className="relative p-2 sm:p-2.5 rounded-full text-zinc-900 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center"
                title="Refresh Data & Notifikasi"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900 fill-zinc-900" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-rose-500 border-2 border-white shadow-xs" />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200/45 px-2.5 sm:px-3.5 py-2 text-3xs sm:text-2xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden animate-fadeIn">
          <div className="w-4/5 max-w-xs h-full bg-[#5A77DF] p-5 text-white flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="DigiMind" className="h-8 w-auto bg-white rounded-lg p-1" />
                  <span className="text-xs font-black uppercase tracking-wider">Navigasi Admin</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1">
                {[
                  { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                  { id: "users", label: "Manajemen Akun", icon: <Users className="w-4 h-4" /> },
                  { id: "teachers", label: "Pengampuan Guru", icon: <GraduationCap className="w-4 h-4" /> },
                  { id: "actors", label: "Aktor Admin & Izin", icon: <ShieldCheck className="w-4 h-4" /> },
                  { id: "classes", label: "Data Kelas", icon: <School className="w-4 h-4" /> },
                  { id: "subjects", label: "Mata Pelajaran", icon: <BookOpen className="w-4 h-4" /> },
                  { id: "modules", label: "Modul Pembelajaran", icon: <FileCode className="w-4 h-4" /> },
                  { id: "quizzes", label: "Kuis & Soal", icon: <HelpCircle className="w-4 h-4" /> },
                  { id: "pretest_screening", label: "Pretest Screening Mental", icon: <Brain className="w-4 h-4" /> },
                  { id: "attempts", label: "Hasil Kuis Siswa", icon: <Target className="w-4 h-4" /> },
                  { id: "screening", label: "Hasil Screening SRQ-29", icon: <FileText className="w-4 h-4" /> },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as DashboardTab);
                        setIsMobileMenuOpen(false);
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
              </nav>
            </div>

            <div className="pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 py-2.5 text-xs font-bold text-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* MAIN CONTAINER matching Teacher & Student dashboards */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6 items-start pb-24 lg:pb-8">
        
        {/* DESKTOP SIDEBAR NAVIGATION (Visible on lg screens) */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 self-start z-30">
          <div className="rounded-2xl border border-[#5A77DF] bg-[#5A77DF] p-4 shadow-lg text-white space-y-4">
            <div className="px-3 py-2 border-b border-white/20">
              <p className="text-3xs uppercase tracking-widest text-white/70 font-extrabold font-mono">Navigasi Admin</p>
            </div>

            <nav className="space-y-1">
              {[
                { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: "users", label: "Manajemen Akun", icon: <Users className="w-4 h-4" /> },
                { id: "teachers", label: "Pengampuan Guru", icon: <GraduationCap className="w-4 h-4" /> },
                { id: "actors", label: "Aktor Admin & Izin", icon: <ShieldCheck className="w-4 h-4" /> },
                { id: "classes", label: "Data Kelas", icon: <School className="w-4 h-4" /> },
                { id: "subjects", label: "Mata Pelajaran", icon: <BookOpen className="w-4 h-4" /> },
                { id: "modules", label: "Modul Pembelajaran", icon: <FileCode className="w-4 h-4" /> },
                { id: "quizzes", label: "Kuis & Soal", icon: <HelpCircle className="w-4 h-4" /> },
                { id: "pretest_screening", label: "Pretest Screening Mental", icon: <Brain className="w-4 h-4" /> },
                { id: "attempts", label: "Hasil Kuis Siswa", icon: <Target className="w-4 h-4" /> },
                { id: "screening", label: "Hasil Screening SRQ-29", icon: <FileText className="w-4 h-4" /> },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as DashboardTab)}
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
            </nav>
          </div>
        </aside>

        {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for mobile screens) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-2xl px-2 py-2 flex items-center overflow-x-auto gap-2">
          {[
            { id: "overview", label: "Ringkasan", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "users", label: "Akun", icon: <Users className="w-4 h-4" /> },
            { id: "teachers", label: "Guru", icon: <GraduationCap className="w-4 h-4" /> },
            { id: "actors", label: "Aktor Admin", icon: <ShieldCheck className="w-4 h-4" /> },
            { id: "classes", label: "Kelas", icon: <School className="w-4 h-4" /> },
            { id: "subjects", label: "Mapel", icon: <BookOpen className="w-4 h-4" /> },
            { id: "modules", label: "Modul", icon: <FileCode className="w-4 h-4" /> },
            { id: "quizzes", label: "Kuis", icon: <HelpCircle className="w-4 h-4" /> },
            { id: "pretest_screening", label: "Pretest SRQ", icon: <Brain className="w-4 h-4" /> },
            { id: "attempts", label: "Hasil Kuis", icon: <Target className="w-4 h-4" /> },
            { id: "screening", label: "Hasil SRQ-29", icon: <FileText className="w-4 h-4" /> },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as DashboardTab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#5A77DF] text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div className="flex-1 min-w-0 w-full space-y-6">

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-2xs text-[#7c8ba1] font-medium">Memuat data administrator...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW VIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Metrics row */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                      {[
                        { label: "Total Modul", value: summary.modules, icon: <BookOpen className="w-4 h-4 text-[#5A77DF]" />, color: "text-[#5A77DF]" },
                        { label: "Total Kuis", value: summary.quizzes, icon: <FileText className="w-4 h-4 text-cyan-500" />, color: "text-cyan-500" },
                        { label: "Total Akun", value: summary.users, icon: <Users className="w-4 h-4 text-emerald-500" />, color: "text-emerald-500" },
                        { label: "Jurnal Terisi", value: summary.journals, icon: <Brain className="w-4 h-4 text-amber-500" />, color: "text-amber-500" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-3xs uppercase tracking-wider text-[#7c8ba1] font-bold">{item.label}</span>
                            {item.icon}
                          </div>
                          <p className={`mt-2 text-2xl font-extrabold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#2e384d]">Ringkasan Status Sistem</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-xl bg-[#5A77DF]/10 border border-[#5A77DF]/20 space-y-2">
                          <h4 className="font-bold text-[#3E53A2] uppercase tracking-wide text-3xs">Hak Akses Modul & Kuis</h4>
                          <p className="text-2xs text-[#5A77DF] leading-normal">
                            Semua fitur administrasi kurikulum, mata pelajaran, modul, dan kuis dibuka penuh.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
                          <h4 className="font-bold text-emerald-700 uppercase tracking-wide text-3xs">Manajemen Relasi Akademik</h4>
                          <p className="text-2xs text-emerald-600 leading-normal">
                            Pastikan data Kelas diinputkan terlebih dahulu sebelum mendaftarkan Siswa baru atau mengaitkan Mata Pelajaran baru, agar data foreign-key tersinkronisasi dengan baik.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. USERS MANAGEMENT VIEW */}
                {activeTab === "users" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Pengguna</h3>
                        <p className="text-3xs text-zinc-400">Daftar lengkap akun administrator, guru mapel, guru BK, dan siswa aktif.</p>
                      </div>
                      <button
                        onClick={handleOpenUserCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-extrabold text-white transition-all cursor-pointer shadow-sm shadow-[#5A77DF]/10 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pengguna</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Peran / Role</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{u.name}</td>
                              <td className="px-4 py-3.5 text-zinc-600">@{u.username}</td>
                              <td className="px-4 py-3.5 text-zinc-500">{u.email}</td>
                              <td className="px-4 py-3.5">
                                <span className={`rounded-full px-2.5 py-1 text-3xs font-extrabold uppercase ${
                                  u.role === "admin"
                                    ? "bg-[#5A77DF]/10 text-[#3E53A2]"
                                    : u.role === "teacher"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-cyan-100 text-cyan-700"
                                }`}>
                                  {u.role === "teacher" && u.teacher_type === "bk" ? "Guru BK" : u.role}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenUserEdit(u)}
                                  title="Edit Pengguna"
                                  className="p-2 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#3E53A2] transition cursor-pointer shadow-2xs"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUserDelete(u.id)}
                                  title="Hapus Pengguna"
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2.7 ACTORS & HAK AKSES VIEW */}
                {activeTab === "actors" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Aktor Admin & Hak Akses (RBAC)</h3>
                        <p className="text-3xs text-zinc-400">Atur akun administrator sekolah, pembagian divisi/unit, serta penentuan batas hak akses per modul secara terperinci.</p>
                      </div>
                      <button
                        onClick={handleOpenActorCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-extrabold text-white transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Aktor Admin</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Nama Aktor Admin</th>
                            <th className="px-4 py-3">Username / Email</th>
                            <th className="px-4 py-3">Divisi & Unit</th>
                            <th className="px-4 py-3">Hak Akses Modul Sistem</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredActors.map((actor) => {
                            const permsList = Array.isArray(actor.permissions) ? actor.permissions : [];
                            return (
                              <tr key={actor.id} className="hover:bg-zinc-50 transition-all">
                                <td className="px-4 py-3.5 font-extrabold text-zinc-800">
                                  {actor.name}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600">
                                  <div className="font-mono text-2xs text-zinc-800 font-bold">{actor.username}</div>
                                  <div className="text-3xs text-zinc-400">{actor.email}</div>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600">
                                  <div className="font-semibold text-2xs">{actor.division || "Administrasi"}</div>
                                  <div className="text-3xs text-zinc-400">{actor.unit || "Utama"}</div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex flex-wrap gap-1 max-w-sm">
                                    {permsList.includes("manage_users") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-3xs font-extrabold text-blue-700 border border-blue-200">
                                        <Users className="w-3 h-3" /> Akun
                                      </span>
                                    )}
                                    {permsList.includes("manage_teachers") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-extrabold text-indigo-700 border border-indigo-200">
                                        <GraduationCap className="w-3 h-3" /> Guru
                                      </span>
                                    )}
                                    {permsList.includes("manage_roles") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-3xs font-extrabold text-purple-700 border border-purple-200">
                                        <Key className="w-3 h-3" /> Hak Akses
                                      </span>
                                    )}
                                    {permsList.includes("manage_classes") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-[#5A77DF]/10 px-2 py-0.5 text-3xs font-extrabold text-[#3E53A2] border border-[#5A77DF]/30">
                                        <School className="w-3 h-3" /> Kelas
                                      </span>
                                    )}
                                    {permsList.includes("manage_subjects") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-3xs font-extrabold text-cyan-700 border border-cyan-200">
                                        <BookOpen className="w-3 h-3" /> Mapel
                                      </span>
                                    )}
                                    {permsList.includes("manage_modules") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-3xs font-extrabold text-emerald-700 border border-emerald-200">
                                        <FileCode className="w-3 h-3" /> Modul
                                      </span>
                                    )}
                                    {permsList.includes("manage_quizzes") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-3xs font-extrabold text-amber-700 border border-amber-200">
                                        <HelpCircle className="w-3 h-3" /> Kuis
                                      </span>
                                    )}
                                    {permsList.includes("manage_pretest_screening") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-3xs font-extrabold text-violet-700 border border-violet-200">
                                        <Brain className="w-3 h-3" /> Pretest SRQ
                                      </span>
                                    )}
                                    {permsList.includes("manage_attempts") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-3xs font-extrabold text-teal-700 border border-teal-200">
                                        <Target className="w-3 h-3" /> Hasil Kuis
                                      </span>
                                    )}
                                    {permsList.includes("manage_screening") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-3xs font-extrabold text-rose-700 border border-rose-200">
                                        <FileText className="w-3 h-3" /> Hasil SRQ-29
                                      </span>
                                    )}
                                    {permsList.includes("manage_academics") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-3xs font-extrabold text-slate-700 border border-slate-300">
                                        Akademik
                                      </span>
                                    )}
                                    {permsList.includes("manage_reports") && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-3xs font-extrabold text-slate-700 border border-slate-300">
                                        Laporan
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenActorEdit(actor)}
                                    title="Edit Akses"
                                    className="p-2 rounded-xl border border-[#5A77DF]/20 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#3E53A2] transition cursor-pointer shadow-2xs"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleActorDelete(actor.id)}
                                    title="Hapus Aktor"
                                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer shadow-2xs"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2.5 TEACHERS VIEW */}
                {activeTab === "teachers" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Guru & Pengampuan Mengajar</h3>
                        <p className="text-3xs text-zinc-400">Atur profil guru, kategori jabatan (Wali Kelas / BK / Mapel), serta alokasi pengampuan ke banyak mata pelajaran dan banyak kelas sekaligus.</p>
                      </div>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Guru & NIP</th>
                            <th className="px-4 py-3">Kontak / Email</th>
                            <th className="px-4 py-3">Kategori Jabatan</th>
                            <th className="px-4 py-3">Kelas Binaan</th>
                            <th className="px-4 py-3">Pengampuan Mapel & Kelas</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredTeachers.map((t) => {
                            const isBk = t.type === "bk";
                            const isWali = t.type === "wali_kelas";
                            const assignedSubjects = t.subjects || [];

                            return (
                              <tr key={t.id} className="hover:bg-zinc-50 transition-all">
                                <td className="px-4 py-3.5">
                                  <div className="font-extrabold text-zinc-800">{t.name}</div>
                                  <div className="text-3xs font-mono text-zinc-400 mt-0.5">NIP: {t.nip || "-"}</div>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600">
                                  <div className="text-2xs font-semibold">{t.user?.email || "-"}</div>
                                  <div className="text-3xs text-zinc-400">{t.phone_number || "-"}</div>
                                </td>
                                <td className="px-4 py-3.5">
                                   {isBk ? (
                                     <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-3xs font-extrabold text-purple-700 border border-purple-200">
                                       <GraduationCap className="w-3 h-3 text-purple-700" />
                                       <span>Guru BK</span>
                                     </span>
                                   ) : isWali ? (
                                     <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-3xs font-extrabold text-cyan-700 border border-cyan-200">
                                       <School className="w-3 h-3 text-cyan-700" />
                                       <span>Wali Kelas</span>
                                     </span>
                                   ) : (
                                     <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-3xs font-extrabold text-blue-700 border border-blue-200">
                                       <BookOpen className="w-3 h-3 text-blue-700" />
                                       <span>Guru Mapel</span>
                                     </span>
                                   )}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-600 font-medium">
                                  {t.class?.name ? (
                                    <span className="rounded-lg bg-zinc-100 px-2 py-1 text-3xs font-bold text-zinc-700 border border-zinc-200">
                                      {t.class.name}
                                    </span>
                                  ) : (
                                    <span className="text-3xs text-zinc-400 italic">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  {assignedSubjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                      {assignedSubjects.map((sub: any) => (
                                        <span key={sub.id} className="rounded-md bg-[#5A77DF]/10 px-2 py-0.5 text-3xs font-extrabold text-[#3E53A2] border border-[#5A77DF]/20">
                                          {sub.name} ({sub.class?.name || "-"})
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-3xs text-zinc-400 italic">Belum ada mapel diampu</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <button
                                    onClick={() => handleOpenTeacherEdit(t)}
                                    title="Kelola Pengampuan Guru"
                                    className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#3E53A2] p-2 transition cursor-pointer shadow-xs inline-flex items-center justify-center"
                                  >
                                    <Settings className="w-4 h-4 text-[#5A77DF]" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. CLASSES VIEW */}
                {activeTab === "classes" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Kelas</h3>
                        <p className="text-3xs text-zinc-400">Kelola daftar kelas aktif sekolah.</p>
                      </div>
                      <button
                        onClick={handleOpenClassCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-bold text-white transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Kelas</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">ID Kelas</th>
                            <th className="px-4 py-3">Nama Kelas</th>
                            <th className="px-4 py-3">Jurusan / Major</th>
                            <th className="px-4 py-3">Tahun Ajaran</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredClasses.map((cls) => (
                            <tr key={cls.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-500">#{cls.id}</td>
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{cls.name}</td>
                              <td className="px-4 py-3.5 text-zinc-600">{cls.major || "Umum"}</td>
                              <td className="px-4 py-3.5 text-zinc-600 font-semibold">{cls.academic_year || cls.year || "2025/2026"}</td>
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenClassEdit(cls)}
                                  title="Edit Kelas"
                                  className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Edit3 className="w-4 h-4 text-amber-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClassDelete(cls.id)}
                                  title="Hapus Kelas"
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. SUBJECTS VIEW */}
                {activeTab === "subjects" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Mata Pelajaran</h3>
                        <p className="text-3xs text-zinc-400">Atur program mata pelajaran dan tautkan guru pengampu beserta kelasnya.</p>
                      </div>
                      <button
                        onClick={handleOpenSubjectCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-bold text-white transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Mata Pelajaran</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Mata Pelajaran</th>
                            <th className="px-4 py-3">Kelas Terkait</th>
                            <th className="px-4 py-3">Guru Pengampu</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredSubjects.map((sub) => (
                            <tr key={sub.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{sub.name}</td>
                              <td className="px-4 py-3.5 text-zinc-600">{sub.class?.name || `ID ${sub.class_id}`}</td>
                              <td className="px-4 py-3.5 text-zinc-500 font-medium">
                                {sub.teacher ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{sub.teacher.name}</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 italic">Belum ada pengampu</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubjectEdit(sub)}
                                  title="Edit Mata Pelajaran"
                                  className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Edit3 className="w-4 h-4 text-amber-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSubjectDelete(sub.id)}
                                  title="Hapus Mata Pelajaran"
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. MODULES VIEW */}
                {activeTab === "modules" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Modul Belajar</h3>
                        <p className="text-3xs text-zinc-400">Atur modul literasi digital, kesehatan mental, atau modul mapel spesifik.</p>
                      </div>
                      <button
                        onClick={handleOpenModuleCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-bold text-white transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Modul</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Judul Modul</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3">Tingkat Literasi</th>
                            <th className="px-4 py-3">Mata Pelajaran</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredModules.map((mod) => (
                            <tr key={mod.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{mod.title}</td>
                              <td className="px-4 py-3.5 text-zinc-600">{mod.category}</td>
                              <td className="px-4 py-3.5 text-zinc-500 uppercase">{mod.level}</td>
                              <td className="px-4 py-3.5 text-zinc-500 font-semibold">{mod.subject || "-"}</td>
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenModuleEdit(mod)}
                                  title="Edit Modul"
                                  className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Edit3 className="w-4 h-4 text-amber-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModuleDelete(mod.id)}
                                  title="Hapus Modul"
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. QUIZZES VIEW */}
                {activeTab === "quizzes" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Manajemen Kuis</h3>
                        <p className="text-3xs text-zinc-400">Atur kuis pretest adaptif serta kuis posttest untuk setiap modul aktif.</p>
                      </div>
                      <button
                        onClick={handleOpenQuizCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-bold text-white transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Kuis</span>
                      </button>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Nama Kuis</th>
                            <th className="px-4 py-3">Tipe Kuis</th>
                            <th className="px-4 py-3">Modul Terkait</th>
                            <th className="px-4 py-3">Total Soal</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredQuizzes.map((q) => (
                            <tr key={q.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{q.title}</td>
                              <td className="px-4 py-3.5 text-zinc-500 font-bold uppercase">{q.type}</td>
                              <td className="px-4 py-3.5 text-zinc-600">{q.module || "-"}</td>
                              <td className="px-4 py-3.5 text-[#5A77DF] font-bold">
                                {q.questions?.length || 0} Pertanyaan
                              </td>
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuestionsList(q)}
                                  title="Kelola Pertanyaan & Soal Kuis"
                                  className="p-2 rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 text-[#5A77DF] transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <HelpCircle className="w-4 h-4 text-[#5A77DF]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuizEdit(q)}
                                  title="Edit Kuis"
                                  className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Edit3 className="w-4 h-4 text-amber-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuizDelete(q.id)}
                                  title="Hapus Kuis"
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6.5 PRETEST SCREENING MENTAL HEALTH (SRQ-29) VIEW */}
                {activeTab === "pretest_screening" && (() => {
                  const srqQuiz = quizzes.find((q) => q.type === "pretest" && (!q.module_id || q.title?.toLowerCase().includes("srq") || q.title?.toLowerCase().includes("screening")));
                  const questionsList = srqQuiz?.questions || [];
                  const filteredQuestions = searchQuery
                    ? questionsList.filter((q: any) => q.question?.toLowerCase().includes(searchQuery.toLowerCase()))
                    : questionsList;

                  return (
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-[#5A77DF]" />
                            <h3 className="text-base font-extrabold text-zinc-800">
                              Pretest Screening Mental Health (SRQ-29)
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-700 border border-emerald-200">
                              Aktif (Mandatori Siswa)
                            </span>
                          </div>
                          <p className="text-2xs text-zinc-500">
                            Kuis kuesioner kesehatan mental (SRQ-29) yang wajib diisi oleh setiap siswa baru untuk evaluasi awal.
                          </p>
                        </div>
                        {srqQuiz && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQuizForQuestions(srqQuiz);
                                handleOpenQuestionCreate();
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-2xs font-bold text-white transition cursor-pointer shadow-sm shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambah Soal SRQ</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* STATS HIGHLIGHT */}
                      {srqQuiz ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#f5f7fc] border border-[#5A77DF]/15">
                          <div>
                            <p className="text-3xs uppercase font-extrabold tracking-wider text-zinc-400">Judul Kuis</p>
                            <p className="text-xs font-extrabold text-zinc-800 truncate">{srqQuiz.title}</p>
                          </div>
                          <div>
                            <p className="text-3xs uppercase font-extrabold tracking-wider text-zinc-400">Total Soal</p>
                            <p className="text-xs font-extrabold text-[#5A77DF]">{questionsList.length} Pertanyaan</p>
                          </div>
                          <div>
                            <p className="text-3xs uppercase font-extrabold tracking-wider text-zinc-400">Tipe & Status</p>
                            <p className="text-xs font-extrabold text-emerald-600">Pretest Initial (Aktif)</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <span>Kuis Screening Pretest SRQ-29 belum ditemukan di database.</span>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/auth/seed");
                                const d = await res.json();
                                triggerMessage(d.message || "Berhasil mereset kuis SRQ-29!", "success");
                                window.location.reload();
                              } catch {
                                triggerMessage("Gagal mereset kuis SRQ-29.", "error");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-2xs hover:bg-amber-700 transition cursor-pointer"
                          >
                            Generate / Reset SRQ-29
                          </button>
                        </div>
                      )}

                      {renderSearchFilterBar()}

                      {/* QUESTIONS TABLE */}
                      <div className="overflow-x-auto rounded-xl border border-zinc-150">
                        <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                          <thead className="bg-[#f5f7fc]">
                            <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="px-4 py-3 w-12 text-center">No</th>
                              <th className="px-4 py-3">Pertanyaan Screening</th>
                              <th className="px-4 py-3">Opsi Jawaban</th>
                              <th className="px-4 py-3 text-right w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 bg-white">
                            {filteredQuestions.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-xs text-zinc-400 italic">
                                  Belum ada pertanyaan screening ditemukan.
                                </td>
                              </tr>
                            ) : (
                              filteredQuestions.map((q: any, idx: number) => (
                                <tr key={q.id || idx} className="hover:bg-zinc-50">
                                  <td className="px-4 py-3.5 text-center font-bold text-zinc-400">{idx + 1}</td>
                                  <td className="px-4 py-3.5 font-bold text-zinc-800">{q.question}</td>
                                  <td className="px-4 py-3.5 text-zinc-600">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {q.options?.map((opt: any) => (
                                        <span
                                          key={opt.id}
                                          className={`px-2 py-0.5 rounded-md text-3xs font-extrabold ${
                                            opt.is_correct
                                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                                          }`}
                                        >
                                          {opt.option_text}
                                        </span>
                                      )) || <span className="text-zinc-400 italic">Y (YA) / T (TIDAK)</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveQuizForQuestions(srqQuiz);
                                        handleOpenQuestionEdit(q);
                                      }}
                                      title="Edit Soal"
                                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                    >
                                      <Edit3 className="w-4 h-4 text-amber-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveQuizForQuestions(srqQuiz);
                                        handleQuestionDelete(q.id);
                                      }}
                                      title="Hapus Soal"
                                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-600" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* 7. ATTEMPTS VIEW */}
                {activeTab === "attempts" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-800">Riwayat Jawaban & Hasil Kuis</h3>
                        <p className="text-3xs text-zinc-400">Pantau jawaban detail yang disubmit oleh masing-masing siswa.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportAttemptsCSV}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-2xs font-extrabold text-emerald-800 transition cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Export Excel/CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintAttempts}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-2xs font-extrabold text-zinc-700 transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Cetak Nilai</span>
                        </button>
                      </div>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Nama Siswa</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Kuis</th>
                            <th className="px-4 py-3">Tipe</th>
                            <th className="px-4 py-3">Skor Akhir</th>
                            <th className="px-4 py-3">Tanggal Selesai</th>
                            <th className="px-4 py-3 text-right">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredQuizAttempts.map((attempt) => (
                            <tr key={attempt.id} className="hover:bg-zinc-50">
                              <td className="px-4 py-3.5 font-bold text-zinc-800">{attempt.studentName}</td>
                              <td className="px-4 py-3.5 text-zinc-500 font-semibold">{attempt.className}</td>
                              <td className="px-4 py-3.5 text-zinc-700 font-medium">{attempt.quizTitle}</td>
                              <td className="px-4 py-3.5 text-zinc-500 font-bold uppercase">{attempt.quizType}</td>
                              <td className="px-4 py-3.5 text-[#5A77DF] font-extrabold text-sm">{attempt.score}/100</td>
                              <td className="px-4 py-3.5 text-zinc-500">{attempt.completedAt}</td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAttempt(attempt);
                                    setShowAttemptDetailModal(true);
                                  }}
                                  title="Lihat Detail Jawaban"
                                  className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 p-2 text-[#5A77DF] transition cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                >
                                  <Eye className="w-4 h-4 text-[#5A77DF]" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9. SCREENING SRQ-29 VIEW */}
                {activeTab === "screening" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="border-b border-zinc-100 pb-3">
                      <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-[#5A77DF]" />
                        <span>Riwayat Jawaban Screening SRQ-29 Siswa (Bulanan)</span>
                      </h3>
                      <p className="text-3xs text-zinc-400">
                        Pantau detail jawaban screening kesehatan mental SRQ-29 yang diisi oleh siswa tiap bulan.
                      </p>
                    </div>

                    {renderSearchFilterBar()}

                    <div className="overflow-x-auto rounded-xl border border-zinc-150">
                      <table className="min-w-full text-left text-xs divide-y divide-zinc-150 whitespace-nowrap">
                        <thead className="bg-[#f5f7fc]">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-3">Nama Siswa</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Screening</th>
                            <th className="px-4 py-3">Skor SRQ-29</th>
                            <th className="px-4 py-3">Tanggal Selesai</th>
                            <th className="px-4 py-3 text-right">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredScreeningAttempts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-400 italic">
                                Belum ada riwayat jawaban screening SRQ-29.
                              </td>
                            </tr>
                          ) : (
                            filteredScreeningAttempts.map((attempt) => (
                              <tr key={attempt.id} className="hover:bg-zinc-50">
                                <td className="px-4 py-3.5 font-bold text-zinc-800">{attempt.studentName}</td>
                                <td className="px-4 py-3.5 text-zinc-500 font-semibold">{attempt.className}</td>
                                <td className="px-4 py-3.5 text-zinc-700 font-medium">{attempt.quizTitle}</td>
                                <td className="px-4 py-3.5 text-[#5A77DF] font-extrabold text-sm">{attempt.score}/29</td>
                                <td className="px-4 py-3.5 text-zinc-500">{attempt.completedAt}</td>
                                <td className="px-4 py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAttempt(attempt);
                                      setShowAttemptDetailModal(true);
                                    }}
                                    title="Lihat Detail Jawaban Screening"
                                    className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 p-2 text-[#5A77DF] transition cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                  >
                                    <Eye className="w-4 h-4 text-[#5A77DF]" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

      {/* ========================================================
      MODAL POPUPS FOR CRUD ACTIONS
      ======================================================== */}

      {/* 1. USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedUser ? "Edit Akun Pengguna" : "Daftarkan Pengguna Baru"}
            </h3>
            <form onSubmit={handleUserSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Username</label>
                  <input
                    type="text"
                    required
                    value={uUsername}
                    onChange={(e) => setUUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                    placeholder="Contoh: budi12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Email</label>
                  <input
                    type="email"
                    required
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                    placeholder="budil@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Password</label>
                  <div className="relative">
                    <input
                      type={showUPassword ? "text" : "password"}
                      required={!selectedUser}
                      value={uPassword}
                      onChange={(e) => setUPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 pr-9 text-xs"
                      placeholder={selectedUser ? "Kosongkan jika tidak diubah" : "Password akun"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUPassword(!showUPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                    >
                      {showUPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Peran / Role</label>
                  <select
                    value={uRole}
                    onChange={(e) => setURole(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  >
                    <option value="student">Siswa</option>
                    <option value="teacher">Guru</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  placeholder="Nama Lengkap"
                />
              </div>

              {/* Conditional Student fields */}
              {uRole === "student" && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase text-zinc-500">NIS (Nomor Induk Siswa) *</label>
                    <input
                      type="text"
                      required
                      value={uNis}
                      onChange={(e) => setUNis(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                      placeholder="Masukkan NIS"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase text-zinc-500">Pilih Kelas *</label>
                    <select
                      value={uClassId}
                      onChange={(e) => setUClassId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none cursor-pointer font-medium"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.major || "Umum"}) • TA {cls.academic_year || cls.year || "2025/2026"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional Teacher fields */}
              {uRole === "teacher" && (
                <div className="space-y-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold uppercase text-zinc-500">NIP / NUPTK *</label>
                      <input
                        type="text"
                        required
                        value={uNip}
                        onChange={(e) => setUNip(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                        placeholder="Nomor Induk Pegawai"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold uppercase text-zinc-500">No. Telp / WhatsApp</label>
                      <input
                        type="text"
                        value={uPhoneNumber}
                        onChange={(e) => setUPhoneNumber(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold uppercase text-zinc-500">Jabatan / Jenis Guru *</label>
                      <select
                        value={uTeacherType}
                        onChange={(e) => {
                          setUTeacherType(e.target.value);
                          if (e.target.value !== "subject") setUSubjectId("");
                        }}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none cursor-pointer font-medium"
                      >
                        <option value="subject">Guru Mata Pelajaran</option>
                        <option value="wali_kelas">Wali Kelas</option>
                        <option value="bk">Guru Bimbingan Konseling (BK)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold uppercase text-zinc-500">
                        {uTeacherType === "wali_kelas" ? "Kelas yang Diampu *" : uTeacherType === "bk" ? "Kelas Binaan Utama" : "Kelas Awal *"}
                      </label>
                      <select
                        value={uClassId}
                        onChange={(e) => setUClassId(e.target.value)}
                        required={uTeacherType === "wali_kelas" || uTeacherType === "subject"}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none cursor-pointer font-medium"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.major || "Umum"}) • TA {cls.academic_year || cls.year || "2025/2026"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {uTeacherType === "subject" && (
                      <div className="space-y-1">
                        <label className="text-2xs font-bold uppercase text-zinc-500">Mata Pelajaran Awal</label>
                        <select
                          value={uSubjectId}
                          onChange={(e) => setUSubjectId(e.target.value)}
                          disabled={!uClassId}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none cursor-pointer disabled:opacity-50 font-medium"
                        >
                          <option value="">-- Pilih Mata Pelajaran --</option>
                          {subjects
                            .filter((sub) => !uClassId || sub.class_id?.toString() === uClassId)
                            .map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} {sub.teacher_id ? "(Ada Guru)" : "(Tersedia)"}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    {/* <div className={uTeacherType === "subject" ? "space-y-1" : "col-span-2 space-y-1"}>
                      <label className="text-2xs font-bold uppercase text-zinc-500">Keterangan Jabatan (Opsional)</label>
                      <input
                        type="text"
                        value={uPosition}
                        onChange={(e) => setUPosition(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                        placeholder="Contoh: Wali Kelas 9B / Guru BK"
                      />
                    </div> */}
                  </div>
                </div>
              )}

              {/* Conditional Admin fields */}
              {uRole === "admin" && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase text-zinc-500">Divisi / Sub-bagian</label>
                    <input
                      type="text"
                      value={uDivision}
                      onChange={(e) => setUDivision(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                      placeholder="Contoh: IT & Admin Sistem"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase text-zinc-500">Unit Kerja</label>
                    <input
                      type="text"
                      value={uUnit}
                      onChange={(e) => setUUnit(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:border-[#5A77DF] outline-none font-medium"
                      placeholder="Contoh: Pengelola Platform"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{selectedUser ? "Simpan Perubahan" : "Daftarkan Akun"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-5 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setShowClassModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedClass ? "Edit Kelas" : "Tambah Kelas Baru"}
            </h3>
            <form onSubmit={handleClassSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  placeholder="Contoh: Kelas 9A"
                />
              </div>
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Jurusan / Major</label>
                <input
                  type="text"
                  required
                  value={cMajor}
                  onChange={(e) => setCMajor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  placeholder="Contoh: IPA / Umum"
                />
              </div>
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Tahun Ajaran (Academic Year)</label>
                <input
                  type="text"
                  required
                  value={cAcademicYear}
                  onChange={(e) => setCAcademicYear(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  placeholder="Contoh: 2025/2026"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSubjectModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
            </h3>
            <form onSubmit={handleSubjectSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  placeholder="Contoh: Fisika"
                />
              </div>
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Pilih Kelas</label>
                <select
                  value={sClassId}
                  onChange={(e) => setSClassId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.major || "Umum"}) • TA {cls.academic_year || cls.year || "2025/2026"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Guru Pengampu (Pilihan)</label>
                <select
                  value={sTeacherId}
                  onChange={(e) => setSTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                >
                  <option value="">-- Tanpa Guru Pengampu --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Mata Pelajaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModuleModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedModule ? "Edit Modul Pembelajaran" : "Tambah Modul Pembelajaran Baru"}
            </h3>
            <form onSubmit={handleModuleSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Judul Modul</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  placeholder="Judul modul"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Kategori Modul</label>
                  <select
                    value={mCategoryId}
                    onChange={(e) => setMCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Tingkat Literasi</label>
                  <select
                    value={mLevelId}
                    onChange={(e) => setMLevelId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  >
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Tautkan Mata Pelajaran (Khusus modul mapel)</label>
                  <select
                    value={mSubjectId}
                    onChange={(e) => setMSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                  >
                    <option value="">-- Bukan Modul Pelajaran Umum --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.class?.name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">URL Link Video Pendukung (Pilihan)</label>
                  <input
                    type="text"
                    value={mVideoUrl}
                    onChange={(e) => setMVideoUrl(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                    placeholder="Video youtube URL"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Isi Konten Modul</label>
                <textarea
                  rows={6}
                  required
                  value={mContent}
                  onChange={(e) => setMContent(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs resize-none"
                  placeholder="Tuliskan materi pembelajaran modul..."
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Modul</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. QUIZ MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setShowQuizModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedQuiz ? "Edit Kuis" : "Tambah Kuis Baru"}
            </h3>
            <form onSubmit={handleQuizSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Nama Kuis</label>
                <input
                  type="text"
                  required
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  placeholder="Judul Kuis"
                />
              </div>
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Tipe Kuis</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                >
                  <option value="posttest">Posttest (Kuis Modul)</option>
                  <option value="pretest">Pretest (Kuis Awal)</option>
                </select>
              </div>

              {qType === "posttest" && (
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase text-zinc-400">Tautkan ke Modul Belajar</label>
                  <select
                    value={qModuleId}
                    onChange={(e) => setQModuleId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kuis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. QUESTIONS LIST MODAL */}
      {showQuestionsModal && activeQuizForQuestions && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <button
              type="button"
              onClick={() => setShowQuestionsModal(false)}
              title="Tutup Modal"
              className="absolute right-4 top-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4 pr-8">
              <div>
                <h3 className="text-base font-extrabold text-zinc-800">
                  Daftar Soal: {activeQuizForQuestions.title}
                </h3>
                <span className="text-3xs uppercase tracking-widest font-black text-[#5A77DF] font-mono">
                  {activeQuizForQuestions.type}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {activeQuizForQuestions.questions && activeQuizForQuestions.questions.length > 0 ? (
                activeQuizForQuestions.questions.map((q: any, index: number) => (
                  <div key={q.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3 relative">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-bold text-zinc-800 leading-relaxed flex-1">
                        {index + 1}. {q.question}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionEdit(q)}
                          title="Edit Pertanyaan"
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-amber-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionDelete(q.id)}
                          title="Hapus Pertanyaan"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-150">
                      {q.options && q.options.map((opt: any, oIdx: number) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-lg border text-2xs font-semibold ${
                            opt.is_correct
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold"
                              : "bg-white border-zinc-200 text-zinc-700"
                          }`}
                        >
                          <span className="font-extrabold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt.option_text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-2xs text-zinc-400 italic">
                  Belum ada pertanyaan pada kuis ini.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-150 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenQuestionCreate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2.5 text-2xs font-extrabold text-white transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pertanyaan Baru</span>
                </button>

                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  ref={questionsFileInputRef}
                  onChange={handleImportQuestionsAdmin}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isImportingQuestions}
                  onClick={() => questionsFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-2xs font-extrabold text-emerald-800 transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isImportingQuestions ? "Mengimpor Soal..." : "Import Soal (Word / PDF)"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestionsModal(false)}
                className="rounded-xl border border-zinc-200 hover:bg-zinc-100 px-5 py-2.5 text-2xs font-bold text-zinc-600 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. QUESTION EDIT/CREATE FORM MODAL */}
      {showQuestionEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowQuestionEditModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
              {selectedQuestion ? "Edit Pertanyaan Kuis" : "Tambah Pertanyaan Kuis Baru"}
            </h3>
            <form onSubmit={handleQuestionSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-2xs font-bold uppercase text-zinc-400">Pertanyaan / Soal</label>
                <textarea
                  rows={2}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs resize-none"
                  placeholder="Tuliskan isi pertanyaan di sini..."
                />
              </div>

              <div className="space-y-3 p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
                <h4 className="text-2xs font-bold uppercase text-zinc-500">Pilihan Jawaban (Masukkan 4 opsi)</h4>
                
                {[
                  { label: "Pilihan A (Opsi 1)", val: option1, set: setOption1, index: 0 },
                  { label: "Pilihan B (Opsi 2)", val: option2, set: setOption2, index: 1 },
                  { label: "Pilihan C (Opsi 3)", val: option3, set: setOption3, index: 2 },
                  { label: "Pilihan D (Opsi 4)", val: option4, set: setOption4, index: 3 },
                ].map((item) => (
                  <div key={item.index} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-zinc-150">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={correctIndex === item.index}
                      onChange={() => setCorrectIndex(item.index)}
                      className="cursor-pointer"
                      title="Tandai sebagai jawaban benar"
                    />
                    <div className="flex-1 space-y-0.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">{item.label}</span>
                      <input
                        type="text"
                        required
                        value={item.val}
                        onChange={(e) => item.set(e.target.value)}
                        className="w-full bg-transparent text-xs outline-none"
                        placeholder={`Isi pilihan ${String.fromCharCode(65 + item.index)}`}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-zinc-400 italic">
                  * Klik lingkaran radio button di sisi kiri pilihan untuk menandai kunci jawaban yang benar.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-150">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Soal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionEditModal(false)}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-xs font-bold transition text-zinc-600"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. ATTEMPT ANSWERS DETAIL POPUP */}
      {showAttemptDetailModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAttemptDetailModal(false)}
              title="Tutup Modal"
              className="absolute right-4 top-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="border-b border-zinc-150 pb-3 mb-4 pr-8">
              <h3 className="text-base font-extrabold text-zinc-800">
                Lembar Jawaban: {selectedAttempt.studentName}
              </h3>
              <p className="text-3xs text-zinc-400">
                Hasil pengerjaan kuis: <span className="font-bold text-zinc-700">{selectedAttempt.quizTitle}</span> • Kelas: {selectedAttempt.className}
              </p>
            </div>

            {(() => {
              const isScreening =
                selectedAttempt?.quizType === "SCREENING" ||
                (selectedAttempt?.quizTitle &&
                  (selectedAttempt.quizTitle.toLowerCase().includes("srq") ||
                    selectedAttempt.quizTitle.toLowerCase().includes("screening")));

              return (
                <>
                  <div className="space-y-4 text-left max-h-[55vh] overflow-y-auto pr-1">
                    {selectedAttempt.answers && selectedAttempt.answers.length > 0 ? (
                      selectedAttempt.answers.map((ans: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl border border-zinc-150 bg-zinc-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-zinc-800">
                            Soal {idx + 1}: {ans.question}
                          </h4>
                          <div className="flex items-center gap-2 pt-1 text-2xs">
                            <span className="font-semibold text-zinc-500">Jawaban siswa:</span>
                            {isScreening ? (
                              <span className="font-extrabold px-2.5 py-0.5 rounded-lg border border-[#5A77DF]/30 bg-[#5A77DF]/10 text-[#3E53A2]">
                                {ans.selectedOption}
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-lg border ${
                                    ans.isCorrect
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-rose-50 border-rose-200 text-rose-700"
                                  }`}
                                >
                                  {ans.selectedOption}
                                </span>
                                {ans.isCorrect ? (
                                  <span className="inline-flex items-center gap-1 text-3xs font-extrabold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Benar</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-3xs font-extrabold text-rose-700">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Salah</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-2xs text-zinc-400 italic">
                        Tidak ada rekaman jawaban detail untuk attempt ini.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    {!isScreening ? (
                      <span className="text-xs font-bold text-[#5A77DF]">
                        Skor Hasil: {selectedAttempt.score} / 100
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#5A77DF] flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-[#5A77DF]" />
                        <span>Skor SRQ-29: {selectedAttempt.score} / 29</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAttemptDetailModal(false)}
                      className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-5 py-2.5 text-2xs font-bold text-zinc-600 transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 9. TEACHER ASSIGNMENT MODAL */}
      {showTeacherModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-800">
                  Kelola Guru & Penugasan Mengajar
                </h3>
                <p className="text-3xs text-zinc-400">
                  {selectedTeacher.name} • NIP: {selectedTeacher.nip || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-5">
              {/* PROFIL GURU */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Nama Guru *
                  </label>
                  <input
                    type="text"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={tNip}
                    onChange={(e) => setTNip(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Kategori Jabatan Guru *
                  </label>
                  <select
                    value={tType}
                    onChange={(e) => setTType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  >
                    <option value="subject">Guru Mata Pelajaran</option>
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="bk">Guru Bimbingan Konseling (BK)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Kelas Binaan (Khusus Wali Kelas / BK)
                  </label>
                  <select
                    value={tClassId}
                    onChange={(e) => setTClassId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  >
                    <option value="">-- Tanpa Kelas Binaan / Semua Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.major})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MATRIX MULTI-SUBJECT & MULTI-CLASS ASSIGNMENT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#3E53A2] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#5A77DF]" />
                    <span>Centang Mata Pelajaran & Kelas yang Diampu ({tSelectedSubjectIds.length} terpilih)</span>
                  </label>
                  {/* <span className="text-3xs text-zinc-400 font-semibold">Guru ini bisa mengampu banyak mapel di banyak kelas</span> */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-3 rounded-xl border border-zinc-200 bg-white">
                  {subjects.length > 0 ? (
                    subjects.map((sub: any) => {
                      const isChecked = tSelectedSubjectIds.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                            isChecked
                              ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] shadow-xs"
                              : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 text-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSubjectSelection(sub.id)}
                              className="h-4 w-4 rounded-md border-zinc-300 text-[#5A77DF] focus:ring-[#5A77DF] cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-extrabold">{sub.name}</div>
                              <div className="text-3xs text-zinc-400 font-semibold">
                                Kelas: {sub.class?.name || "Umum"}
                              </div>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="rounded-full bg-[#5A77DF] px-2 py-0.5 text-3xs font-bold text-white">
                              Diampu
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-6 text-2xs text-zinc-400 italic">
                      Belum ada mata pelajaran terdaftar. Tambahkan mapel terlebih dahulu di tab Mata Pelajaran.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2 text-xs font-extrabold text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pengampuan Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. ADMIN ACTOR & PERMISSIONS MODAL */}
      {showActorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-800">
                  {selectedActor ? "Kelola Hak Akses Aktor Admin" : "Tambah Aktor Admin Baru"}
                </h3>
                <p className="text-3xs text-zinc-400">
                  Tentukan peran spesifik dan izin modul yang dapat diakses oleh akun admin ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowActorModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleActorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Nama Aktor Admin *
                  </label>
                  <input
                    type="text"
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    required
                    placeholder="Contoh: Admin Kurikulum"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={actorUsername}
                    onChange={(e) => setActorUsername(e.target.value)}
                    required
                    placeholder="admin_kurikulum"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Email Resmi Admin *
                  </label>
                  <input
                    type="email"
                    value={actorEmail}
                    onChange={(e) => setActorEmail(e.target.value)}
                    required
                    placeholder="kurikulum@school.id"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Password {selectedActor ? "(Kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showActorPassword ? "text" : "password"}
                      value={actorPassword}
                      onChange={(e) => setActorPassword(e.target.value)}
                      required={!selectedActor}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-9 text-xs font-semibold text-zinc-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowActorPassword(!showActorPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                    >
                      {showActorPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Divisi Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={actorDivision}
                    onChange={(e) => setActorDivision(e.target.value)}
                    placeholder="Kurikulum & Akademik"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                    Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={actorUnit}
                    onChange={(e) => setActorUnit(e.target.value)}
                    placeholder="Kampus Utama"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                  />
                </div>
              </div>

              {/* PERMISSIONS MATRIX */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#3E53A2] flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#5A77DF]" />
                    <span>Matriks Hak Akses Modul Admin ({actorPermissions.length} / {ALL_ADMIN_PERMISSIONS.length} Izin Aktif)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActorPermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.key))}
                      className="text-3xs font-extrabold text-[#5A77DF] hover:underline cursor-pointer"
                    >
                      Centang Semua
                    </button>
                    <span className="text-zinc-300">•</span>
                    <button
                      type="button"
                      onClick={() => setActorPermissions([])}
                      className="text-3xs font-extrabold text-rose-500 hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar p-3 rounded-xl border border-zinc-200 bg-white">
                  {ALL_ADMIN_PERMISSIONS.map((perm) => {
                    const isChecked = actorPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.key)}
                            className="mt-0.5 h-4 w-4 rounded-md border-zinc-300 text-[#5A77DF] focus:ring-[#5A77DF] cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-extrabold">{perm.label}</div>
                            <div className="text-3xs text-zinc-500 mt-0.5">{perm.desc}</div>
                          </div>
                        </div>
                        {isChecked && (
                          <span className="rounded-full bg-[#5A77DF] px-2 py-0.5 text-3xs font-bold text-white shrink-0 ml-2">
                            Diizinkan
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowActorModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2 text-xs font-extrabold text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Aktor & Hak Akses</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CHANGE PASSWORD MODAL */}
      {showAdminPassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#5A77DF]" />
                <h3 className="text-base font-extrabold text-zinc-900">Ganti Password Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminPassModal(false);
                  setAdminPassMsg(null);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {adminPassMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-bold ${adminPassMsg.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                {adminPassMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePasswordAdmin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Password Lama Admin</label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    value={adminOldPassword}
                    onChange={(e) => setAdminOldPassword(e.target.value)}
                    placeholder="Masukkan password admin saat ini"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#5A77DF] font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPassModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingAdminPass}
                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-5 py-2 text-xs font-extrabold text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {changingAdminPass ? "Memproses..." : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-zinc-200">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="p-2.5 rounded-full shrink-0 bg-rose-100 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">{confirmModal.title}</h3>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-600 transition cursor-pointer"
              >
                {confirmModal.cancelText || "Batal"}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-sm"
              >
                {confirmModal.confirmText || "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
