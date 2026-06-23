import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moduleId = parseInt(id);

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

    // Fetch the module
    const targetModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        category: true,
        level: true
      }
    });

    if (!targetModule) {
      return NextResponse.json({
        success: false,
        message: "Modul tidak ditemukan."
      }, { status: 404 });
    }

    // Check if student completed this module
    const completedRecord = await prisma.completedModule.findFirst({
      where: {
        student_id: student.id,
        module_id: moduleId
      }
    });

    // Find the posttest quiz for this module
    const quiz = await prisma.quiz.findFirst({
      where: {
        module_id: moduleId,
        type: "posttest"
      },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                option_text: true
                // Do NOT return is_correct to the client to prevent cheating!
              }
            }
          }
        }
      }
    });

    // Check for student's previous quiz attempts on this posttest
    let highestScore = null;
    let attemptsCount = 0;
    if (quiz) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          student_id: student.id,
          quiz_id: quiz.id
        },
        orderBy: { score: "desc" }
      });
      attemptsCount = attempts.length;
      if (attempts.length > 0) {
        highestScore = attempts[0].score;
      }
    }

    return NextResponse.json({
      success: true,
      module: {
        id: targetModule.id,
        title: targetModule.title,
        content: targetModule.content,
        video_url: targetModule.video_url,
        media_type: targetModule.media_type,
        category: targetModule.category.name,
        level: targetModule.level.name
      },
      isCompleted: !!completedRecord,
      completedAt: completedRecord?.completed_at || null,
      quiz: quiz ? {
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions
      } : null,
      highestScore,
      attemptsCount
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal memuat modul.",
      error: error.message
    }, { status: 500 });
  }
}
