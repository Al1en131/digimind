import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT, hashPassword } from "@/lib/auth-utils";

function parseScreenTime(activities: string | null | undefined): number {
  if (!activities) return 0;
  const match = activities.match(/(\d+(?:[.,]\d+)?)\s*(jam|hour|hrs|h)/i);
  if (!match) return 0;
  const number = Number(match[1].replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali sebagai admin." },
        { status: 401 }
      );
    }

    const [
      modules,
      quizzes,
      users,
      journals,
      students,
      categories,
      levels,
      classes,
      subjects,
      teachers,
      quizAttempts
    ] = await Promise.all([
      prisma.module.findMany({
        where: { subject_id: { not: null } },
        include: { category: true, level: true, subject: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.quiz.findMany({
        include: { module: true, questions: { include: { options: true } } },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.findMany({
        include: {
          admin: true,
          student: { include: { class: true } },
          teacher: { include: { class: true, subjects: true } }
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.mentalJournal.findMany({
        include: { student: { include: { class: true } } },
        orderBy: { logged_at: "desc" },
      }),
      prisma.siswa.findMany({
        include: {
          class: true,
          mental_journals: { orderBy: { logged_at: "desc" }, take: 5 },
          completed_modules: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.category.findMany(),
      prisma.level.findMany(),
      prisma.schoolClass.findMany({
        orderBy: { name: "asc" }
      }),
      prisma.subject.findMany({
        include: { class: true, teacher: true },
        orderBy: { name: "asc" }
      }),
      prisma.guru.findMany({
        include: {
          user: true,
          class: true,
          subjects: {
            include: { class: true }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.quizAttempt.findMany({
        include: {
          student: { include: { class: true } },
          quiz: { include: { module: true } },
          answers: { include: { question: true, option: true } }
        },
        orderBy: { completed_at: "desc" }
      })
    ]);

    const mentalHealthModules = await prisma.module.findMany({
      where: { category: { name: { contains: "Mental" } } },
      select: { id: true },
    });

    const mentalHealthModuleIds = new Set(mentalHealthModules.map((module) => module.id));

    const progress = students.map((student) => {
      const recentJournals = student.mental_journals || [];
      const textJournal = recentJournals[0];
      const latestMood = textJournal ? textJournal.mood_score : null;
      const averageMood = recentJournals.length > 0
        ? Math.round(recentJournals.reduce((sum, journal) => sum + journal.mood_score, 0) / recentJournals.length)
        : 0;
      const screenTime = parseScreenTime(textJournal?.activities ?? null);
      const completedMentalHealthModules = student.completed_modules.filter((completedModule) => mentalHealthModuleIds.has(completedModule.module_id)).length;
      const mentalHealthProgress = mentalHealthModules.length > 0
        ? Math.round((completedMentalHealthModules / mentalHealthModules.length) * 100)
        : 0;

      const hasRecentLowMood = (latestMood !== null && latestMood <= 2) || (recentJournals.length > 0 && averageMood <= 2);
      const hasHighScreenTime = screenTime > 7;
      const riskFlag = hasRecentLowMood || hasHighScreenTime || student.risk_flag === true;

      return {
        id: student.id,
        student: student.name,
        className: student.class ? (student.class.major ? `${student.class.name} ${student.class.major}` : student.class.name) : "-",
        classMajor: student.class?.major || "-",
        academicYear: student.class?.academic_year || "2025/2026",
        literacy: student.module_progress ?? 0,
        mental: mentalHealthProgress,
        risk: riskFlag ? (hasRecentLowMood ? "Perlu perhatian" : "Waspada") : "Stabil",
      };
    });

    const summary = {
      modules: modules.length,
      quizzes: quizzes.length,
      users: users.length,
      journals: journals.length,
      atRisk: progress.filter((item) => item.risk !== "Stabil").length,
    };

    const adminActors = users
      .filter((u) => u.role === "admin")
      .map((u) => {
        let perms: string[] = [];
        try {
          if (u.admin?.permissions) {
            perms = JSON.parse(u.admin.permissions);
          } else {
            perms = [
              "manage_users",
              "manage_teachers",
              "manage_academics",
              "manage_reports",
              "manage_roles",
              "manage_classes",
              "manage_subjects",
              "manage_modules",
              "manage_quizzes",
              "manage_pretest_screening",
              "manage_attempts",
              "manage_screening"
            ];
          }
        } catch {
          perms = [
            "manage_users",
            "manage_teachers",
            "manage_academics",
            "manage_reports",
            "manage_roles",
            "manage_classes",
            "manage_subjects",
            "manage_modules",
            "manage_quizzes",
            "manage_pretest_screening",
            "manage_attempts",
            "manage_screening"
          ];
        }

        return {
          id: u.id,
          admin_id: u.admin?.id,
          username: u.username,
          email: u.email,
          name: u.admin?.name || "Admin Sekolah",
          division: u.admin?.division || "Administrasi",
          unit: u.admin?.unit || "Utama",
          permissions: perms,
        };
      });

    return NextResponse.json({
      success: true,
      summary,
      adminActors,
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        content: module.content || "",
        video_url: module.video_url || "",
        category_id: module.category_id,
        level_id: module.level_id,
        subject_id: module.subject_id,
        category: module.category?.name || "-",
        level: module.level?.name || "-",
        subject: module.subject?.name || "-",
        status: "Aktif",
      })),
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        type: quiz.type,
        module_id: quiz.module_id,
        module: quiz.module?.title || "-",
        questions: quiz.questions || [],
        status: "Aktif",
      })),
      users: users.map((user) => ({
        id: user.id,
        name: user.student?.name || user.teacher?.name || user.admin?.name || user.username,
        role: user.role,
        username: user.username,
        email: user.email,
        status: "Aktif",
        nis: user.student?.nis || "",
        class_id: user.student?.class_id || user.teacher?.class_id || "",
        className: user.student?.class
          ? (user.student.class.major ? `${user.student.class.name} ${user.student.class.major}` : user.student.class.name)
          : user.teacher?.class
          ? (user.teacher.class.major ? `${user.teacher.class.name} ${user.teacher.class.major}` : user.teacher.class.name)
          : "",
        nip: user.teacher?.nip || "",
        phone_number: user.teacher?.phone_number || "",
        teacher_type: user.teacher?.type || "subject",
        specialization: user.teacher?.specialization || "",
        position: user.teacher?.position || "",
        division: user.admin?.division || "",
        unit: user.admin?.unit || "",
        subject_id: user.teacher?.subjects[0]?.id || "",
      })),
      journals: journals.map((journal) => ({
        id: journal.id,
        student: journal.student?.name || "-",
        className: journal.student?.class
          ? (journal.student.class.major ? `${journal.student.class.name} ${journal.student.class.major}` : journal.student.class.name)
          : "-",
        mood: journal.mood_score,
        note: journal.notes || "-",
        ai_feedback: journal.ai_feedback || "-",
        date: journal.logged_at ? new Date(journal.logged_at).toLocaleDateString("id-ID") : "-",
      })),
      progress,
      categories,
      levels,
      classes: classes.map((c) => ({
        ...c,
        displayName: c.major ? `${c.name} ${c.major}` : c.name,
        academicYear: c.academic_year || "2025/2026",
      })),
      subjects,
      teachers,
      quizAttempts: quizAttempts.map(attempt => ({
        id: attempt.id,
        studentName: attempt.student?.name || "-",
        className: attempt.student?.class
          ? (attempt.student.class.major ? `${attempt.student.class.name} ${attempt.student.class.major}` : attempt.student.class.name)
          : "-",
        quizTitle: attempt.quiz?.title || "-",
        quizType: attempt.quiz?.type || "-",
        score: attempt.score || 0,
        completedAt: attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-",
        answers: attempt.answers.map(ans => ({
          question: ans.question?.question || "-",
          selectedOption: ans.option?.option_text || "-",
          isCorrect: !!ans.option?.is_correct
        }))
      })),
      screeningAttempts: quizAttempts
        .filter((a) => {
          const titleLower = (a.quiz?.title || "").toLowerCase();
          return (
            a.quiz?.type === "pretest" &&
            (!a.quiz?.subject_id || titleLower.includes("srq") || titleLower.includes("screening") || titleLower.includes("mental"))
          );
        })
        .map((attempt) => {
          const yesCountFromAnswers = attempt.answers.filter((ans) =>
            ans.option?.option_text?.toUpperCase().includes("Y")
          ).length;
          const displayScore =
            attempt.score === 100 && yesCountFromAnswers <= 29
              ? yesCountFromAnswers
              : attempt.score ?? yesCountFromAnswers;

          return {
            id: attempt.id,
            studentName: attempt.student?.name || "-",
            className: attempt.student?.class
              ? (attempt.student.class.major ? `${attempt.student.class.name} ${attempt.student.class.major}` : attempt.student.class.name)
              : "-",
            quizTitle: attempt.quiz?.title || "Self Reporting Questionnaire - 29 (SRQ-29)",
            quizType: "SCREENING",
            score: displayScore,
            completedAt: attempt.completed_at
              ? new Date(attempt.completed_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            answers: attempt.answers.map((ans) => ({
              question: ans.question?.question || "-",
              selectedOption: ans.option?.option_text || "-",
              isCorrect: !!ans.option?.is_correct,
            })),
          };
        })
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat dashboard admin.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const { action, entity, data } = await request.json();

    if (!action || !entity || !data) {
      return NextResponse.json({ success: false, message: "Parameter tidak lengkap." }, { status: 400 });
    }

    // CRUD: MODULE
    if (entity === "module") {
      if (action === "create") {
        const mod = await prisma.module.create({
          data: {
            title: data.title,
            content: data.content,
            video_url: data.video_url,
            category_id: parseInt(data.category_id),
            level_id: parseInt(data.level_id),
            subject_id: data.subject_id ? parseInt(data.subject_id) : null
          }
        });
        return NextResponse.json({ success: true, message: "Modul berhasil ditambahkan!", module: mod });
      }
      if (action === "update") {
        const mod = await prisma.module.update({
          where: { id: parseInt(data.id) },
          data: {
            title: data.title,
            content: data.content,
            video_url: data.video_url,
            category_id: parseInt(data.category_id),
            level_id: parseInt(data.level_id),
            subject_id: data.subject_id ? parseInt(data.subject_id) : null
          }
        });
        return NextResponse.json({ success: true, message: "Modul berhasil diperbarui!", module: mod });
      }
      if (action === "delete") {
        const modIdInt = parseInt(data.id);
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
              const options = await tx.option.findMany({ where: { question_id: { in: questionIds } }, select: { id: true } });
              const optionIds = options.map((o) => o.id);
              if (optionIds.length > 0) {
                await tx.answer.deleteMany({ where: { option_id: { in: optionIds } } });
              }
              await tx.option.deleteMany({ where: { question_id: { in: questionIds } } });
              await tx.question.deleteMany({ where: { id: { in: questionIds } } });
            }
            await tx.quiz.deleteMany({ where: { id: { in: quizIds } } });
          }

          await tx.module.delete({ where: { id: modIdInt } });
        });
        return NextResponse.json({ success: true, message: "Modul berhasil dihapus!" });
      }
    }

    // CRUD: QUIZ
    if (entity === "quiz") {
      if (action === "create") {
        const q = await prisma.quiz.create({
          data: {
            title: data.title,
            type: data.type,
            module_id: data.module_id ? parseInt(data.module_id) : null
          }
        });
        return NextResponse.json({ success: true, message: "Kuis berhasil ditambahkan!", quiz: q });
      }
      if (action === "update") {
        const q = await prisma.quiz.update({
          where: { id: parseInt(data.id) },
          data: {
            title: data.title,
            type: data.type,
            module_id: data.module_id ? parseInt(data.module_id) : null
          }
        });
        return NextResponse.json({ success: true, message: "Kuis berhasil diperbarui!", quiz: q });
      }
      if (action === "delete") {
        const quizId = parseInt(data.id);
        const questions = await prisma.question.findMany({ where: { quiz_id: quizId }, select: { id: true } });
        const questionIds = questions.map(q => q.id);
        if (questionIds.length > 0) {
          const options = await prisma.option.findMany({ where: { question_id: { in: questionIds } }, select: { id: true } });
          const optionIds = options.map(o => o.id);
          if (optionIds.length > 0) {
            await prisma.answer.deleteMany({ where: { option_id: { in: optionIds } } });
            await prisma.option.deleteMany({ where: { question_id: { in: questionIds } } });
          }
          await prisma.answer.deleteMany({ where: { question_id: { in: questionIds } } });
          await prisma.question.deleteMany({ where: { quiz_id: quizId } });
        }
        await prisma.quizAttempt.deleteMany({ where: { quiz_id: quizId } });
        await prisma.quiz.delete({ where: { id: quizId } });
        return NextResponse.json({ success: true, message: "Kuis berhasil dihapus!" });
      }
    }

    // CRUD: QUIZ QUESTION
    if (entity === "question") {
      if (action === "create") {
        const question = await prisma.question.create({
          data: {
            quiz_id: parseInt(data.quiz_id),
            question: data.question,
            options: {
              create: data.options.map((opt: any) => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct
              }))
            }
          }
        });
        return NextResponse.json({ success: true, message: "Pertanyaan berhasil ditambahkan!", question });
      }
      if (action === "bulk-create") {
        const quizId = parseInt(data.quiz_id);
        const questionsList = Array.isArray(data.questions) ? data.questions : [];
        if (questionsList.length === 0) {
          return NextResponse.json({ success: false, message: "Daftar soal kosong." }, { status: 400 });
        }
        for (const item of questionsList) {
          await prisma.question.create({
            data: {
              quiz_id: quizId,
              question: item.question,
              options: {
                create: item.options.map((opt: any) => ({
                  option_text: typeof opt === "string" ? opt : opt.option_text,
                  is_correct: typeof opt === "string" ? false : Boolean(opt.is_correct)
                }))
              }
            }
          });
        }
        return NextResponse.json({ success: true, message: `${questionsList.length} soal berhasil disimpan ke kuis!` });
      }
      if (action === "update") {
        const questionId = parseInt(data.id);
        const existingOptions = await prisma.option.findMany({ where: { question_id: questionId }, select: { id: true } });
        const optionIds = existingOptions.map(o => o.id);
        if (optionIds.length > 0) {
          await prisma.answer.deleteMany({ where: { option_id: { in: optionIds } } });
          await prisma.option.deleteMany({ where: { question_id: questionId } });
        }
        await prisma.answer.deleteMany({ where: { question_id: questionId } });

        const question = await prisma.question.update({
          where: { id: questionId },
          data: {
            question: data.question,
            options: {
              create: data.options.map((opt: any) => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct
              }))
            }
          }
        });
        return NextResponse.json({ success: true, message: "Pertanyaan berhasil diperbarui!", question });
      }
      if (action === "delete") {
        const questionId = parseInt(data.id);
        const existingOptions = await prisma.option.findMany({ where: { question_id: questionId }, select: { id: true } });
        const optionIds = existingOptions.map(o => o.id);
        if (optionIds.length > 0) {
          await prisma.answer.deleteMany({ where: { option_id: { in: optionIds } } });
          await prisma.option.deleteMany({ where: { question_id: questionId } });
        }
        await prisma.answer.deleteMany({ where: { question_id: questionId } });
        await prisma.question.delete({ where: { id: questionId } });
        return NextResponse.json({ success: true, message: "Pertanyaan berhasil dihapus!" });
      }
    }

    // CRUD: USER
    if (entity === "user") {
      if (action === "create") {
        const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
        if (existingUsername) return NextResponse.json({ success: false, message: "Username sudah digunakan." }, { status: 400 });

        const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) return NextResponse.json({ success: false, message: "Email sudah digunakan." }, { status: 400 });

        const newUser = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              username: data.username,
              email: data.email,
              password: hashPassword(data.password),
              role: data.role
            }
          });

          if (data.role === "student") {
            await tx.siswa.create({
              data: {
                user_id: user.id,
                name: data.name,
                nis: data.nis,
                class_id: parseInt(data.class_id)
              }
            });
          } else if (data.role === "teacher") {
            const teacher = await tx.guru.create({
              data: {
                user_id: user.id,
                name: data.name,
                nip: data.nip,
                phone_number: data.phone_number || null,
                type: data.teacher_type === "bk" ? "bk" : data.teacher_type === "wali_kelas" ? "wali_kelas" : "subject",
                class_id: data.class_id ? parseInt(data.class_id) : null,
                specialization: data.specialization || null,
                position: data.position || (data.teacher_type === "bk" ? "Guru Bimbingan Konseling" : data.teacher_type === "wali_kelas" ? "Wali Kelas" : "Guru Mata Pelajaran")
              }
            });

            if (data.teacher_type === "subject" && data.subject_id) {
              await tx.subject.update({
                where: { id: parseInt(data.subject_id) },
                data: { teacher_id: teacher.id }
              });
            }
          } else if (data.role === "admin") {
            await tx.admin.create({
              data: {
                user_id: user.id,
                name: data.name,
                division: data.division || null,
                unit: data.unit || null
              }
            });
          }
          return user;
        });

        return NextResponse.json({ success: true, message: "User berhasil dibuat!", user: newUser });
      }

      if (action === "update") {
        await prisma.$transaction(async (tx) => {
          const updateData: any = {
            email: data.email,
            username: data.username
          };
          if (data.password) {
            updateData.password = hashPassword(data.password);
          }

          await tx.user.update({
            where: { id: parseInt(data.id) },
            data: updateData
          });

          if (data.role === "student") {
            await tx.siswa.upsert({
              where: { user_id: parseInt(data.id) },
              update: {
                name: data.name,
                nis: data.nis,
                class_id: parseInt(data.class_id)
              },
              create: {
                user_id: parseInt(data.id),
                name: data.name,
                nis: data.nis,
                class_id: parseInt(data.class_id)
              }
            });
          } else if (data.role === "teacher") {
            const teacher = await tx.guru.upsert({
              where: { user_id: parseInt(data.id) },
              update: {
                name: data.name,
                nip: data.nip,
                phone_number: data.phone_number || null,
                type: data.teacher_type === "bk" ? "bk" : data.teacher_type === "wali_kelas" ? "wali_kelas" : "subject",
                class_id: data.class_id ? parseInt(data.class_id) : null,
                specialization: data.specialization || null,
                position: data.position || null
              },
              create: {
                user_id: parseInt(data.id),
                name: data.name,
                nip: data.nip,
                phone_number: data.phone_number || null,
                type: data.teacher_type === "bk" ? "bk" : data.teacher_type === "wali_kelas" ? "wali_kelas" : "subject",
                class_id: data.class_id ? parseInt(data.class_id) : null,
                specialization: data.specialization || null,
                position: data.position || null
              }
            });

            if (data.teacher_type === "subject" && data.subject_id) {
              await tx.subject.update({
                where: { id: parseInt(data.subject_id) },
                data: { teacher_id: teacher.id }
              });
            }
          } else if (data.role === "admin") {
            await tx.admin.upsert({
              where: { user_id: parseInt(data.id) },
              update: {
                name: data.name,
                division: data.division || null,
                unit: data.unit || null
              },
              create: {
                user_id: parseInt(data.id),
                name: data.name,
                division: data.division || null,
                unit: data.unit || null
              }
            });
          }
        });

        return NextResponse.json({ success: true, message: "User berhasil diperbarui!" });
      }

      if (action === "delete") {
        await prisma.user.delete({ where: { id: parseInt(data.id) } });
        return NextResponse.json({ success: true, message: "User berhasil dihapus!" });
      }
    }

    // CRUD: CLASS
    if (entity === "class") {
      if (action === "create") {
        const cls = await prisma.schoolClass.create({
          data: {
            name: data.name,
            major: data.major || "Umum",
            academic_year: data.academic_year || data.year || "2025/2026"
          }
        });
        return NextResponse.json({ success: true, message: "Kelas berhasil ditambahkan!", class: cls });
      }
      if (action === "update") {
        const cls = await prisma.schoolClass.update({
          where: { id: parseInt(data.id) },
          data: {
            name: data.name,
            major: data.major,
            academic_year: data.academic_year || data.year || undefined
          }
        });
        return NextResponse.json({ success: true, message: "Kelas berhasil diperbarui!", class: cls });
      }
      if (action === "delete") {
        await prisma.schoolClass.delete({ where: { id: parseInt(data.id) } });
        return NextResponse.json({ success: true, message: "Kelas berhasil dihapus!" });
      }
    }

    // CRUD: SUBJECT
    if (entity === "subject") {
      const parsedTeacherId = (data.teacher_id && !isNaN(parseInt(data.teacher_id)) && parseInt(data.teacher_id) > 0)
        ? parseInt(data.teacher_id)
        : null;

      if (action === "create") {
        const sub = await prisma.subject.create({
          data: {
            name: data.name,
            class_id: parseInt(data.class_id),
            teacher_id: parsedTeacherId
          }
        });
        return NextResponse.json({ success: true, message: "Mata pelajaran berhasil ditambahkan!", subject: sub });
      }
      if (action === "update") {
        const sub = await prisma.subject.update({
          where: { id: parseInt(data.id) },
          data: {
            name: data.name,
            class_id: parseInt(data.class_id),
            teacher_id: parsedTeacherId
          }
        });
        return NextResponse.json({ success: true, message: "Mata pelajaran berhasil diperbarui!", subject: sub });
      }
      if (action === "delete") {
        await prisma.subject.delete({ where: { id: parseInt(data.id) } });
        return NextResponse.json({ success: true, message: "Mata pelajaran berhasil dihapus!" });
      }
    }

    // CRUD: TEACHER (Guru & Multi-Subject/Class Assignment)
    if (entity === "teacher") {
      if (action === "update" || action === "assign_subjects") {
        await prisma.$transaction(async (tx) => {
          const guruId = parseInt(data.id);

          // 1. Update Guru profile
          await tx.guru.update({
            where: { id: guruId },
            data: {
              name: data.name,
              nip: data.nip || "",
              phone_number: data.phone_number || "",
              type: data.type || "subject",
              specialization: data.specialization || "",
              position: data.position || "",
              class_id: data.class_id ? parseInt(data.class_id) : null,
            }
          });

          // 2. Update multi-subject assignment if subject_ids array provided
          if (Array.isArray(data.subject_ids)) {
            const targetSubjectIds = data.subject_ids.map((id: any) => parseInt(id)).filter(Boolean);

            // Unassign current subjects for this teacher
            await tx.subject.updateMany({
              where: { teacher_id: guruId },
              data: { teacher_id: null }
            });

            // Assign new subjects
            if (targetSubjectIds.length > 0) {
              await tx.subject.updateMany({
                where: { id: { in: targetSubjectIds } },
                data: { teacher_id: guruId }
              });
            }
          }
        });

        return NextResponse.json({ success: true, message: "Data & pengampuan Guru berhasil diperbarui!" });
      }
    }

    // CRUD: ADMIN ACTOR & PERMISSIONS (RBAC)
    if (entity === "admin_actor") {
      if (action === "create") {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [{ username: data.username }, { email: data.email }]
          }
        });
        if (existing) {
          return NextResponse.json({ success: false, message: "Username atau Email sudah terdaftar." }, { status: 400 });
        }

        const permsJson = JSON.stringify(Array.isArray(data.permissions) ? data.permissions : []);

        const newUser = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              username: data.username,
              email: data.email,
              password: hashPassword(data.password || "admin123"),
              role: "admin"
            }
          });

          await tx.admin.create({
            data: {
              user_id: user.id,
              name: data.name,
              division: data.division || "Administrasi Sekolah",
              unit: data.unit || "Utama",
              permissions: permsJson
            }
          });

          return user;
        });

        return NextResponse.json({ success: true, message: "Aktor Admin baru & Hak Akses berhasil dibuat!", user: newUser });
      }

      if (action === "update") {
        const userId = parseInt(data.id);
        const permsJson = JSON.stringify(Array.isArray(data.permissions) ? data.permissions : []);

        await prisma.$transaction(async (tx) => {
          const updateUserData: any = {
            username: data.username,
            email: data.email
          };
          if (data.password && data.password.trim() !== "") {
            updateUserData.password = hashPassword(data.password.trim());
          }

          await tx.user.update({
            where: { id: userId },
            data: updateUserData
          });

          const adminProfile = await tx.admin.findUnique({ where: { user_id: userId } });
          if (adminProfile) {
            await tx.admin.update({
              where: { user_id: userId },
              data: {
                name: data.name,
                division: data.division,
                unit: data.unit,
                permissions: permsJson
              }
            });
          } else {
            await tx.admin.create({
              data: {
                user_id: userId,
                name: data.name,
                division: data.division,
                unit: data.unit,
                permissions: permsJson
              }
            });
          }
        });

        return NextResponse.json({ success: true, message: "Aktor Admin & Hak Akses berhasil diperbarui!" });
      }

      if (action === "delete") {
        const userId = parseInt(data.id);
        const userCount = await prisma.user.count({ where: { role: "admin" } });
        if (userCount <= 1) {
          return NextResponse.json({ success: false, message: "Tidak dapat menghapus Superadmin terakhir!" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true, message: "Aktor Admin berhasil dihapus!" });
      }
    }

    return NextResponse.json({ success: false, message: "Entitas atau aksi tidak valid." }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memproses permintaan CRUD admin.", error: error.message },
      { status: 500 }
    );
  }
}
