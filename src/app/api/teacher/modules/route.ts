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

async function saveQuizInTx(
  tx: any,
  type: "pretest" | "posttest",
  title: string | undefined,
  questions: any[] | undefined,
  moduleId: number,
  subjectId: number,
  existingQuizzes: any[] = []
) {
  if (!title || !title.trim() || !questions || !Array.isArray(questions) || questions.length === 0) {
    return;
  }

  let quiz = existingQuizzes.find((q) => q.type === type);

  if (!quiz) {
    quiz = await tx.quiz.create({
      data: {
        title: title.trim(),
        type,
        module_id: moduleId,
        subject_id: subjectId,
      },
      include: { questions: { include: { options: true } } },
    });
  } else {
    await tx.quiz.update({
      where: { id: quiz.id },
      data: {
        title: title.trim(),
        subject_id: subjectId,
      },
    });

    const existingQuestionIds = quiz.questions?.map((q: any) => q.id) || [];
    if (existingQuestionIds.length > 0) {
      await tx.option.deleteMany({
        where: { question_id: { in: existingQuestionIds } },
      });
      await tx.question.deleteMany({
        where: { quiz_id: quiz.id },
      });
    }
  }

  for (const q of questions) {
    if (!q.question || !q.options || !Array.isArray(q.options)) continue;

    const questionRecord = await tx.question.create({
      data: {
        quiz_id: quiz.id,
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
}

// POST: Add module, pre-test, and post-test under a subject
export async function POST(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher || teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola modul." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      subjectId,
      title,
      content,
      videoUrl,
      mediaType,
      levelName,
      quizTitle,
      questions,
      pretestTitle,
      pretestQuestions,
    } = body;

    if (!subjectId || !title || !content) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran, Judul Modul, dan Konten wajib diisi." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: parseInt(subjectId),
        teacher_id: teacher.id,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    let category = await prisma.category.findUnique({
      where: { name: "Mata Pelajaran" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Mata Pelajaran" },
      });
    }

    const targetLevelName = levelName ? levelName.trim() : "Beginner";
    let level = await prisma.level.findFirst({
      where: { name: targetLevelName },
    });
    if (!level) {
      const allLevels = await prisma.level.findMany();
      level = allLevels.find(l => l.name.trim().toLowerCase() === targetLevelName.toLowerCase()) || null;
    }
    if (!level) {
      level = await prisma.level.create({
        data: { name: targetLevelName },
      });
    }

    const newModule = await prisma.$transaction(async (tx) => {
      const mod = await tx.module.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          video_url: videoUrl ? videoUrl.trim() : null,
          media_type: mediaType || "text",
          category_id: category.id,
          level_id: level.id,
          subject_id: subject.id,
        },
      });

      // Save Posttest if provided
      await saveQuizInTx(tx, "posttest", quizTitle, questions, mod.id, subject.id, []);

      return mod;
    });

    return NextResponse.json({
      success: true,
      message: "Modul mata pelajaran berhasil dibuat!",
      module: newModule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat modul.", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Edit module and post-test
export async function PUT(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher || teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola modul." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      moduleId,
      title,
      content,
      videoUrl,
      mediaType,
      levelName,
      quizTitle,
      questions,
    } = body;

    if (!moduleId || !title || !content) {
      return NextResponse.json(
        { success: false, message: "ID Modul, Judul Modul, dan Konten wajib diisi." },
        { status: 400 }
      );
    }

    const modIdInt = parseInt(moduleId);
    const targetModule = await prisma.module.findUnique({
      where: { id: modIdInt },
      include: {
        subject: true,
        quizzes: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!targetModule || targetModule.subject?.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, message: "Modul tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const targetLevelName = levelName ? levelName.trim() : "Beginner";
    let level = await prisma.level.findFirst({
      where: { name: targetLevelName },
    });
    if (!level) {
      const allLevels = await prisma.level.findMany();
      level = allLevels.find(l => l.name.trim().toLowerCase() === targetLevelName.toLowerCase()) || null;
    }
    if (!level) {
      level = await prisma.level.create({
        data: { name: targetLevelName },
      });
    }

    const updatedModule = await prisma.$transaction(async (tx) => {
      const mod = await tx.module.update({
        where: { id: modIdInt },
        data: {
          title: title.trim(),
          content: content.trim(),
          video_url: videoUrl ? videoUrl.trim() : null,
          media_type: mediaType || "text",
          level_id: level.id,
        },
      });

      // Save/Update Posttest
      await saveQuizInTx(
        tx,
        "posttest",
        quizTitle,
        questions,
        mod.id,
        targetModule.subject_id!,
        targetModule.quizzes
      );

      return mod;
    });

    return NextResponse.json({
      success: true,
      message: "Modul berhasil diperbarui!",
      module: updatedModule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui modul.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a module
export async function DELETE(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher || teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola modul." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID modul wajib disertakan." },
        { status: 400 }
      );
    }

    const modIdInt = parseInt(id);
    const targetModule = await prisma.module.findUnique({
      where: { id: modIdInt },
      include: { subject: true },
    });

    if (!targetModule || targetModule.subject?.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, message: "Modul tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.badge.deleteMany({ where: { module_id: modIdInt } });
      await tx.studentModuleProgress.deleteMany({ where: { module_id: modIdInt } });
      await tx.completedModule.deleteMany({ where: { module_id: modIdInt } });

      const quizzes = await tx.quiz.findMany({ where: { module_id: modIdInt }, select: { id: true } });
      const quizIds = quizzes.map((q) => q.id);

      if (quizIds.length > 0) {
        const attempts = await tx.quizAttempt.findMany({ where: { quiz_id: { in: quizIds } }, select: { id: true } });
        const attemptIds = attempts.map((a) => a.id);
        if (attemptIds.length > 0) {
          await tx.answer.deleteMany({ where: { attempt_id: { in: attemptIds } } });
          await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
        }

        const questions = await tx.question.findMany({ where: { quiz_id: { in: quizIds } }, select: { id: true } });
        const questionIds = questions.map((q) => q.id);
        if (questionIds.length > 0) {
          await tx.option.deleteMany({ where: { question_id: { in: questionIds } } });
          await tx.question.deleteMany({ where: { id: { in: questionIds } } });
        }
        await tx.quiz.deleteMany({ where: { id: { in: quizIds } } });
      }

      await tx.module.delete({ where: { id: modIdInt } });
    });

    return NextResponse.json({
      success: true,
      message: "Modul berhasil dihapus!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus modul.", error: error.message },
      { status: 500 }
    );
  }
}
