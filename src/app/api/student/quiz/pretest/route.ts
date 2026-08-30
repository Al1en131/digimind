import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

const srqQuestions = [
  "Apakah anda sering merasa sakit kepala?",
  "Apakah anda kehilangan nafsu makan?",
  "Apakah tidur anda tidak nyenyak?",
  "Apakah anda mudah merasa takut?",
  "Apakah anda merasa cemas, tegang, atau khawatir?",
  "Apakah tangan anda gemetar?",
  "Apakah anda mengalami gangguan pencernaan?",
  "Apakah anda merasa sulit berpikir jernih?",
  "Apakah anda merasa tidak bahagia?",
  "Apakah anda lebih sering menangis?",
  "Apakah anda merasa sulit untuk menikmati aktivitas sehari-hari?",
  "Apakah anda mengalami kesulitan untuk mengambil keputusan?",
  "Apakah aktivitas/ tugas sehari-hari anda terbengkalai?",
  "Apakah anda merasa tidak mampu berperan dalam kehidupan ini?",
  "Apakah anda kehilangan minat terhadap banyak hal?",
  "Apakah anda merasa tidak berharga?",
  "Apakah anda mempunyai pikiran untuk mengakhiri hidup anda?",
  "Apakah anda merasa lelah sepanjang waktu?",
  "Apakah anda merasa tidak enak di perut?",
  "Apakah anda mudah lelah?",
  "Apakah anda minum alkohol lebih banyak dari biasanya atau apakah anda menggunakan narkoba?",
  "Apakah anda yakin bahwa seseorang mencoba mencelakai anda dengan cara tertentu?",
  "Apakah ada yang mengganggu atau hal yang tidak biasa dalam pikiran anda?",
  "Apakah anda pernah mendengar suara tanpa tahu sumbernya atau yang orang lain tidak dapat mendengar?",
  "Apakah anda mengalami mimpi yang mengganggu tentang suatu bencana/ musibah atau adakah saat-saat anda seolah mengalami kembali kejadian bencana itu?",
  "Apakah anda menghindari kegiatan, tempat, orang atau pikiran yang mengingatkan anda akan bencana tersebut?",
  "Apakah minat anda terhadap teman dan kegiatan yang biasa anda lakukan berkurang?",
  "Apakah anda merasa sangat terganggu jika berada dalam situasi yang mengingatkan anda akan bencana atau jika anda berpikir tentang bencana itu?",
  "Apakah anda kesulitan memahami atau mengekspresikan perasaan anda?"
];

async function createSRQPretestQuiz() {
  const srqQuizTitle = "Self Reporting Questionnaire - 29 (SRQ-29)";
  
  // Clean up any old pretest without subject_id
  const oldPretests = await prisma.quiz.findMany({
    where: { type: "pretest", subject_id: null }
  });
  for (const op of oldPretests) {
    await prisma.quiz.delete({ where: { id: op.id } }).catch(() => {});
  }

  const pretestQuiz = await prisma.quiz.create({
    data: {
      title: srqQuizTitle,
      type: "pretest",
      module_id: null,
      subject_id: null
    }
  });

  for (let i = 0; i < srqQuestions.length; i++) {
    const qText = srqQuestions[i];
    const questionObj = await prisma.question.create({
      data: {
        quiz_id: pretestQuiz.id,
        question: `No ${i + 1}. ${qText}`
      }
    });

    await prisma.option.createMany({
      data: [
        { question_id: questionObj.id, option_text: "Y (YA)", is_correct: true },
        { question_id: questionObj.id, option_text: "T (TIDAK)", is_correct: false }
      ]
    });
  }

  return await prisma.quiz.findUnique({
    where: { id: pretestQuiz.id },
    include: {
      questions: {
        orderBy: { id: "asc" },
        include: {
          options: {
            select: {
              id: true,
              option_text: true,
            },
            orderBy: { id: "asc" }
          }
        }
      }
    }
  });
}

export async function GET() {
  try {
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
            quiz: { type: "pretest", subject_id: null },
            completed_at: { not: null }
          }
        });

        if (pretestAttempt) {
          return NextResponse.json({
            success: true,
            hasCompletedPretest: true
          });
        }
      }
    }

    let pretestQuiz = await prisma.quiz.findFirst({
      where: {
        type: "pretest",
        subject_id: null,
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
              },
              orderBy: {
                id: "asc",
              },
            },
          },
        },
      },
    });

    // If pretest quiz is missing or has less than 29 questions, auto-create/reseed SRQ-29
    if (!pretestQuiz || pretestQuiz.questions.length < 29) {
      pretestQuiz = await createSRQPretestQuiz();
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
