import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

// POST: Add module and post-test under a subject
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali." },
        { status: 401 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Profil guru tidak ditemukan." },
        { status: 404 }
      );
    }

    if (teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola modul mata pelajaran." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subjectId, title, content, videoUrl, mediaType, quizTitle, questions } = body;

    if (!subjectId || !title || !content) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran, Judul Modul, dan Konten wajib diisi." },
        { status: 400 }
      );
    }

    // Verify subject exists and is taught by this teacher
    const subject = await prisma.subject.findFirst({
      where: {
        id: parseInt(subjectId),
        teacher_id: teacher.id
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    // Find or create Category "Mata Pelajaran"
    let category = await prisma.category.findUnique({
      where: { name: "Mata Pelajaran" }
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Mata Pelajaran" }
      });
    }

    // Find or create a default Level for subject modules (we can use the first available or default "General")
    let level = await prisma.level.findFirst();
    if (!level) {
      level = await prisma.level.create({
        data: { name: "General" }
      });
    }

    // Create the module and quiz in a transaction
    const newModule = await prisma.$transaction(async (tx) => {
      // 1. Create the module
      const mod = await tx.module.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          video_url: videoUrl ? videoUrl.trim() : null,
          media_type: mediaType || "text",
          category_id: category.id,
          level_id: level.id,
          subject_id: subject.id
        }
      });

      // 2. Create the post-test quiz if requested
      if (quizTitle && questions && Array.isArray(questions) && questions.length > 0) {
        const quiz = await tx.quiz.create({
          data: {
            title: quizTitle.trim(),
            type: "posttest",
            module_id: mod.id
          }
        });

        // 3. Create questions and options
        for (const q of questions) {
          if (!q.question || !q.options || !Array.isArray(q.options)) continue;

          const questionRecord = await tx.question.create({
            data: {
              quiz_id: quiz.id,
              question: q.question.trim()
            }
          });

          for (const opt of q.options) {
            if (!opt.optionText) continue;

            await tx.option.create({
              data: {
                question_id: questionRecord.id,
                option_text: opt.optionText.trim(),
                is_correct: !!opt.isCorrect
              }
            });
          }
        }
      }

      return mod;
    });

    return NextResponse.json({
      success: true,
      message: "Modul mata pelajaran berhasil dibuat!",
      module: newModule
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat modul.", error: error.message },
      { status: 500 }
    );
  }
}
