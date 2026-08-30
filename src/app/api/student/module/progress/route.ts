import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";
import { calculateStudentModuleProgress } from "@/lib/student-progress";

// POST /api/student/module/progress
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    const student = await prisma.siswa.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ success: false, message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    const { moduleId, progress, scrollPos } = await request.json();
    if (!moduleId || progress === undefined) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap." }, { status: 400 });
    }

    const parsedModuleId = parseInt(moduleId);
    const newProgress = Math.min(100, Math.max(0, parseInt(progress)));
    const newScrollPos = parseInt(scrollPos || 0);

    // Get current progress record if any
    const existing = await prisma.studentModuleProgress.findUnique({
      where: {
        student_id_module_id: {
          student_id: student.id,
          module_id: parsedModuleId
        }
      }
    });

    // Don't downgrade progress if student already completed posttest / got higher progress
    const finalProgress = Math.max(existing?.progress || 0, newProgress);

    const updatedRecord = await prisma.studentModuleProgress.upsert({
      where: {
        student_id_module_id: {
          student_id: student.id,
          module_id: parsedModuleId
        }
      },
      update: {
        progress: finalProgress,
        scroll_pos: newScrollPos
      },
      create: {
        student_id: student.id,
        module_id: parsedModuleId,
        progress: finalProgress,
        scroll_pos: newScrollPos
      }
    });

    // Recalculate student overall module_progress
    const { progressPercent: overall } = await calculateStudentModuleProgress(
      student.id,
      student.class_id,
      student.literacy_level
    );

    return NextResponse.json({
      success: true,
      progress: updatedRecord.progress,
      scrollPos: updatedRecord.scroll_pos,
      overallProgress: overall
    });

  } catch (error: any) {
    console.error("Error saving module reading progress:", error);
    return NextResponse.json({ success: false, message: "Gagal menyimpan progress.", error: error.message }, { status: 500 });
  }
}
