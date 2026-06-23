import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function GET() {
  try {
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
      where: { user_id: decoded.userId },
      include: {
        user: true,
        class: true,
        student_badges: {
          include: {
            badge: true
          }
        },
        mental_journals: {
          orderBy: { logged_at: "desc" },
          take: 7
        }
      }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        message: "Profil siswa tidak ditemukan."
      }, { status: 404 });
    }

    // Get matched level
    const studentLevelName = student.literacy_level || "Beginner";
    const level = await prisma.level.findFirst({
      where: { name: studentLevelName }
    });

    // Fetch modules for this level
    const levelModules = level
      ? await prisma.module.findMany({
          where: { level_id: level.id },
          include: {
            category: true
          }
        })
      : [];

    // Get completed module IDs
    const completedRecords = await prisma.completedModule.findMany({
      where: { student_id: student.id }
    });
    const completedModuleIds = completedRecords.map(r => r.module_id);

    // Calculate progress
    const totalModulesInLevel = levelModules.length;
    const completedInLevel = levelModules.filter(m => completedModuleIds.includes(m.id)).length;
    const progressPercent = totalModulesInLevel > 0 
      ? Math.round((completedInLevel / totalModulesInLevel) * 100) 
      : 0;

    // Update progress in database if out of sync
    if (student.module_progress !== progressPercent) {
      await prisma.siswa.update({
        where: { id: student.id },
        data: { module_progress: progressPercent }
      });
      student.module_progress = progressPercent;
    }

    // Fetch all badges
    const allBadges = await prisma.badge.findMany();

    // Fetch leaderboard rank (ordered by module_progress desc)
    const allStudents = await prisma.siswa.findMany({
      orderBy: [
        { module_progress: "desc" },
        { name: "asc" }
      ]
    });
    const rank = allStudents.findIndex(s => s.id === student.id) + 1;
    const totalStudents = allStudents.length;

    // Auto-award Cyber Pioneer badge if completed pretest and doesn't have it
    const cyberPioneerBadge = allBadges.find(b => b.name === "Cyber Pioneer");
    const hasCyberPioneer = student.student_badges.some(sb => sb.badge.name === "Cyber Pioneer");
    if (cyberPioneerBadge && !hasCyberPioneer) {
      await prisma.studentBadge.create({
        data: {
          student_id: student.id,
          badge_id: cyberPioneerBadge.id
        }
      });
      // Re-fetch student badges to include it
      const updatedBadges = await prisma.studentBadge.findMany({
        where: { student_id: student.id },
        include: { badge: true }
      });
      student.student_badges = updatedBadges;
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        username: student.user.username,
        nis: student.nis,
        class: student.class.name,
        avatar: student.avatar,
        literacy_level: student.literacy_level || "Beginner",
        mental_level: student.mental_level || "Stable",
        module_progress: student.module_progress,
        risk_flag: student.risk_flag
      },
      modules: levelModules,
      completedModuleIds,
      badges: {
        all: allBadges,
        unlocked: student.student_badges.map(sb => sb.badge)
      },
      journals: student.mental_journals,
      leaderboard: {
        rank: rank > 0 ? rank : 1,
        total: totalStudents > 0 ? totalStudents : 1
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan memuat data dashboard.",
      error: error.message
    }, { status: 500 });
  }
}
