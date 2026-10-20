import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";
import { encryptSensitiveText, decryptSensitiveText } from "@/lib/encryption";

function formatAcademicYear(dateInput: Date | string | null | undefined, explicitYear?: string | null): string {
  if (explicitYear && explicitYear.trim()) return explicitYear.trim();
  if (!dateInput) return "2025/2026";
  const d = new Date(dateInput);
  const year = isNaN(d.getFullYear()) ? 2025 : d.getFullYear();
  return `${year}/${year + 1}`;
}

function parseScreenTime(activities: string | null | undefined): number {
  if (!activities) return 0;

  const match = activities.match(/(\d+(?:[.,]\d+)?)\s*(jam|hour|hrs|h)/i);
  if (!match) return 0;

  const number = Number(match[1].replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function normalizeStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Aktif";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "pending":
    default:
      return "Pending";
  }
}

function normalizeInterventionStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali sebagai guru." },
        { status: 401 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId },
      include: { user: true, class: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Profil guru tidak ditemukan." },
        { status: 404 }
      );
    }

    let students = [];
    let teacherModuleIds: number[] = [];

    let siblingClassesList: any[] = [];
    if (teacher.type === "wali_kelas" && teacher.class) {
      siblingClassesList = await prisma.schoolClass.findMany({
        where: {
          name: teacher.class.name,
          major: teacher.class.major,
        },
      });
    }

    const waliSiblingClassIds = siblingClassesList.map((c) => c.id);

    const teacherSubjects = await prisma.subject.findMany({
      where: teacher.type === "wali_kelas" && (teacher.class_id || waliSiblingClassIds.length > 0)
        ? {
            OR: [
              { class_id: { in: [teacher.class_id, ...waliSiblingClassIds].filter((id): id is number => typeof id === "number") } },
              { teacher_id: teacher.id },
            ],
          }
        : { teacher_id: teacher.id },
      include: {
        class: true,
        teacher: {
          include: {
            user: { select: { email: true } },
          },
        },
        modules: { select: { id: true, title: true } },
      },
    });

    const classIds = Array.from(
      new Set([
        ...(teacher.class_id ? [teacher.class_id] : []),
        ...waliSiblingClassIds,
        ...teacherSubjects.map((s) => s.class_id).filter((id): id is number => typeof id === "number"),
      ])
    );

    if (teacher.type === "bk") {
      students = await prisma.siswa.findMany({
        where: classIds.length > 0 ? { class_id: { in: classIds } } : undefined,
        include: {
          class: true,
          subject_levels: true,
          mental_journals: {
            orderBy: { logged_at: "desc" },
            take: 5,
          },
          completed_modules: true,
          module_progresses: true,
          interventions: {
            orderBy: { created_at: "desc" },
            take: 5,
          },
          quiz_attempts: {
            orderBy: { completed_at: "desc" },
            include: {
              quiz: {
                include: {
                  module: {
                    include: {
                      subject: {
                        include: { class: true }
                      }
                    }
                  },
                  subject: {
                    include: { class: true }
                  }
                }
              },
              answers: {
                include: {
                  question: {
                    include: {
                      options: true,
                    },
                  },
                  option: true,
                },
              },
            }
          }
        },
      });
    } else {
      teacherModuleIds = teacherSubjects.flatMap(s => s.modules.map(m => m.id));

      const teacherSubjectIdsList = teacherSubjects.map(s => s.id);

      students = await prisma.siswa.findMany({
        where: {
          OR: [
            { class_id: { in: classIds } },
            { quiz_attempts: { some: { quiz: { subject_id: { in: teacherSubjectIdsList } } } } },
            { completed_modules: { some: { module: { subject_id: { in: teacherSubjectIdsList } } } } }
          ]
        },
        include: {
          class: true,
          subject_levels: true,
          mental_journals: {
            orderBy: { logged_at: "desc" },
            take: 5,
          },
          completed_modules: true,
          module_progresses: true,
          interventions: {
            orderBy: { created_at: "desc" },
            take: 5,
          },
          quiz_attempts: {
            orderBy: { completed_at: "desc" },
            include: {
              quiz: {
                include: {
                  module: {
                    include: {
                      subject: {
                        include: { class: true }
                      }
                    }
                  },
                  subject: {
                    include: { class: true }
                  }
                }
              },
              answers: {
                include: {
                  question: {
                    include: {
                      options: true,
                    },
                  },
                  option: true,
                },
              },
            }
          }
        },
      });
    }

    const mentalHealthCategory = await prisma.category.findFirst({
      where: { name: { contains: "Mental" } },
      select: { id: true },
    });

    const mentalHealthModules = mentalHealthCategory?.id
      ? await prisma.module.findMany({
          where: { category_id: mentalHealthCategory.id, subject_id: null },
          select: { id: true },
        })
      : [];

    const mentalHealthModuleIds = new Set(mentalHealthModules.map((module) => module.id));

    const literacyCategory = await prisma.category.findFirst({
      where: { name: { contains: "Literasi" } },
      select: { id: true },
    });

    const literacyModules = literacyCategory?.id
      ? await prisma.module.findMany({
          where: { category_id: literacyCategory.id, subject_id: null },
          select: { id: true },
        })
      : [];

    const literacyModuleIds = new Set(literacyModules.map((module) => module.id));

    // Fetch all modules with subject and level details for detailed student progress
    const allModulesWithSubject = await prisma.module.findMany({
      include: {
        level: true,
        subject: {
          include: { class: true }
        }
      }
    });

    const classSubjectModuleIdsMap = new Map();
    for (const mod of allModulesWithSubject) {
      if (mod.subject_id && mod.subject?.class_id) {
        if (!classSubjectModuleIdsMap.has(mod.subject.class_id)) {
          classSubjectModuleIdsMap.set(mod.subject.class_id, []);
        }
        classSubjectModuleIdsMap.get(mod.subject.class_id).push(mod.id);
      }
    }

    const teacherSubjectIdsSet = new Set(teacherSubjects.map((s) => s.id));

    const studentSummaries = students.map((student) => {
      const recentJournals = student.mental_journals || [];
      const latestJournal = recentJournals[0];
      const latestMood = latestJournal ? latestJournal.mood_score : null;
      const averageMood = recentJournals.length > 0
        ? Math.round(recentJournals.reduce((sum, journal) => sum + journal.mood_score, 0) / recentJournals.length)
        : 0;
      const screenTime = parseScreenTime(latestJournal?.activities ?? null);

      // 1. Mental health progress
      const completedMentalHealthModules = student.completed_modules.filter((completedModule) => mentalHealthModuleIds.has(completedModule.module_id)).length;
      const mentalHealthProgress = mentalHealthModules.length > 0
        ? Math.round((completedMentalHealthModules / mentalHealthModules.length) * 100)
        : 0;

      // 2. Digital Literacy progress
      const completedLiteracyModules = student.completed_modules.filter((completedModule) => literacyModuleIds.has(completedModule.module_id)).length;
      const literacyProgress = literacyModules.length > 0
        ? Math.round((completedLiteracyModules / literacyModules.length) * 100)
        : 0;

      // Get student placement level for teacher's subject
      let rawStudentLevelName = "";
      if (student.subject_levels && student.subject_levels.length > 0) {
        const teacherSubjLevel = student.subject_levels.find((sl: any) => teacherSubjectIdsSet.has(sl.subject_id));
        if (teacherSubjLevel) {
          rawStudentLevelName = teacherSubjLevel.level_name;
        } else if (teacher.type === "subject") {
          rawStudentLevelName = "Belum Pretest";
        } else {
          rawStudentLevelName = student.subject_levels[0].level_name;
        }
      } else {
        rawStudentLevelName = "Belum Pretest";
      }

      const targetLevelStr = rawStudentLevelName.trim().toLowerCase();
      
      let levelNameDisplay = "Belum Pretest";
      if (targetLevelStr.startsWith("advan")) levelNameDisplay = "Advanced";
      else if (targetLevelStr.startsWith("intermed")) levelNameDisplay = "Intermediate";
      else if (targetLevelStr.startsWith("basic") || targetLevelStr.startsWith("beginner")) levelNameDisplay = "Basic";
      else if (targetLevelStr === "belum pretest") levelNameDisplay = "Belum Pretest";
      else if (rawStudentLevelName) levelNameDisplay = rawStudentLevelName;

      // 3. Subject Modules progress (Filtered ONLY for teacher's subject(s) AND student's placed level)
      const moduleProgressesList = allModulesWithSubject
        .filter((mod) => {
          const matchesSubject = (teacher.type === "bk" || teacher.type === "wali_kelas")
            ? mod.subject?.class_id === student.class_id
            : teacherSubjectIdsSet.size > 0
            ? mod.subject_id ? teacherSubjectIdsSet.has(mod.subject_id) && mod.subject?.class_id === student.class_id : false
            : mod.subject ? mod.subject.class_id === student.class_id : false;

          if (!matchesSubject) return false;

          // Filter by student's placed level if student has completed placement pretest
          if (targetLevelStr && targetLevelStr !== "belum pretest") {
            if (!mod.level || !mod.level.name) return false;
            const modLevelStr = mod.level.name.trim().toLowerCase();
            const isLevelMatch = modLevelStr === targetLevelStr ||
              (targetLevelStr.startsWith("advan") && modLevelStr.startsWith("advan")) ||
              (targetLevelStr.startsWith("intermed") && modLevelStr.startsWith("intermed")) ||
              (targetLevelStr.startsWith("basic") && modLevelStr.startsWith("basic")) ||
              (targetLevelStr.startsWith("beginner") && modLevelStr.startsWith("basic")) ||
              (targetLevelStr.startsWith("basic") && modLevelStr.startsWith("beginner"));
            return isLevelMatch;
          }

          return true;
        })
        .map((mod) => {
          const isCompleted = student.completed_modules.some((c) => c.module_id === mod.id);
          const progRec = student.module_progresses.find((p) => p.module_id === mod.id);
          const progress = isCompleted ? 100 : (progRec ? progRec.progress : 0);
          return {
            moduleId: mod.id,
            moduleTitle: mod.title,
            subjectId: mod.subject_id,
            subjectName: mod.subject?.name || "Umum",
            progress,
            isCompleted,
          };
        });

      // Calculate subjectProgress as exact average of moduleProgressesList to avoid any discrepancy
      const totalModProgSum = moduleProgressesList.reduce((sum, m) => sum + m.progress, 0);
      const subjectProgress = moduleProgressesList.length > 0
        ? Math.round(totalModProgSum / moduleProgressesList.length)
        : 0;

      // Format Pretests (Excluding Screening / Mental Pretests, keep ONLY the latest attempt per subject)
      const latestPretestsMap = new Map();
      student.quiz_attempts
        .filter((a) => {
          if (a.quiz.type !== "pretest") return false;
          const titleLower = (a.quiz.title || "").toLowerCase();
          const subjectNameLower = (a.quiz.subject?.name || "").toLowerCase();
          const isScreening =
            titleLower.includes("screening") ||
            titleLower.includes("skrining") ||
            titleLower.includes("mental") ||
            subjectNameLower.includes("mental") ||
            !a.quiz.subject_id;
          if (isScreening) return false;

          // Scope strictly to this teacher's assigned subjects for subject teachers
          if (teacher.type === "subject") {
            return a.quiz.subject_id ? teacherSubjectIdsSet.has(a.quiz.subject_id) : false;
          }
          return true;
        })
        .forEach((a) => {
          const key = a.quiz.subject_id || a.quiz_id;
          if (!latestPretestsMap.has(key)) {
            const quizClassObj = a.quiz.subject?.class;
            const quizClassYear = quizClassObj
              ? formatAcademicYear(quizClassObj.created_at, quizClassObj.academic_year)
              : formatAcademicYear(student.class.created_at, student.class.academic_year);
            const quizClassName = quizClassObj
              ? (quizClassObj.major ? `${quizClassObj.name} ${quizClassObj.major}` : quizClassObj.name)
              : (student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name);

            latestPretestsMap.set(key, {
              id: a.id,
              quizId: a.quiz_id,
              title: a.quiz.title,
              subjectId: a.quiz.subject_id,
              subjectName: a.quiz.subject?.name || "Pretest",
              className: quizClassName,
              classYear: quizClassYear,
              academicYear: `TA ${quizClassYear}`,
              score: a.score,
              completedAt: a.completed_at
                ? new Date(a.completed_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-",
              answers: a.answers.map((ans) => {
                const correctOpt = ans.question.options?.find((o: any) => o.is_correct);
                return {
                  id: ans.id,
                  question: ans.question.question,
                  selectedOption: ans.option.option_text,
                  isCorrect: ans.option.is_correct ?? false,
                  correctOption: correctOpt ? correctOpt.option_text : null,
                };
              }),
            });
          }
        });

      const pretests = Array.from(latestPretestsMap.values());

      // Format Posttests (Keep ONLY the LATEST attempt per module, scoped to teacher's subjects)
      const latestPosttestsMap = new Map();
      student.quiz_attempts
        .filter((a) => {
          if (a.quiz.type !== "posttest") return false;
          // Scope strictly to this teacher's assigned subjects for subject teachers
          if (teacher.type === "subject") {
            const subjId = a.quiz.module?.subject_id || a.quiz.subject_id;
            return subjId ? teacherSubjectIdsSet.has(subjId) : false;
          }
          return true;
        })
        .forEach((a) => {
          const key = a.quiz.module_id || a.quiz_id;
          if (!latestPosttestsMap.has(key)) {
            const quizClassObj = a.quiz.module?.subject?.class || a.quiz.subject?.class;
            const quizClassYear = quizClassObj
              ? formatAcademicYear(quizClassObj.created_at, quizClassObj.academic_year)
              : formatAcademicYear(student.class.created_at, student.class.academic_year);
            const quizClassName = quizClassObj
              ? (quizClassObj.major ? `${quizClassObj.name} ${quizClassObj.major}` : quizClassObj.name)
              : (student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name);

            latestPosttestsMap.set(key, {
              id: a.id,
              quizId: a.quiz_id,
              title: a.quiz.title,
              moduleId: a.quiz.module_id,
              moduleTitle: a.quiz.module?.title || a.quiz.title,
              subjectId: a.quiz.module?.subject_id || a.quiz.subject_id,
              subjectName: a.quiz.module?.subject?.name || a.quiz.subject?.name || "Modul Pelajaran",
              className: quizClassName,
              classYear: quizClassYear,
              academicYear: `TA ${quizClassYear}`,
              score: a.score,
              completedAt: a.completed_at
                ? new Date(a.completed_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-",
              answers: a.answers.map((ans) => {
                const correctOpt = ans.question.options?.find((o: any) => o.is_correct);
                return {
                  id: ans.id,
                  question: ans.question.question,
                  selectedOption: ans.option.option_text,
                  isCorrect: ans.option.is_correct ?? false,
                  correctOption: correctOpt ? correctOpt.option_text : null,
                };
              }),
            });
          }
        });
      const posttests = Array.from(latestPosttestsMap.values());

      // Risk & Status determination:
      // If student has a recent low mood (latest journal <= 2), average mood <= 2, explicit risk_flag === true, or excessive screen time:
      // An alert MUST be active, and pendampingan session is opened/reopened even if previously resolved!
      const hasRecentLowMood = (latestMood !== null && latestMood <= 2) || (recentJournals.length > 0 && averageMood <= 2);
      const hasHighScreenTime = screenTime > 7;

      let riskFlag = false;
      let mentalStatus = "Stabil";
      let riskReason = "Stabil";

      if (hasRecentLowMood || hasHighScreenTime || student.risk_flag === true) {
        riskFlag = true;
        mentalStatus = "Perlu Pendampingan";
        riskReason = (latestMood !== null && latestMood <= 2)
          ? `Mood terbaru ${latestMood}/5 (Perlu Pendampingan)${hasHighScreenTime ? ` • screen time ${screenTime} jam` : ""}`
          : averageMood <= 2 && recentJournals.length > 0
          ? `Mood rata-rata ${averageMood}/5 (Waspada)${hasHighScreenTime ? ` • screen time ${screenTime} jam` : ""}`
          : hasHighScreenTime
          ? `Screen time tinggi (${screenTime} jam)`
          : "Terindikasi perlu pendampingan";
      } else {
        if (student.mental_level?.includes("Sudah Pendampingan")) {
          riskFlag = false;
          mentalStatus = "Sudah Pendampingan";
          riskReason = "Sudah Pendampingan BK";
        } else if (recentJournals.length === 0) {
          riskFlag = false;
          mentalStatus = student.mental_level || "Belum Ada Jurnal";
          riskReason = "Belum Ada Jurnal";
        } else if (averageMood >= 4) {
          riskFlag = false;
          mentalStatus = "Baik";
          riskReason = "Stabil";
        } else {
          riskFlag = false;
          mentalStatus = "Stabil";
          riskReason = "Stabil";
        }
      }

      const isCurrentClass = classIds.includes(student.class_id);
      const studentClassYear = formatAcademicYear(student.class.created_at, student.class.academic_year);
      const fullClassName = student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name;

      const displayMood = latestMood !== null ? latestMood : (averageMood > 0 ? averageMood : 0);

      return {
        id: student.id,
        nis: student.nis || "-",
        name: student.name,
        classId: student.class_id,
        className: fullClassName,
        classMajor: student.class.major || "",
        classYear: studentClassYear,
        academicYear: `TA ${studentClassYear}`,
        isCurrentClass,
        isPastStudent: !isCurrentClass,
        levelName: levelNameDisplay,
        literacyProgress,
        mentalHealthProgress,
        subjectProgress,
        mentalStatus,
        screenTime,
        moodScore: displayMood,
        latestMood,
        averageMood,
        modulesCompleted: student.completed_modules.length,
        riskFlag,
        riskReason,
        latestJournal: latestJournal
          ? {
              moodScore: latestJournal.mood_score,
              activities: decryptSensitiveText(latestJournal.activities),
              aiFeedback: decryptSensitiveText(latestJournal.ai_feedback),
            }
          : null,
        pretests,
        posttests,
        moduleProgressesList,
      };
    });

    // CRITICAL: Only count ACTIVE students currently enrolled in the teacher's active classes for graphs and dashboard statistics
    const activeStudentSummaries = studentSummaries.filter((student) => student.isCurrentClass);
    const alerts = activeStudentSummaries.filter((student) => student.riskFlag);
    
    // Calculate averages based strictly on ACTIVE students in teacher's current classes
    const activeCount = activeStudentSummaries.length;
    const averageMood = activeCount > 0
      ? Math.round(activeStudentSummaries.reduce((sum, student) => sum + student.moodScore, 0) / activeCount)
      : 0;
    const averageMentalHealthProgress = activeCount > 0
      ? Math.round(activeStudentSummaries.reduce((sum, student) => sum + student.mentalHealthProgress, 0) / activeCount)
      : 0;
    const averageLiteracyProgress = activeCount > 0
      ? Math.round(activeStudentSummaries.reduce((sum, student) => sum + student.literacyProgress, 0) / activeCount)
      : 0;
    const averageSubjectProgress = activeCount > 0
      ? Math.round(activeStudentSummaries.reduce((sum, student) => sum + student.subjectProgress, 0) / activeCount)
      : 0;
    
    const lowMoodCount = activeStudentSummaries.filter((student) => (student.moodScore > 0 && student.moodScore <= 2) || student.riskFlag).length;
    const lowMoodPercentage = activeCount > 0 ? Math.round((lowMoodCount / activeCount) * 100) : 0;

    const interventions = students
      .filter((s) => classIds.includes(s.class_id))
      .flatMap((student) =>
        (student.interventions || []).map((intervention) => ({
          id: intervention.id,
          studentName: student.name,
          note: decryptSensitiveText(intervention.description) || decryptSensitiveText(intervention.name),
          status: normalizeStatus(intervention.status || null),
          updatedAt: intervention.updated_at
            ? new Date(intervention.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            : "baru",
        }))
      );

    const aiInsights = [
      `Rata-rata progres literasi digital kelas ${averageLiteracyProgress}%, mental health ${averageMentalHealthProgress}%, dan mapel ${averageSubjectProgress}%.`,
      lowMoodCount > 0
        ? `${lowMoodCount} siswa menunjukkan tren mood rendah dan membutuhkan perhatian lebih cepat.`
        : "Tidak ada siswa yang menunjukkan tren mood rendah pada periode ini.",
      `Intervensi aktif saat ini sebanyak ${interventions.filter((item) => item.status === "Aktif").length} catatan.`,
    ];

    const teacherClassesMap = new Map();
    if (teacher.class) {
      teacherClassesMap.set(teacher.class.id, teacher.class);
    }
    for (const sc of siblingClassesList) {
      teacherClassesMap.set(sc.id, sc);
    }
    for (const s of teacherSubjects) {
      if (s.class) {
        teacherClassesMap.set(s.class.id, s.class);
      }
    }
    for (const st of students) {
      if (st.class) {
        teacherClassesMap.set(st.class.id, st.class);
      }
    }
    const teacherClassesList = Array.from(teacherClassesMap.values());

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        username: teacher.user.username,
        email: teacher.user.email,
        nip: teacher.nip,
        specialization: teacher.specialization || "Guru",
        position: teacher.position || (teacher.type === "bk" ? "Guru Bimbingan Konseling" : "Guru Mata Pelajaran"),
        phone_number: teacher.phone_number || "",
        type: teacher.type,
        class_id: teacher.class_id,
        assignedClass: teacher.class ? {
          id: teacher.class.id,
          name: teacher.class.major ? `${teacher.class.name} ${teacher.class.major}` : teacher.class.name,
          rawName: teacher.class.name,
          major: teacher.class.major,
          year: formatAcademicYear(teacher.class.created_at, teacher.class.academic_year),
          displayName: `${teacher.class.name} ${teacher.class.major ? `(${teacher.class.major})` : ""} • TA ${formatAcademicYear(teacher.class.created_at, teacher.class.academic_year)}`
        } : null,
        subjects: teacherSubjects.map((s) => {
          const classYear = formatAcademicYear(s.class.created_at, s.class.academic_year);
          const fullClassName = s.class.major ? `${s.class.name} ${s.class.major}` : s.class.name;
          return {
            id: s.id,
            name: s.name,
            classId: s.class_id,
            className: fullClassName,
            rawClassName: s.class.name,
            classMajor: s.class.major,
            classYear,
            displayName: `${s.name} - ${fullClassName} (TA ${classYear})`,
            assignedTeacher: s.teacher
              ? {
                  id: s.teacher.id,
                  name: s.teacher.name,
                  nip: s.teacher.nip || "-",
                  specialization: s.teacher.specialization || "-",
                  position: s.teacher.position || "-",
                  phone_number: s.teacher.phone_number || "-",
                  email: s.teacher.user?.email || "-",
                }
              : null,
          };
        }),
        classes: teacherClassesList.map((c) => {
          const classYear = formatAcademicYear(c.created_at, c.academic_year);
          const fullClassName = c.major ? `${c.name} ${c.major}` : c.name;
          return {
            id: c.id,
            name: fullClassName,
            rawName: c.name,
            major: c.major,
            year: classYear,
            academicYear: `TA ${classYear}`,
            displayName: `${fullClassName} • TA ${classYear}`
          };
        }),
      },
      classSummary: {
        totalStudents: activeStudentSummaries.length,
        averageProgress: averageSubjectProgress,
        averageMood,
        averageMentalHealthProgress,
        averageLiteracyProgress,
        averageSubjectProgress,
        lowMoodCount,
        lowMoodPercentage,
        riskCount: alerts.length,
        classes: Array.from(new Set(activeStudentSummaries.map((student) => student.className))),
      },
      students: studentSummaries,
      alerts,
      aiInsights,
      interventions,
      privacyNotice:
        "Data jurnal pribadi siswa disamarkan dan hanya ditampilkan dalam bentuk ringkasan AI untuk melindungi privasi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat dashboard guru.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali sebagai guru." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const studentId = Number(body?.studentId);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const status = normalizeInterventionStatus(body?.status);

    if (!studentId || !title || !description) {
      return NextResponse.json(
        { success: false, message: "Data intervensi tidak lengkap." },
        { status: 400 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId },
      include: { user: true },
    });

    if (!teacher || teacher.type !== "bk") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru BK yang dapat memberikan intervensi secara langsung." },
        { status: 403 }
      );
    }

    const student = await prisma.siswa.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const intervention = await prisma.mentalIntervention.create({
      data: {
        student_id: studentId,
        name: encryptSensitiveText(title) || title,
        description: encryptSensitiveText(description) || description,
        status,
        assigned_by: teacher?.user?.id ?? null,
        started_at: status === "active" ? new Date() : null,
        ended_at: status === "completed" ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      intervention: {
        id: intervention.id,
        studentName: student.name,
        note: decryptSensitiveText(intervention.description) || decryptSensitiveText(intervention.name),
        status: normalizeStatus(intervention.status || null),
        updatedAt: intervention.updated_at
          ? new Date(intervention.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
          : "baru",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menyimpan intervensi.", error: error.message },
      { status: 500 }
    );
  }
}
