import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

function parseScreenTime(activities: string | null | undefined): number {
  if (!activities) return 0;

  const match = activities.match(/(\d+(?:[.,]\d+)?)\s*(jam|hour|hrs|h)/i);
  if (!match) return 0;

  const number = Number(match[1].replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function normalizeStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Aktif";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "pending":
    default:
      return "Pending";
  }
}

function normalizeInterventionStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali sebagai guru." },
        { status: 401 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Profil guru tidak ditemukan." },
        { status: 404 }
      );
    }

    let students = [];
    if (teacher.type === "bk") {
      students = await prisma.siswa.findMany({
        include: {
          class: true,
          mental_journals: {
            orderBy: { logged_at: "desc" },
            take: 5,
          },
          completed_modules: true,
          interventions: {
            orderBy: { created_at: "desc" },
            take: 5,
          },
        },
      });
    } else {
      const subjects = await prisma.subject.findMany({
        where: { teacher_id: teacher.id }
      });
      const classIds = Array.from(new Set(subjects.map(s => s.class_id)));
      students = await prisma.siswa.findMany({
        where: {
          class_id: { in: classIds }
        },
        include: {
          class: true,
          mental_journals: {
            orderBy: { logged_at: "desc" },
            take: 5,
          },
          completed_modules: true,
          interventions: {
            orderBy: { created_at: "desc" },
            take: 5,
          },
        },
      });
    }

    const mentalHealthCategory = await prisma.category.findFirst({
      where: { name: { contains: "Mental" } },
      select: { id: true },
    });

    const mentalHealthModules = mentalHealthCategory?.id
      ? await prisma.module.findMany({
          where: { category_id: mentalHealthCategory.id },
          select: { id: true },
        })
      : [];

    const mentalHealthModuleIds = new Set(mentalHealthModules.map((module) => module.id));

    const literacyCategory = await prisma.category.findFirst({
      where: { name: { contains: "Literasi" } },
      select: { id: true },
    });

    const literacyModules = literacyCategory?.id
      ? await prisma.module.findMany({
          where: { category_id: literacyCategory.id, subject_id: null },
          select: { id: true },
        })
      : [];

    const literacyModuleIds = new Set(literacyModules.map((module) => module.id));

    // Fetch all subject modules to group them by class
    const allSubjectsWithModules = await prisma.subject.findMany({
      include: {
        modules: {
          select: { id: true }
        }
      }
    });

    const classSubjectModuleIdsMap = new Map();
    for (const sub of allSubjectsWithModules) {
      if (!classSubjectModuleIdsMap.has(sub.class_id)) {
        classSubjectModuleIdsMap.set(sub.class_id, []);
      }
      const list = classSubjectModuleIdsMap.get(sub.class_id);
      for (const mod of sub.modules) {
        list.push(mod.id);
      }
    }

    const studentSummaries = students.map((student) => {
      const recentJournals = student.mental_journals || [];
      const latestJournal = recentJournals[0];
      const averageMood = recentJournals.length > 0
        ? Math.round(recentJournals.reduce((sum, journal) => sum + journal.mood_score, 0) / recentJournals.length)
        : 3;
      const screenTime = parseScreenTime(latestJournal?.activities ?? null);

      // 1. Mental health progress
      const completedMentalHealthModules = student.completed_modules.filter((completedModule) => mentalHealthModuleIds.has(completedModule.module_id)).length;
      const mentalHealthProgress = mentalHealthModules.length > 0
        ? Math.round((completedMentalHealthModules / mentalHealthModules.length) * 100)
        : 0;

      // 2. Digital Literacy progress
      const completedLiteracyModules = student.completed_modules.filter((completedModule) => literacyModuleIds.has(completedModule.module_id)).length;
      const literacyProgress = literacyModules.length > 0
        ? Math.round((completedLiteracyModules / literacyModules.length) * 100)
        : 0;

      // 3. Subject Modules progress
      const studentClassSubjectModuleIds = classSubjectModuleIdsMap.get(student.class_id) || [];
      const completedSubjectModules = student.completed_modules.filter((completedModule) => studentClassSubjectModuleIds.includes(completedModule.module_id)).length;
      const subjectProgress = studentClassSubjectModuleIds.length > 0
        ? Math.round((completedSubjectModules / studentClassSubjectModuleIds.length) * 100)
        : 0;

      const riskFlag = Boolean(student.risk_flag) || averageMood <= 2 || screenTime > 7;
      const mentalStatus = student.mental_level || (riskFlag ? "Perlu Pendampingan" : averageMood >= 4 ? "Baik" : averageMood === 3 ? "Waspada" : "Perlu Pendampingan");

      return {
        id: student.id,
        name: student.name,
        className: student.class.name,
        literacyProgress,
        mentalHealthProgress,
        subjectProgress,
        mentalStatus,
        screenTime,
        moodScore: averageMood,
        modulesCompleted: student.completed_modules.length,
        riskFlag,
        riskReason: riskFlag
          ? `Mood rata-rata ${averageMood}/5${screenTime > 7 ? ` • screen time ${screenTime} jam` : ""}`
          : "Stabil",
        latestJournal: latestJournal
          ? {
              moodScore: latestJournal.mood_score,
              activities: latestJournal.activities,
              aiFeedback: latestJournal.ai_feedback,
            }
          : null,
      };
    });

    const alerts = studentSummaries.filter((student) => student.riskFlag);
    
    // Calculate averages
    const averageMood = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.moodScore, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageMentalHealthProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.mentalHealthProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageLiteracyProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.literacyProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    const averageSubjectProgress = Math.round(
      studentSummaries.reduce((sum, student) => sum + student.subjectProgress, 0) / Math.max(studentSummaries.length, 1)
    );
    
    const lowMoodCount = studentSummaries.filter((student) => student.moodScore <= 2).length;
    const lowMoodPercentage = students.length > 0 ? Math.round((lowMoodCount / students.length) * 100) : 0;

    const interventions = students.flatMap((student) =>
      (student.interventions || []).map((intervention) => ({
        id: intervention.id,
        studentName: student.name,
        note: intervention.description || intervention.name,
        status: normalizeStatus(intervention.status || null),
        updatedAt: intervention.updated_at
          ? new Date(intervention.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
          : "baru",
      }))
    );

    const aiInsights = [
      `Rata-rata progres literasi digital kelas ${averageLiteracyProgress}%, mental health ${averageMentalHealthProgress}%, dan mapel ${averageSubjectProgress}%.`,
      lowMoodCount > 0
        ? `${lowMoodCount} siswa menunjukkan tren mood rendah dan membutuhkan perhatian lebih cepat.`
        : "Tidak ada siswa yang menunjukkan tren mood rendah pada periode ini.",
      `Intervensi aktif saat ini sebanyak ${interventions.filter((item) => item.status === "Aktif").length} catatan.`,
    ];

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        specialization: teacher.specialization || "Guru",
        position: teacher.position || (teacher.type === "bk" ? "Guru Bimbingan Konseling" : "Guru Mata Pelajaran"),
        type: teacher.type,
      },
      classSummary: {
        totalStudents: students.length,
        averageProgress: averageLiteracyProgress,
        averageMood,
        averageMentalHealthProgress,
        averageLiteracyProgress,
        averageSubjectProgress,
        lowMoodCount,
        lowMoodPercentage,
        riskCount: alerts.length,
        classes: Array.from(new Set(students.map((student) => student.class.name))),
      },
      students: studentSummaries,
      alerts,
      aiInsights,
      interventions,
      privacyNotice:
        "Data jurnal pribadi siswa disamarkan dan hanya ditampilkan dalam bentuk ringkasan AI untuk melindungi privasi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat dashboard guru.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali sebagai guru." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const studentId = Number(body?.studentId);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const status = normalizeInterventionStatus(body?.status);

    if (!studentId || !title || !description) {
      return NextResponse.json(
        { success: false, message: "Data intervensi tidak lengkap." },
        { status: 400 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId },
      include: { user: true },
    });

    if (!teacher || teacher.type !== "bk") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru BK yang dapat memberikan intervensi secara langsung." },
        { status: 403 }
      );
    }

    const student = await prisma.siswa.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const intervention = await prisma.mentalIntervention.create({
      data: {
        student_id: studentId,
        name: title,
        description,
        status,
        assigned_by: teacher?.user?.id ?? null,
        started_at: status === "active" ? new Date() : null,
        ended_at: status === "completed" ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      intervention: {
        id: intervention.id,
        studentName: student.name,
        note: intervention.description || intervention.name,
        status: normalizeStatus(intervention.status || null),
        updatedAt: intervention.updated_at
          ? new Date(intervention.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
          : "baru",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menyimpan intervensi.", error: error.message },
      { status: 500 }
    );
  }
}
