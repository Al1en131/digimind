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

    const [modules, quizzes, users, journals, students, moduleCount, quizCount, userCount] = await Promise.all([
      prisma.module.findMany({
        include: { category: true, level: true },
        orderBy: { created_at: "desc" },
        take: 20,
      }),
      prisma.quiz.findMany({
        include: { module: true },
        orderBy: { created_at: "desc" },
        take: 20,
      }),
      prisma.user.findMany({
        include: { admin: true, student: true, teacher: true },
        orderBy: { created_at: "desc" },
        take: 20,
      }),
      prisma.mentalJournal.findMany({
        include: { student: true },
        orderBy: { logged_at: "desc" },
        take: 20,
      }),
      prisma.siswa.findMany({
        include: {
          class: true,
          mental_journals: { orderBy: { logged_at: "desc" }, take: 5 },
          completed_modules: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.module.count(),
      prisma.quiz.count(),
      prisma.user.count(),
    ]);

    const mentalHealthModules = await prisma.module.findMany({
      where: { category: { name: { contains: "Mental" } } },
      select: { id: true },
    });

    const mentalHealthModuleIds = new Set(mentalHealthModules.map((module) => module.id));

    const progress = students.map((student) => {
      const recentJournals = student.mental_journals || [];
      const latestJournal = recentJournals[0];
      const averageMood = recentJournals.length > 0
        ? Math.round(recentJournals.reduce((sum, journal) => sum + journal.mood_score, 0) / recentJournals.length)
        : 3;
      const screenTime = parseScreenTime(latestJournal?.activities ?? null);
      const completedMentalHealthModules = student.completed_modules.filter((completedModule) => mentalHealthModuleIds.has(completedModule.module_id)).length;
      const mentalHealthProgress = mentalHealthModules.length > 0
        ? Math.round((completedMentalHealthModules / mentalHealthModules.length) * 100)
        : 0;
      const riskFlag = Boolean(student.risk_flag) || averageMood <= 2 || screenTime > 7;

      return {
        id: student.id,
        student: student.name,
        className: student.class?.name || "-",
        literacy: student.module_progress ?? 0,
        mental: mentalHealthProgress,
        risk: riskFlag ? (averageMood <= 2 ? "Perlu perhatian" : "Waspada") : "Stabil",
      };
    });

    const summary = {
      modules: moduleCount,
      quizzes: quizCount,
      users: userCount,
      journals: journals.length,
      atRisk: progress.filter((item) => item.risk !== "Stabil").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        category: module.category?.name || "-",
        level: module.level?.name || "-",
        status: module.created_at ? "Aktif" : "Draft",
      })),
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        type: quiz.type,
        module: quiz.module?.title || "-",
        status: "Aktif",
      })),
      users: users.map((user) => ({
        id: user.id,
        name: user.student?.name || user.teacher?.name || user.admin?.name || user.username,
        role: user.role,
        email: user.email,
        status: user.student || user.teacher || user.admin ? "Aktif" : "Pending",
      })),
      journals: journals.map((journal) => ({
        id: journal.id,
        student: journal.student?.name || "-",
        mood: journal.mood_score,
        note: journal.notes || journal.ai_feedback || "-",
        date: journal.logged_at ? new Date(journal.logged_at).toLocaleDateString("id-ID") : "-",
      })),
      progress,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat dashboard admin.", error: error.message },
      { status: 500 }
    );
  }
}
