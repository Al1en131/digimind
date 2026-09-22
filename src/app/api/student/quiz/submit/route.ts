import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    // 1. Authenticate student session
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
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        message: "Profil siswa tidak ditemukan."
      }, { status: 404 });
    }

    // 2. Parse request body
    const { quizId, answers } = await request.json(); // answers: [{ questionId, optionId }]
    if (!quizId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Data jawaban kuis tidak valid."
      }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({
        success: false,
        message: "Kuis tidak ditemukan."
      }, { status: 404 });
    }

    // 3. Process Quiz Attempt
    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          student_id: student.id,
          quiz_id: quiz.id,
          score: 0,
        }
      });

      // Fetch all valid option IDs for this quiz questions to verify foreign keys
      const validOptionIds = new Set(
        quiz.questions.flatMap(q => q.options.map(o => o.id))
      );

      // Save answer records safely
      for (const ans of answers) {
        const optId = parseInt(ans.optionId);
        const qId = parseInt(ans.questionId);

        if (!optId || !validOptionIds.has(optId)) continue;

        await tx.answer.create({
          data: {
            attempt_id: attempt.id,
            question_id: qId,
            option_id: optId,
          }
        }).catch((err) => {
          console.warn("Skipping invalid answer record:", err.message);
        });
      }

      // CASE A: INITIAL PRETEST SRQ-29
      if (!quiz.subject_id && !quiz.module_id) {
        let yesCount1_20 = 0;
        let yesQ21 = false;
        let yesCount22_24 = 0;
        let yesCount25_29 = 0;

        // Map answers by question order / index
        for (let i = 0; i < quiz.questions.length; i++) {
          const q = quiz.questions[i];
          const ans = answers.find((a: any) => parseInt(a.questionId) === q.id);
          if (!ans) continue;

          const selectedOption = q.options.find((o) => o.id === parseInt(ans.optionId));
          const isYes = selectedOption?.option_text.toUpperCase().includes("Y");

          const qNum = i + 1; // 1-indexed question number
          if (isYes) {
            if (qNum >= 1 && qNum <= 20) yesCount1_20++;
            else if (qNum === 21) yesQ21 = true;
            else if (qNum >= 22 && qNum <= 24) yesCount22_24++;
            else if (qNum >= 25 && qNum <= 29) yesCount25_29++;
          }
        }

        const emotionalDistress = yesCount1_20 >= 5;
        const psychoticSymptoms = yesCount22_24 >= 1;
        const ptsdSymptoms = yesCount25_29 >= 1;

        const findings: string[] = [];
        if (emotionalDistress) findings.push("Gangguan Mental Emosional (Cemas/Depresi)");
        if (yesQ21) findings.push("Penggunaan Zat Psikoaktif / Narkoba");
        if (psychoticSymptoms) findings.push("Gejala Gangguan Psikotik");
        if (ptsdSymptoms) findings.push("Gejala Gangguan PTSD");

        const riskFlag = findings.length > 0;
        const rawMentalLevel = riskFlag ? findings.join(", ") : "Sehat & Stabil";
        const mentalLevel = rawMentalLevel.slice(0, 250); // Ensure string does not exceed 255 chars
        const literacyLevel = "Beginner"; // Starting literacy level

        const totalYesCount = yesCount1_20 + (yesQ21 ? 1 : 0) + yesCount22_24 + yesCount25_29;

        await tx.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            score: totalYesCount,
            completed_at: new Date()
          }
        });

        await tx.siswa.update({
          where: { id: student.id },
          data: {
            literacy_level: literacyLevel,
            mental_level: mentalLevel,
            adaptive_mental: findings.join(", ").slice(0, 250),
            risk_flag: riskFlag
          }
        });

        // Save historical record to mental_insights per monthly period (YYYY-MM)
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await tx.mentalInsight.create({
          data: {
            student_id: student.id,
            period: currentPeriod,
            mental_level: mentalLevel,
            module_progress: student.module_progress || 0,
            recommendations: findings.length > 0
              ? `Terindikasi: ${findings.join("; ")}.`
              : "Kondisi emosional dan psikologis sehat dan stabil."
          }
        });

        return {
          isSubjectPretest: false,
          score: totalYesCount,
          literacyLevel,
          mentalLevel,
          riskFlag,
          findings,
          summaryText: riskFlag
            ? `Hasil SRQ-29 menunjukkan indikasi: ${findings.join("; ")}.`
            : "Hasil SRQ-29 menunjukkan kondisi emosional dan mental Anda dalam keadaan sehat dan stabil."
        };
      }

      // CASE B: SUBJECT PRETEST
      if (quiz.subject_id) {
        let correctCount = 0;
        const totalQ = quiz.questions.length;

        for (const q of quiz.questions) {
          const ans = answers.find((a: any) => parseInt(a.questionId) === q.id);
          if (!ans) continue;
          const selectedOption = q.options.find((o) => o.id === parseInt(ans.optionId));
          if (selectedOption?.is_correct) {
            correctCount++;
          }
        }

        const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

        let subjectLevel = "Beginner";
        if (score >= 75) subjectLevel = "Advanced";
        else if (score >= 45) subjectLevel = "Intermediate";

        await tx.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            score,
            completed_at: new Date()
          }
        });

        await tx.studentSubjectLevel.upsert({
          where: {
            student_id_subject_id: {
              student_id: student.id,
              subject_id: quiz.subject_id
            }
          },
          update: {
            level_name: subjectLevel,
            score
          },
          create: {
            student_id: student.id,
            subject_id: quiz.subject_id,
            level_name: subjectLevel,
            score
          }
        });

        return {
          isSubjectPretest: true,
          subjectId: quiz.subject_id,
          score,
          subjectLevel,
          summaryText: `Pretest selesai! Penempatan level Anda pada mata pelajaran ini adalah ${subjectLevel} (${score}%).`
        };
      }

      return {
        isSubjectPretest: false,
        score: 100,
        summaryText: "Kuis berhasil diselesaikan."
      };
    });

    return NextResponse.json({
      success: true,
      message: "Jawaban berhasil disimpan!",
      result
    });

  } catch (error: any) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan sistem saat mengirim kuis.",
      error: error.message
    }, { status: 500 });
  }
}
