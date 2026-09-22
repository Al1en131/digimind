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

    const teacherSubjects = await prisma.subject.findMany({
      where: teacher.type === "wali_kelas" && teacher.class_id
        ? { class_id: teacher.class_id }
        : { teacher_id: teacher.id },
      include: {
        class: true,
        teacher: {
          include: {
            user: { select: { email: true } }
          }
        },
        modules: { select: { id: true, title: true } }
      }
    });

    if (teacher.type === "bk") {
      students = await prisma.siswa.findMany({
        where: teacher.class_id ? { class_id: teacher.class_id } : undefined,
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
                      subject: true
                    }
                  },
                  subject: true
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

      const classIds = teacher.type === "wali_kelas" && teacher.class_id
        ? [teacher.class_id]
        : Array.from(new Set(teacherSubjects.map(s => s.class_id)));

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
                      subject: true
                    }
                  },
                  subject: true
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
      const averageMood = recentJournals.length > 0
        ? Math.round(recentJournals.reduce((sum, journal) => sum + journal.mood_score, 0) / recentJournals.length)
        : 3;
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
        } else {
          rawStudentLevelName = student.subject_levels[0].level_name;
        }
      }

      const targetLevelStr = rawStudentLevelName.trim().toLowerCase();
      
      let levelNameDisplay = "Basic";
      if (targetLevelStr.startsWith("advan")) levelNameDisplay = "Advanced";
      else if (targetLevelStr.startsWith("intermed")) levelNameDisplay = "Intermediate";
      else if (targetLevelStr.startsWith("basic") || targetLevelStr.startsWith("beginner")) levelNameDisplay = "Basic";
      else if (rawStudentLevelName) levelNameDisplay = rawStudentLevelName;

      // 3. Subject Modules progress (Filtered ONLY for teacher's subject(s) AND student's placed level)
      const moduleProgressesList = allModulesWithSubject
        .filter((mod) => {
          const matchesSubject = teacher.type === "bk"
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

      // Format Pretests (Excluding Screening / Mental Pretests)
      const pretests = student.quiz_attempts
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
          return !isScreening;
        })
        .map((a) => ({
          id: a.id,
          quizId: a.quiz_id,
          title: a.quiz.title,
          subjectId: a.quiz.subject_id,
          subjectName: a.quiz.subject?.name || "Pretest",
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
        }));

      // Format Posttests (Keep ONLY the LATEST attempt per module)
      const latestPosttestsMap = new Map();
      student.quiz_attempts
        .filter((a) => a.quiz.type === "posttest")
        .forEach((a) => {
          const key = a.quiz.module_id || a.quiz_id;
          if (!latestPosttestsMap.has(key)) {
            latestPosttestsMap.set(key, {
              id: a.id,
              quizId: a.quiz_id,
              title: a.quiz.title,
              moduleId: a.quiz.module_id,
              moduleTitle: a.quiz.module?.title || a.quiz.title,
              subjectId: a.quiz.module?.subject_id || a.quiz.subject_id,
              subjectName: a.quiz.module?.subject?.name || a.quiz.subject?.name || "Modul Pelajaran",
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

      const isResolved = student.risk_flag === false;
      const riskFlag = isResolved ? false : (Boolean(student.risk_flag) || averageMood <= 2 || screenTime > 7);
      const mentalStatus = student.mental_level || (riskFlag ? "Perlu Pendampingan" : averageMood >= 4 ? "Baik" : averageMood === 3 ? "Waspada" : "Perlu Pendampingan");

      return {
        id: student.id,
        nis: student.nis || "-",
        name: student.name,
        classId: student.class_id,
        className: student.class.name,
        levelName: levelNameDisplay,
        literacyProgress,
        mentalHealthProgress,
        subjectProgress,
        mentalStatus,
        screenTime,
        moodScore: averageMood,
        modulesCompleted: student.completed_modules.length,
        riskFlag,
        riskReason: riskFlag
          ? `Mood rata-rata ${averageMood}/5${screenTime > 7 ? ` • screen time ${screenTime} jam` : ""}`
          : "Stabil",
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

    const alerts = studentSummaries.filter((student) => student.riskFlag);
    
    // Calculate averages
    const averageMood = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.moodScore, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageMentalHealthProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.mentalHealthProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageLiteracyProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.literacyProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageSubjectProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.subjectProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    
    const lowMoodCount = studentSummaries.filter((student) => student.moodScore <= 2).length;
    const lowMoodPercentage = students.length > 0 ? Math.round((lowMoodCount / students.length) * 100) : 0;

    const interventions = students.flatMap((student) =>
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

    const teacherClassesList = Array.from(
      new Map(teacherSubjects.map((s) => [s.class.id, s.class])).values()
    );

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        specialization: teacher.specialization || "Guru",
        position: teacher.position || (teacher.type === "bk" ? "Guru Bimbingan Konseling" : "Guru Mata Pelajaran"),
        phone_number: teacher.phone_number || "",
        type: teacher.type,
        class_id: teacher.class_id,
        assignedClass: teacher.class ? {
          id: teacher.class.id,
          name: teacher.class.name,
          major: teacher.class.major,
          year: formatAcademicYear(teacher.class.created_at, teacher.class.academic_year),
          displayName: `${teacher.class.name} (${teacher.class.major}) • TA ${formatAcademicYear(teacher.class.created_at, teacher.class.academic_year)}`
        } : null,
        subjects: teacherSubjects.map((s) => {
          const classYear = formatAcademicYear(s.class.created_at, s.class.academic_year);
          return {
            id: s.id,
            name: s.name,
            classId: s.class_id,
            className: s.class.name,
            classMajor: s.class.major,
            classYear,
            displayName: `${s.name} - ${s.class.name} ${s.class.major ? `(${s.class.major})` : ""} (${classYear})`,
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
          return {
            id: c.id,
            name: c.name,
            major: c.major,
            year: classYear,
            academicYear: `TA ${classYear}`,
            displayName: `${c.name} (${c.major}) • ${classYear}`
          };
        }),
      },
      classSummary: {
        totalStudents: students.length,
        averageProgress: averageSubjectProgress,
        averageMood,
        averageMentalHealthProgress,
        averageLiteracyProgress,
        averageSubjectProgress,
        lowMoodCount,
        lowMoodPercentage,
        riskCount: alerts.length,
        classes: Array.from(new Set(students.map((student) => student.class.name))),
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
