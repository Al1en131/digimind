import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function GET() {
  try {
    // Check if user is logged in and has completed pretest
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (decoded && decoded.role === "student") {
      const student = await prisma.siswa.findUnique({
        where: { user_id: decoded.userId }
      });

      if (student) {
        const pretestAttempt = await prisma.quizAttempt.findFirst({
          where: {
            student_id: student.id,
            quiz: { type: "pretest" },
            completed_at: { not: null }
          }
        });

        if (pretestAttempt || student.literacy_level) {
          return NextResponse.json({
            success: true,
            hasCompletedPretest: true
          });
        }
      }
    }

    const pretestQuiz = await prisma.quiz.findFirst({
      where: {
        type: "pretest",
      },
      include: {
        questions: {
          orderBy: {
            id: "asc",
          },
          include: {
            options: {
              select: {
                id: true,
                option_text: true,
                // Do not return is_correct to prevent client-side inspection/cheating
              },
              orderBy: {
                id: "asc",
              },
            },
          },
        },
      },
    });

    if (!pretestQuiz) {
      return NextResponse.json({
        success: false,
        message: "Kuis pretest tidak ditemukan di sistem. Harap hubungi admin.",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quiz: pretestQuiz,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengambil kuis pretest.";
    return NextResponse.json({
      success: false,
      message: "Gagal mengambil kuis pretest.",
      error: errorMessage,
    }, { status: 500 });
  }
}
