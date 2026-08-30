import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({
        success: false,
        message: "Parameter subjectId diperlukan."
      }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return NextResponse.json({
        success: false,
        message: "Mata pelajaran tidak ditemukan."
      }, { status: 404 });
    }

    let pretestQuiz = await prisma.quiz.findFirst({
      where: {
        subject_id: subject.id,
        type: "pretest"
      },
      include: {
        questions: {
          orderBy: { id: "asc" },
          include: {
            options: {
              select: {
                id: true,
                option_text: true
              },
              orderBy: { id: "asc" }
            }
          }
        }
      }
    });

    // If pretest quiz doesn't exist yet, auto-create a 10 question pretest for this subject
    if (!pretestQuiz) {
      pretestQuiz = await prisma.quiz.create({
        data: {
          title: `Pretest Penempatan Level: ${subject.name}`,
          type: "pretest",
          subject_id: subject.id,
          module_id: null
        },
        include: {
          questions: {
            include: {
              options: {
                select: {
                  id: true,
                  option_text: true
                }
              }
            }
          }
        }
      });

      for (let i = 1; i <= 10; i++) {
        const qObj = await prisma.question.create({
          data: {
            quiz_id: pretestQuiz.id,
            question: `[Pretest ${subject.name}] Soal ${i}: Manakah konsep utama yang paling tepat mengenai ${subject.name}?`
          }
        });

        await prisma.option.createMany({
          data: [
            { question_id: qObj.id, option_text: `A. Prinsip utama dan analisis mendalam tentang ${subject.name} (Tepat)`, is_correct: true },
            { question_id: qObj.id, option_text: `B. Penjelasan umum tanpa penerapan fakta`, is_correct: false },
            { question_id: qObj.id, option_text: `C. Pendapat sekilas yang kurang relevan`, is_correct: false },
            { question_id: qObj.id, option_text: `D. Pilihan yang tidak sesuai`, is_correct: false }
          ]
        });
      }

      // Re-fetch formatted quiz
      pretestQuiz = await prisma.quiz.findFirst({
        where: { id: pretestQuiz.id },
        include: {
          questions: {
            orderBy: { id: "asc" },
            include: {
              options: {
                select: {
                  id: true,
                  option_text: true
                },
                orderBy: { id: "asc" }
              }
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      quiz: pretestQuiz,
      subjectName: subject.name
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal mengambil pretest mata pelajaran.",
      error: error.message
    }, { status: 500 });
  }
}
