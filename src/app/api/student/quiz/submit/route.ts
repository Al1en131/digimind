import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

// Helper to determine points (1 to 4) for option text dynamically
function getOptionPoints(text: string): number {
  const clean = text.toLowerCase();
  
  // 1-Point Options (Least literate / High-risk mental health indicator)
  if (
    clean.includes("langsung percaya") || 
    clean.includes("langsung meneruskan") || 
    clean.includes("kata sandi sederhana") || 
    clean.includes("tidak pernah") || 
    clean.includes("diam saja") || 
    clean.includes("langsung klik link") ||
    clean.includes("langsung login akun bank") ||
    clean.includes("tidak penting, semua informasi") ||
    clean.includes(">8 jam") || 
    clean.includes("cemas/khawatir") || 
    clean.includes("sering membandingkan diri") || 
    clean.includes("terus scrolling") ||
    clean.includes("selalu merasa cemas") ||
    clean.includes("sangat terganggu")
  ) {
    return 1;
  }
  
  // 2-Point Options (Mild negative behavior)
  if (
    clean.includes("membandingkan dengan 1") || 
    clean.includes("membaca saja") || 
    clean.includes("1 password untuk semua") || 
    clean.includes("kadang-kadang") || 
    clean.includes("ikut menanggapi") || 
    clean.includes("mengabaikannya tanpa melapor") ||
    clean.includes("menggunakan sesuka hati") ||
    clean.includes("hanya penting untuk tugas") ||
    clean.includes("5–7 jam") || 
    clean.includes("lelah/tidak fokus") || 
    clean.includes("mengeluh ke teman") ||
    clean.includes("sering merasa khawatir") ||
    clean.includes("kadang-kadang sulit tidur")
  ) {
    return 2;
  }
  
  // 3-Point Options (Moderate positive behavior)
  if (
    clean.includes("mengingatkan teman") || 
    clean.includes("sering") || 
    clean.includes("mengingatkan dengan cara") || 
    clean.includes("menghapus email dan tidak") ||
    clean.includes("hanya membuka media sosial") ||
    clean.includes("agar data presentasi") ||
    clean.includes("2–4 jam") || 
    clean.includes("mencari bantuan") ||
    clean.includes("kadang-kadang memikirkannya") ||
    clean.includes("cukup baik karena dibatasi")
  ) {
    return 3;
  }
  
  // 4-Point Options (Highly literate behavior / Stable mental health routine)
  return 4; 
}

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

    // Find student profile
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

    // 3. Process quiz completion
    const result = await prisma.$transaction(async (tx) => {
      // Create initial attempt
      const attempt = await tx.quizAttempt.create({
        data: {
          student_id: student.id,
          quiz_id: parseInt(quizId),
          score: 0,
        }
      });

      let totalPoints = 0;
      let maxPointsPossible = 0;
      let literacyPoints = 0;
      let mentalPoints = 0;
      let literacyQuestionsCount = 0;
      let mentalQuestionsCount = 0;

      // Write each answer and evaluate
      for (const ans of answers) {
        const option = await tx.option.findUnique({
          where: { id: parseInt(ans.optionId) },
          include: {
            question: true
          }
        });

        if (!option) continue;

        // Save answer record
        await tx.answer.create({
          data: {
            attempt_id: attempt.id,
            question_id: parseInt(ans.questionId),
            option_id: parseInt(ans.optionId),
          }
        });

        // Determine points for the selected choice
        const points = getOptionPoints(option.option_text);
        
        // Categorized calculation based on question content
        const questionText = option.question.question.toLowerCase();
        
        if (questionText.includes("literasi")) {
          // Questions relate to digital literacy
          literacyPoints += points;
          totalPoints += points;
          maxPointsPossible += 4;
          literacyQuestionsCount++;
        } else if (questionText.includes("mental")) {
          // Questions relate to mental health
          mentalPoints += points;
          totalPoints += points;
          maxPointsPossible += 4;
          mentalQuestionsCount++;
        } else {
          // Preference-based, no score impact
          maxPointsPossible += 0;
        }
      }

      // Calculate final quiz score percentage (relative to max possible from graded questions)
      const finalScore = maxPointsPossible > 0 ? Math.round((totalPoints / maxPointsPossible) * 100) : 100;

      // Update quiz attempt as completed
      await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score: finalScore,
          completed_at: new Date()
        }
      });

      // 4. CLASSIFICATION LOGIC (Percentage-based, fully flexible)
      const maxLiteracyPoints = literacyQuestionsCount * 4;
      const maxMentalPoints = mentalQuestionsCount * 4;

      // Literacy Level (Advanced >= 75%, Intermediate >= 50%)
      let literacyLevel = "Beginner";
      if (maxLiteracyPoints > 0) {
        const literacyPercent = (literacyPoints / maxLiteracyPoints) * 100;
        if (literacyPercent >= 75) {
          literacyLevel = "Advanced";
        } else if (literacyPercent >= 50) {
          literacyLevel = "Intermediate";
        }
      }

      // Mental Level & Risk Flag (Stable >= 75%, Intermediate/Mild >= 50%)
      let mentalLevel = "Stable";
      let riskFlag = false;

      if (maxMentalPoints > 0) {
        const mentalPercent = (mentalPoints / maxMentalPoints) * 100;
        if (mentalPercent >= 75) {
          mentalLevel = "Stable";
          riskFlag = false;
        } else if (mentalPercent >= 50) {
          mentalLevel = "Intermediate (Mild Stress)";
          riskFlag = false;
        } else {
          mentalLevel = "Advanced (High Anxiety / High Risk)";
          riskFlag = true; // Flags student for counselor bimbingan
        }
      }

      // Update Student Profile
      await tx.siswa.update({
        where: { id: student.id },
        data: {
          literacy_level: literacyLevel,
          mental_level: mentalLevel,
          risk_flag: riskFlag
        }
      });

      return {
        score: finalScore,
        literacyLevel,
        mentalLevel,
        riskFlag
      };
    });

    return NextResponse.json({
      success: true,
      message: "Pretest berhasil dikirim! Menyiapkan dashboard...",
      result
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan sistem saat mengirim kuis.",
      error: error.message
    }, { status: 500 });
  }
}
