import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";
import { decryptSensitiveText } from "@/lib/encryption";
import { calculateStudentModuleProgress } from "@/lib/student-progress";

function formatAcademicYear(dateInput: Date | string | null | undefined, explicitYear?: string | null): string {
  if (explicitYear && explicitYear.trim()) return explicitYear.trim();
  if (!dateInput) return "2025/2026";
  const d = new Date(dateInput);
  const year = isNaN(d.getFullYear()) ? 2025 : d.getFullYear();
  return `${year}/${year + 1}`;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({
        success: false,
        message: "Akses ditolak. Silakan login kembali."
      }, { status: 401 });
    }

    const student = await prisma.siswa.findUnique({
      where: { user_id: decoded.userId },
      include: {
        user: true,
        class: true,
        subject_levels: {
          include: {
            subject: true
          }
        },
        student_badges: {
          include: {
            badge: true
          }
        },
        mental_journals: {
          orderBy: { logged_at: "desc" },
          take: 7
        }
      }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        message: "Profil siswa tidak ditemukan."
      }, { status: 404 });
    }

    // Check if student has completed SRQ-29 initial pretest
    const pretestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        student_id: student.id,
        quiz: {
          type: "pretest",
          subject_id: null
        },
        completed_at: { not: null }
      }
    });
    const hasCompletedPretest = !!pretestAttempt || !!student.literacy_level;

    // Get completed module IDs
    const completedRecords = await prisma.completedModule.findMany({
      where: { student_id: student.id }
    });
    const completedModuleIds = completedRecords.map(r => r.module_id);

    // Get all quiz attempts with deep subject and answer relations for student
    const studentAttempts = await prisma.quizAttempt.findMany({
      where: {
        student_id: student.id,
      },
      include: {
        quiz: {
          include: {
            module: {
              include: {
                subject: {
                  include: { class: true },
                },
              },
            },
            subject: {
              include: { class: true },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: { options: true },
            },
            option: true,
          },
        },
      },
      orderBy: { completed_at: "desc" },
    });

    const studentModuleProgresses = await prisma.studentModuleProgress.findMany({
      where: { student_id: student.id }
    });

    const computeModuleProgress = (modId: number) => {
      if (completedModuleIds.includes(modId)) return 100;
      const progressRecord = studentModuleProgresses.find(p => p.module_id === modId);
      const savedReadingProg = progressRecord ? progressRecord.progress : 0;
      const modAttempts = studentAttempts.filter(a => a.quiz.module_id === modId);
      if (modAttempts.length > 0) {
        const highestScore = Math.max(...modAttempts.map(a => a.score || 0));
        return Math.max(savedReadingProg, highestScore);
      }
      return savedReadingProg;
    };

    // Get all system modules (Digital Literacy & Subject Modules)
    const allSystemModules = await prisma.module.findMany({
      include: { category: true, level: true }
    });

    const moduleProgressMap: Record<number, number> = {};
    allSystemModules.forEach(m => {
      moduleProgressMap[m.id] = computeModuleProgress(m.id);
    });

    // Determine accessible class IDs for this student:
    // Always include student's active class (student.class_id).
    // Include previous class IDs ONLY if the student has actual records (completed modules, reading progress, or quiz attempts).
    const accessibleClassIds = new Set<number>([student.class_id]);

    const pastModules = await prisma.module.findMany({
      where: {
        OR: [
          { completed_by: { some: { student_id: student.id } } },
          { module_progresses: { some: { student_id: student.id } } },
          { quizzes: { some: { attempts: { some: { student_id: student.id } } } } }
        ],
        subject_id: { not: null }
      },
      select: { subject: { select: { class_id: true } } }
    });

    pastModules.forEach((m) => {
      if (m.subject?.class_id) {
        accessibleClassIds.add(m.subject.class_id);
      }
    });

    const pastSubjectLevels = await prisma.studentSubjectLevel.findMany({
      where: { student_id: student.id },
      select: { subject: { select: { class_id: true } } }
    });

    pastSubjectLevels.forEach((sl) => {
      if (sl.subject?.class_id) {
        accessibleClassIds.add(sl.subject.class_id);
      }
    });

    const targetClassIds = Array.from(accessibleClassIds);

    // Fetch subjects strictly scoped to student's accessible classes
    const subjects = await prisma.subject.findMany({
      where: {
        class_id: { in: targetClassIds },
        name: { not: "Literasi Digital" }
      },
      include: {
        class: true,
        teacher: true,
        quizzes: {
          where: { type: "pretest" },
          select: { id: true, title: true }
        },
        modules: {
          include: {
            quizzes: true,
            level: true,
            category: true
          }
        }
      },
      orderBy: [
        { class_id: "asc" },
        { name: "asc" }
      ]
    });

    const subjectsFormatted = subjects.map(sub => {
      const subjectLevelRecord = student.subject_levels.find(sl => sl.subject_id === sub.id);
      const pretestQuiz = sub.quizzes[0] || null;

      // Subject has completed pretest if record exists or student completed its pretest quiz
      const hasCompletedSubjectPretest = !!subjectLevelRecord || (pretestQuiz ? studentAttempts.some(a => a.quiz_id === pretestQuiz.id && a.completed_at) : false);
      const currentSubjectLevel = subjectLevelRecord?.level_name || "Belum Pretest";

      let subModules = sub.modules.map((mod: any) => {
        const prog = computeModuleProgress(mod.id);
        moduleProgressMap[mod.id] = prog;
        return {
          ...mod,
          progress: prog
        };
      });

      // Filter subject modules according to student's assigned placement level
      if (hasCompletedSubjectPretest && currentSubjectLevel !== "Belum Pretest") {
        const targetLevelStr = currentSubjectLevel.trim().toLowerCase();
        
        subModules = subModules.filter((m: any) => {
          if (!m.level || !m.level.name) return false;
          const modLevelStr = m.level.name.trim().toLowerCase();
          
          return modLevelStr === targetLevelStr ||
                 (targetLevelStr.startsWith("advan") && modLevelStr.startsWith("advan")) ||
                 (targetLevelStr.startsWith("intermed") && modLevelStr.startsWith("intermed")) ||
                 (targetLevelStr.startsWith("basic") && modLevelStr.startsWith("basic"));
        });
      }

      return {
        id: sub.id,
        name: sub.name,
        class_id: sub.class_id,
        className: sub.class?.major ? `${sub.class.name} ${sub.class.major}` : sub.class?.name || `Kelas ${sub.class_id}`,
        isCurrentClass: sub.class_id === student.class_id,
        teacher: sub.teacher,
        pretestQuizId: pretestQuiz?.id || null,
        hasPretest: hasCompletedSubjectPretest,
        level: currentSubjectLevel,
        score: subjectLevelRecord?.score || 0,
        modules: subModules
      };
    });

    // Build unique list of available classes that have subjects/modules
    const classMap = new Map<number, { id: number; name: string; major: string; year: string; isCurrent: boolean }>();
    if (student.class) {
      classMap.set(student.class.id, {
        id: student.class.id,
        name: student.class.name,
        major: student.class.major,
        year: formatAcademicYear(student.class.created_at, student.class.academic_year),
        isCurrent: true
      });
    }

    subjects.forEach(sub => {
      if (sub.class && !classMap.has(sub.class.id)) {
        classMap.set(sub.class.id, {
          id: sub.class.id,
          name: sub.class.name,
          major: sub.class.major,
          year: formatAcademicYear(sub.class.created_at, sub.class.academic_year),
          isCurrent: sub.class.id === student.class_id
        });
      }
    });

    studentAttempts.forEach((a) => {
      const cls = a.quiz.subject?.class || a.quiz.module?.subject?.class;
      if (cls && !classMap.has(cls.id)) {
        classMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          major: cls.major,
          year: formatAcademicYear(cls.created_at, cls.academic_year),
          isCurrent: cls.id === student.class_id,
        });
      }
    });

    const availableClasses = Array.from(classMap.values()).map(c => ({
      ...c,
      academicYear: `TA ${c.year}`,
      displayName: c.major ? `${c.name} ${c.major} (TA ${c.year})` : `${c.name} (TA ${c.year})`
    })).sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    const gradesFormatted = studentAttempts
      .filter((a) => a.completed_at !== null)
      .filter((a) => !(a.quiz.type === "pretest" && a.quiz.subject_id === null && a.quiz.module_id === null))
      .map((a) => {
        const quizClassObj = a.quiz.subject?.class || a.quiz.module?.subject?.class || student.class;
        const quizClassYear = quizClassObj
          ? formatAcademicYear(quizClassObj.created_at, quizClassObj.academic_year)
          : formatAcademicYear(student.class.created_at, student.class.academic_year);
        const quizClassName = quizClassObj
          ? (quizClassObj.major ? `${quizClassObj.name} ${quizClassObj.major}` : quizClassObj.name)
          : (student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name);
        const subjName = a.quiz.subject?.name || a.quiz.module?.subject?.name || (a.quiz.type === "pretest" ? "Pretest Diagnostik" : "Kuis Modul");
        const classId = quizClassObj ? quizClassObj.id : student.class_id;

        return {
          id: a.id,
          quizId: a.quiz_id,
          title: a.quiz.title,
          type: a.quiz.type === "pretest" ? "Pretest" : "Posttest",
          classId,
          className: quizClassName,
          classYear: quizClassYear,
          academicYear: `TA ${quizClassYear}`,
          subjectId: a.quiz.subject_id || a.quiz.module?.subject_id || null,
          subjectName: subjName,
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
        };
      });

    // Compute accurate overall progress across accessible modules for this student's class & level
    const { progressPercent } = await calculateStudentModuleProgress(
      student.id,
      student.class_id,
      student.literacy_level
    );
    student.module_progress = progressPercent;

    // Badges & Leaderboard
    const allBadges = await prisma.badge.findMany();
    const allStudents = await prisma.siswa.findMany({
      orderBy: [{ module_progress: "desc" }, { name: "asc" }]
    });
    const rank = allStudents.findIndex(s => s.id === student.id) + 1;

    // Auto award Cyber Pioneer badge
    const cyberPioneerBadge = allBadges.find(b => b.name === "Cyber Pioneer");
    const hasCyberPioneer = student.student_badges.some(sb => sb.badge.name === "Cyber Pioneer");
    if (cyberPioneerBadge && !hasCyberPioneer) {
      await prisma.studentBadge.create({
        data: {
          student_id: student.id,
          badge_id: cyberPioneerBadge.id
        }
      });
    }

    // Check monthly screening attempts and mental insights history
    const srqAttempts = await prisma.quizAttempt.findMany({
      where: {
        student_id: student.id,
        quiz: {
          type: "pretest",
          subject_id: null
        },
        completed_at: { not: null }
      },
      orderBy: { completed_at: "desc" }
    });

    const currentDate = new Date();
    const isCompletedThisMonth = srqAttempts.some(a => {
      if (!a.completed_at) return false;
      const d = new Date(a.completed_at);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    let mentalInsights = await prisma.mentalInsight.findMany({
      where: { student_id: student.id },
      orderBy: { created_at: "desc" }
    });

    // Auto-sync fallback: if student has completed SRQ-29/pretest but has no mental_insights record
    if (mentalInsights.length === 0 && (hasCompletedPretest || srqAttempts.length > 0) && student.mental_level) {
      const attemptDate = srqAttempts[0]?.completed_at ? new Date(srqAttempts[0].completed_at) : new Date();
      const period = `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, "0")}`;
      const newInsight = await prisma.mentalInsight.create({
        data: {
          student_id: student.id,
          period,
          mental_level: student.mental_level,
          module_progress: student.module_progress || 0,
          recommendations: student.risk_flag
            ? `Terindikasi: ${student.mental_level}.`
            : "Kondisi emosional dan psikologis sehat dan stabil."
        }
      });
      mentalInsights = [newInsight];
    }

    // Auto-award badges for any completed modules that haven't been awarded yet
    const completedProgressesList = await prisma.completedModule.findMany({
      where: {
        student_id: student.id
      },
      select: { module_id: true }
    });
    const completedModIdsList = completedProgressesList.map(m => m.module_id);

    if (completedModIdsList.length > 0) {
      const moduleBadges = await prisma.badge.findMany({
        where: {
          module_id: { in: completedModIdsList }
        }
      });

      for (const mb of moduleBadges) {
        const alreadyAwarded = student.student_badges.some(sb => sb.badge_id === mb.id);
        if (!alreadyAwarded) {
          try {
            await prisma.studentBadge.create({
              data: {
                student_id: student.id,
                badge_id: mb.id
              }
            });
          } catch (e) {}
        }
      }
    }

    const latestStudentBadges = await prisma.studentBadge.findMany({
      where: { student_id: student.id },
      include: { badge: true }
    });

    const allClasses = await prisma.schoolClass.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      success: true,
      hasCompletedPretest,
      student: {
        id: student.id,
        name: student.name,
        username: student.user.username,
        nis: student.nis,
        class_id: student.class_id,
        class_name: student.class.name,
        class_major: student.class.major,
        year: formatAcademicYear(student.class.created_at, student.class.academic_year),
        academicYear: `TA ${formatAcademicYear(student.class.created_at, student.class.academic_year)}`,
        class: student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name,
        avatar: student.avatar,
        literacy_level: student.literacy_level || "Beginner",
        mental_level: student.mental_level || "Sehat & Stabil",
        module_progress: student.module_progress,
        risk_flag: student.risk_flag
      },
      allClasses: allClasses.map(c => {
        const classYear = formatAcademicYear(c.created_at, c.academic_year);
        const fullClassName = c.major ? `${c.name} ${c.major}` : c.name;
        return {
          id: c.id,
          name: c.name,
          major: c.major,
          academic_year: c.academic_year || classYear,
          year: classYear,
          academicYear: `TA ${classYear}`,
          displayName: `${fullClassName} • TA ${classYear}`,
        };
      }),
      monthlyScreening: {
        isCompletedThisMonth,
        lastCompletedAt: srqAttempts[0]?.completed_at || null,
        history: mentalInsights.map(mi => ({
          id: mi.id,
          period: mi.period,
          mental_level: mi.mental_level,
          recommendations: mi.recommendations,
          created_at: mi.created_at
        }))
      },
      modules: [],
      completedModuleIds,
      moduleProgressMap,
      availableClasses,
      subjects: subjectsFormatted,
      grades: gradesFormatted,
      badges: {
        all: allBadges,
        unlocked: latestStudentBadges.map(sb => sb.badge)
      },
      journals: (student.mental_journals || []).map((j) => ({
        ...j,
        notes: decryptSensitiveText(j.notes),
        activities: decryptSensitiveText(j.activities),
        ai_feedback: decryptSensitiveText(j.ai_feedback),
      })),
      leaderboard: {
        rank: rank > 0 ? rank : 1,
        total: allStudents.length || 1
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan memuat data dashboard.",
      error: error.message
    }, { status: 500 });
  }
}
