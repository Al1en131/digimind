import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

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

    const { moduleId } = await request.json();
    if (!moduleId) {
      return NextResponse.json({
        success: false,
        message: "Module ID wajib diisi."
      }, { status: 400 });
    }

    const modId = parseInt(moduleId);

    // Verify module exists
    const targetModule = await prisma.module.findUnique({
      where: { id: modId },
      include: { category: true }
    });

    if (!targetModule) {
      return NextResponse.json({
        success: false,
        message: "Modul tidak ditemukan."
      }, { status: 404 });
    }

    // Save completion record
    await prisma.completedModule.upsert({
      where: {
        student_id_module_id: {
          student_id: student.id,
          module_id: modId
        }
      },
      update: {},
      create: {
        student_id: student.id,
        module_id: modId
      }
    });

    // Recalculate progress for student's current level
    const studentLevelName = student.literacy_level || "Beginner";
    const level = await prisma.level.findFirst({
      where: { name: studentLevelName }
    });

    let progressPercent = 0;
    if (level) {
      const levelModules = await prisma.module.findMany({
        where: { level_id: level.id }
      });
      const completedRecords = await prisma.completedModule.findMany({
        where: { student_id: student.id }
      });
      const completedIds = completedRecords.map(r => r.module_id);
      
      const totalModulesInLevel = levelModules.length;
      const completedInLevel = levelModules.filter(m => completedIds.includes(m.id)).length;
      
      progressPercent = totalModulesInLevel > 0 
        ? Math.round((completedInLevel / totalModulesInLevel) * 100) 
        : 0;

      await prisma.siswa.update({
        where: { id: student.id },
        data: { module_progress: progressPercent }
      });
    }

    // Dynamic Badge Awarding Logic
    const categoryName = targetModule.category.name.toLowerCase();
    let badgeAwarded = null;

    if (categoryName.includes("literacy") || categoryName.includes("literasi")) {
      // Award "Fact-Checker" badge
      const factCheckerBadge = await prisma.badge.findUnique({
        where: { name: "Fact-Checker" }
      });
      if (factCheckerBadge) {
        const hasBadge = await prisma.studentBadge.findFirst({
          where: { student_id: student.id, badge_id: factCheckerBadge.id }
        });
        if (!hasBadge) {
          await prisma.studentBadge.create({
            data: { student_id: student.id, badge_id: factCheckerBadge.id }
          });
          badgeAwarded = factCheckerBadge.name;
        }
      }
    } else if (categoryName.includes("mental") || categoryName.includes("kesehatan")) {
      // Award "Screen Guard" badge
      const screenGuardBadge = await prisma.badge.findUnique({
        where: { name: "Screen Guard" }
      });
      if (screenGuardBadge) {
        const hasBadge = await prisma.studentBadge.findFirst({
          where: { student_id: student.id, badge_id: screenGuardBadge.id }
        });
        if (!hasBadge) {
          await prisma.studentBadge.create({
            data: { student_id: student.id, badge_id: screenGuardBadge.id }
          });
          badgeAwarded = screenGuardBadge.name;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Modul berhasil diselesaikan!",
      progressPercent,
      badgeAwarded
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal memproses penyelesaian modul.",
      error: error.message
    }, { status: 500 });
  }
}
