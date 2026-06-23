import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({
        success: false,
        message: "Akses ditolak."
      }, { status: 401 });
    }

    const student = await prisma.siswa.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        message: "Profil siswa tidak ditemukan."
      }, { status: 404 });
    }

    const { quizId, moduleId, answers } = await request.json(); // answers: [{ questionId, optionId }]

    if (!quizId || !moduleId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({
        success: false,
        message: "Data input tidak lengkap."
      }, { status: 400 });
    }

    const quizIdInt = parseInt(quizId);
    const moduleIdInt = parseInt(moduleId);

    // Fetch quiz questions
    const quizQuestions = await prisma.question.findMany({
      where: { quiz_id: quizIdInt },
      include: { options: true }
    });

    if (quizQuestions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Soal kuis tidak ditemukan."
      }, { status: 404 });
    }

    let correctCount = 0;
    const totalQuestions = quizQuestions.length;

    // Evaluate answers
    for (const q of quizQuestions) {
      const studentAns = answers.find(a => parseInt(a.questionId) === q.id);
      if (studentAns) {
        const selectedOption = q.options.find(o => o.id === parseInt(studentAns.optionId));
        if (selectedOption && selectedOption.is_correct) {
          correctCount++;
        }
      }
    }

    // Calculate score percentage
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    // Save quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        student_id: student.id,
        quiz_id: quizIdInt,
        score,
        completed_at: new Date()
      }
    });

    let progressPercent = student.module_progress;
    let badgeAwarded = null;

    if (passed) {
      // Mark module as completed
      await prisma.completedModule.upsert({
        where: {
          student_id_module_id: {
            student_id: student.id,
            module_id: moduleIdInt
          }
        },
        update: {},
        create: {
          student_id: student.id,
          module_id: moduleIdInt
        }
      });

      // Recalculate progress for student's current level
      const studentLevelName = student.literacy_level || "Beginner";
      const level = await prisma.level.findFirst({
        where: { name: studentLevelName }
      });

      if (level) {
        const levelModules = await prisma.module.findMany({
          where: { level_id: level.id }
        });
        const completedRecords = await prisma.completedModule.findMany({
          where: { student_id: student.id }
        });
        const completedIds = completedRecords.map(r => r.module_id);
        
        const totalModulesInLevel = levelModules.length;
        const completedInLevel = levelModules.filter(m => completedIds.includes(m.id)).length;
        
        progressPercent = totalModulesInLevel > 0 
          ? Math.round((completedInLevel / totalModulesInLevel) * 100) 
          : 0;

        await prisma.siswa.update({
          where: { id: student.id },
          data: { module_progress: progressPercent }
        });
      }

      // Award badge if applicable
      const targetModule = await prisma.module.findUnique({
        where: { id: moduleIdInt },
        include: { category: true }
      });

      if (targetModule) {
        const categoryName = targetModule.category.name.toLowerCase();
        
        if (categoryName.includes("literacy") || categoryName.includes("literasi")) {
          const factCheckerBadge = await prisma.badge.findUnique({
            where: { name: "Fact-Checker" }
          });
          if (factCheckerBadge) {
            const hasBadge = await prisma.studentBadge.findFirst({
              where: { student_id: student.id, badge_id: factCheckerBadge.id }
            });
            if (!hasBadge) {
              await prisma.studentBadge.create({
                data: { student_id: student.id, badge_id: factCheckerBadge.id }
              });
              badgeAwarded = factCheckerBadge.name;
            }
          }
        } else if (categoryName.includes("mental") || categoryName.includes("kesehatan")) {
          const screenGuardBadge = await prisma.badge.findUnique({
            where: { name: "Screen Guard" }
          });
          if (screenGuardBadge) {
            const hasBadge = await prisma.studentBadge.findFirst({
              where: { student_id: student.id, badge_id: screenGuardBadge.id }
            });
            if (!hasBadge) {
              await prisma.studentBadge.create({
                data: { student_id: student.id, badge_id: screenGuardBadge.id }
              });
              badgeAwarded = screenGuardBadge.name;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      attemptId: attempt.id,
      progressPercent,
      badgeAwarded
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal memproses posttest.",
      error: error.message
    }, { status: 500 });
  }
}
