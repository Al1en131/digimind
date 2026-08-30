import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

async function getTeacherFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const decoded = sessionToken ? verifyJWT(sessionToken) : null;

  if (!decoded || decoded.role !== "teacher") {
    return null;
  }

  return prisma.guru.findUnique({
    where: { user_id: decoded.userId },
  });
}

// POST/PUT: Create or update Subject Pretest Quiz
export async function POST(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher || teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola pretest mapel." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subjectId, title, questions } = body;

    if (!subjectId || !title || !title.trim() || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, message: "Subject ID, Judul Pretest, dan Soal wajib diisi." },
        { status: 400 }
      );
    }

    const subjIdInt = parseInt(subjectId);
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjIdInt,
        teacher_id: teacher.id,
      },
      include: {
        quizzes: {
          where: { type: "pretest" },
          include: { questions: { include: { options: true } } },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      let pretestQuiz = subject.quizzes.find((q) => q.type === "pretest");

      if (!pretestQuiz) {
        pretestQuiz = await tx.quiz.create({
          data: {
            title: title.trim(),
            type: "pretest",
            subject_id: subject.id,
            module_id: null,
          },
          include: { questions: { include: { options: true } } },
        });
      } else {
        await tx.quiz.update({
          where: { id: pretestQuiz.id },
          data: { title: title.trim() },
        });

        const existingQuestionIds = pretestQuiz.questions.map((q) => q.id);
        if (existingQuestionIds.length > 0) {
          await tx.option.deleteMany({
            where: { question_id: { in: existingQuestionIds } },
          });
          await tx.question.deleteMany({
            where: { quiz_id: pretestQuiz.id },
          });
        }
      }

      for (const q of questions) {
        if (!q.question || !q.options || !Array.isArray(q.options)) continue;

        const questionRecord = await tx.question.create({
          data: {
            quiz_id: pretestQuiz.id,
            question: q.question.trim(),
          },
        });

        for (const opt of q.options) {
          if (!opt.optionText) continue;

          await tx.option.create({
            data: {
              question_id: questionRecord.id,
              option_text: opt.optionText.trim(),
              is_correct: !!opt.isCorrect,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Kuis Pretest Mata Pelajaran berhasil disimpan!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan Pretest Mata Pelajaran.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete Subject Pretest Quiz
export async function DELETE(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher || teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola pretest mapel." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: "Subject ID wajib disertakan." },
        { status: 400 }
      );
    }

    const subjIdInt = parseInt(subjectId);
    const pretestQuiz = await prisma.quiz.findFirst({
      where: {
        subject_id: subjIdInt,
        type: "pretest",
        subject: { teacher_id: teacher.id },
      },
    });

    if (!pretestQuiz) {
      return NextResponse.json(
        { success: false, message: "Kuis pretest tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const attempts = await tx.quizAttempt.findMany({ where: { quiz_id: pretestQuiz.id }, select: { id: true } });
      const attemptIds = attempts.map((a) => a.id);
      if (attemptIds.length > 0) {
        await tx.answer.deleteMany({ where: { attempt_id: { in: attemptIds } } });
        await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
      }

      const questions = await tx.question.findMany({ where: { quiz_id: pretestQuiz.id }, select: { id: true } });
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length > 0) {
        await tx.option.deleteMany({ where: { question_id: { in: questionIds } } });
        await tx.question.deleteMany({ where: { id: { in: questionIds } } });
      }

      await tx.quiz.delete({ where: { id: pretestQuiz.id } });
    });

    return NextResponse.json({
      success: true,
      message: "Kuis Pretest Mata Pelajaran berhasil dihapus!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus Pretest Mata Pelajaran.", error: error.message },
      { status: 500 }
    );
  }
}
