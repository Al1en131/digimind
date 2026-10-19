import { NextResponse } from "next/server";
import { encryptSensitiveText, decryptSensitiveText } from "@/lib/encryption";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

function generateAIFeedback(moodScore: number, notes: string, activities: string): string {
  const noteLower = notes.toLowerCase();
  const actLower = activities.toLowerCase();

  let opening = "";
  switch (moodScore) {
    case 1:
      opening = "Halo. Aku mendengarmu. Sepertinya hari ini terasa sangat berat untukmu, dan itu tidak apa-apa.";
      break;
    case 2:
      opening = "Halo. Aku merasakan kecemasan dari catatanmu. Menghadapi rasa khawatir memang melelahkan.";
      break;
    case 3:
      opening = "Halo. Hari yang cukup datar atau biasa saja ya. Ini adalah waktu yang baik untuk menyeimbangkan energi.";
      break;
    case 4:
      opening = "Halo! Senang mendengar bahwa harimu berjalan dengan baik.";
      break;
    case 5:
      opening = "Halo! Luar biasa sekali energimu hari ini. Aku sangat senang melihatmu berenergi positif!";
      break;
    default:
      opening = "Halo! Terima kasih telah berbagi ceritamu hari ini di jurnal refleksi.";
  }

  const analysisSentences: string[] = [];

  // Notes Keyword Analysis
  if (noteLower.includes("lelah") || noteLower.includes("capek") || noteLower.includes("penat") || noteLower.includes("lemes") || noteLower.includes("lesu")) {
    analysisSentences.push("Aku menangkap adanya rasa lelah yang cukup besar dalam dirimu. Tubuh dan pikiranmu mungkin sedang mengirim sinyal untuk beristirahat penuh.");
  }
  if (noteLower.includes("sedih") || noteLower.includes("kecewa") || noteLower.includes("nangis") || noteLower.includes("menangis") || noteLower.includes("sepi") || noteLower.includes("kesepian")) {
    analysisSentences.push("Rasa sedih, sepi, atau kekecewaan yang kamu rasakan adalah valid. Jangan ragu untuk mengekspresikannya secara sehat atau bercerita kepada orang terdekat.");
  }
  if (noteLower.includes("stres") || noteLower.includes("pusing") || noteLower.includes("tekanan") || noteLower.includes("frustrasi") || noteLower.includes("mumet")) {
    analysisSentences.push("Tingkat stres atau rasa penat yang kamu rasakan tampaknya perlu diredakan. Cobalah luangkan waktu 5-10 menit untuk melakukan latihan pernapasan dalam (box breathing).");
  }
  if (noteLower.includes("tugas") || noteLower.includes("sekolah") || noteLower.includes("ujian") || noteLower.includes("matematika") || noteLower.includes("fisika") || noteLower.includes("pr") || noteLower.includes("belajar") || noteLower.includes("kuliah")) {
    analysisSentences.push("Beban tugas sekolah terkadang menumpuk. Cobalah gunakan metode Pomodoro (25 menit fokus, 5 menit istirahat) untuk membantumu tetap produktif tanpa mengalami burnout digital.");
  }
  if (noteLower.includes("cemas") || noteLower.includes("khawatir") || noteLower.includes("takut") || noteLower.includes("panik") || noteLower.includes("degdegan")) {
    analysisSentences.push("Kecemasan tentang hal yang belum terjadi sering kali menguras energi mental. Cobalah hembuskan napas pelan, dan fokuslah pada apa yang bisa kamu kendalikan saat ini.");
  }
  if (noteLower.includes("senang") || noteLower.includes("bahagia") || noteLower.includes("seru") || noteLower.includes("gembira") || noteLower.includes("bersyukur")) {
    analysisSentences.push("Menyimpan memori indah dan mensyukuri momen bahagia seperti ini dalam jurnal sangat baik untuk membangun ketahanan mental (resilience) jangka panjang.");
  }

  // Activities analysis
  if (actLower.includes("scrolling") || actLower.includes("tiktok") || actLower.includes("ig") || actLower.includes("instagram") || actLower.includes("twitter") || actLower.includes("x") || actLower.includes("medsos") || actLower.includes("sosmed")) {
    analysisSentences.push("Scrolling media sosial secara pasif terkadang memicu digital fatigue (kelelahan mata dan pikiran) tanpa kita sadari. Cobalah membatasi penggunaannya demi ketenangan batinmu.");
  }
  if (actLower.includes("game") || actLower.includes("gaming") || actLower.includes("main game") || actLower.includes("mabar") || actLower.includes("ml") || actLower.includes("pubg")) {
    analysisSentences.push("Bermain game memang menyenangkan untuk melepas penat, namun pastikan untuk membatasinya agar tidak mengorbankan waktu tidur malam yang penting bagi regenerasi otak.");
  }
  if (actLower.includes("nonton") || actLower.includes("youtube") || actLower.includes("netflix") || actLower.includes("anime") || actLower.includes("drakor")) {
    analysisSentences.push("Menonton hiburan visual adalah cara santai yang bagus, tetapi batasi agar tidak membuatmu begadang dan merusak ritme sirkadian tubuhmu.");
  }

  // Fallback if no keywords matched
  if (analysisSentences.length === 0) {
    if (moodScore <= 2) {
      analysisSentences.push("Jika kamu sedang mengalami hari yang berat, cobalah letakkan gawai sejenak, hirup udara segar, dan minumlah air putih. Tubuhmu butuh relaksasi fisik.");
    } else {
      analysisSentences.push("Pertahankan kesadaran belajarmu hari ini. Keseimbangan antara aktivitas digital dan dunia nyata adalah kunci kesehatan mental yang prima.");
    }
  }

  const closing = "Tetap semangat dan jaga kesehatan mentalmu ya. Aku (AI DigiMind) ada di sini untuk mendampingi langkahmu!";

  return `${opening} ${analysisSentences.join(" ")} ${closing}`;
}

export async function POST(request: Request) {
  try {
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

    const { moodScore, notes, activities, date } = await request.json();

    if (moodScore === undefined) {
      return NextResponse.json({
        success: false,
        message: "Skor Mood wajib dipilih."
      }, { status: 400 });
    }

    const scoreNum = parseInt(moodScore);
    const aiFeedback = generateAIFeedback(scoreNum, notes || "", activities || "");

    const journal = await prisma.mentalJournal.create({
      data: {
        student_id: student.id,
        mood_score: scoreNum,
        notes: encryptSensitiveText(notes || "") || "",
        activities: encryptSensitiveText(activities || "") || "",
        ai_feedback: encryptSensitiveText(aiFeedback) || "",
        logged_at: date ? new Date(date) : new Date()
      }
    });

    // Auto-update student risk status and reopen mentoring session if mood is poor
    if (scoreNum <= 2) {
      await prisma.siswa.update({
        where: { id: student.id },
        data: {
          risk_flag: true,
          mental_level: "Perlu Pendampingan",
          adaptive_mental: "Perlu Pendampingan"
        }
      });

      // Check if there is an active intervention, if not reopen a new active intervention session
      const activeIntervention = await prisma.mentalIntervention.findFirst({
        where: { student_id: student.id, status: "active" }
      });

      if (!activeIntervention) {
        await prisma.mentalIntervention.create({
          data: {
            student_id: student.id,
            name: encryptSensitiveText("Sesi Pendampingan Terbuka (Mood Rendah)") || "Sesi Pendampingan Terbuka",
            description: encryptSensitiveText(`Siswa melaporkan mood rendah (${scoreNum}/5) pada jurnal harian terbaru. Sesi pendampingan dibuka kembali.`) || `Mood rendah (${scoreNum}/5)`,
            status: "active",
            started_at: new Date()
          }
        });
      }
    } else if (scoreNum >= 4) {
      const activeIntervention = await prisma.mentalIntervention.findFirst({
        where: { student_id: student.id, status: "active" }
      });
      if (!activeIntervention) {
        await prisma.siswa.update({
          where: { id: student.id },
          data: {
            risk_flag: false,
            mental_level: student.mental_level?.includes("Sudah Pendampingan")
              ? "Sehat & Stabil (Sudah Pendampingan BK)"
              : "Baik",
            adaptive_mental: "Stabil"
          }
        });
      }
    }

    // Award "Screen Guard" badge if this is their first journal entry
    const screenGuardBadge = await prisma.badge.findUnique({
      where: { name: "Screen Guard" }
    });

    let badgeAwarded = null;
    if (screenGuardBadge) {
      const hasBadge = await prisma.studentBadge.findFirst({
        where: {
          student_id: student.id,
          badge_id: screenGuardBadge.id
        }
      });

      if (!hasBadge) {
        await prisma.studentBadge.create({
          data: {
            student_id: student.id,
            badge_id: screenGuardBadge.id
          }
        });
        badgeAwarded = screenGuardBadge.name;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Jurnal refleksi berhasil disimpan!",
      journal: {
        ...journal,
        notes: decryptSensitiveText(journal.notes),
        activities: decryptSensitiveText(journal.activities),
        ai_feedback: decryptSensitiveText(journal.ai_feedback),
      },
      badgeAwarded
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal menyimpan jurnal.",
      error: error.message
    }, { status: 500 });
  }
}
