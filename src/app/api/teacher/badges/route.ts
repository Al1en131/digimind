import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

async function getTeacherFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const decoded = sessionToken ? verifyJWT(sessionToken) : null;

  if (!decoded || decoded.role !== "teacher") {
    return null;
  }

  return prisma.guru.findUnique({
    where: { user_id: decoded.userId }
  });
}

export async function GET() {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    // Get subjects taught by teacher OR belonging to teacher's class (for Wali Kelas)
    const whereSubject = teacher.class_id
      ? {
          OR: [
            { teacher_id: teacher.id },
            { class_id: teacher.class_id }
          ]
        }
      : { teacher_id: teacher.id };

    const subjects = await prisma.subject.findMany({
      where: whereSubject,
      select: { id: true }
    });
    const subjectIds = subjects.map(s => s.id);

    // Get badges connected to modules of these subjects
    const badges = await prisma.badge.findMany({
      where: {
        module: {
          subject_id: { in: subjectIds }
        }
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    // Also return list of modules taught in these subjects
    const modules = await prisma.module.findMany({
      where: {
        subject_id: { in: subjectIds }
      },
      select: {
        id: true,
        title: true,
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      badges,
      modules
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan.", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    const { name, description, image_url, module_id } = await request.json();

    if (!name || !module_id) {
      return NextResponse.json({ success: false, message: "Nama dan modul wajib diisi." }, { status: 400 });
    }

    // Verify module belongs to teacher's subjects or class
    const moduleIdInt = parseInt(module_id);
    const targetModule = await prisma.module.findUnique({
      where: { id: moduleIdInt },
      include: { subject: true }
    });

    const isAuthorized = targetModule?.subject && (
      targetModule.subject.teacher_id === teacher.id ||
      (teacher.class_id && targetModule.subject.class_id === teacher.class_id)
    );

    if (!targetModule || !isAuthorized) {
      return NextResponse.json({ success: false, message: "Modul yang dipilih tidak valid." }, { status: 403 });
    }

    const newBadge = await prisma.badge.create({
      data: {
        name,
        description,
        image_url: image_url || "🏆",
        module_id: moduleIdInt
      }
    });

    // Auto-award newly created badge to students who already completed this module
    try {
      const completedProgresses = await prisma.completedModule.findMany({
        where: {
          module_id: moduleIdInt
        },
        select: { student_id: true }
      });

      if (completedProgresses.length > 0) {
        for (const cp of completedProgresses) {
          const existing = await prisma.studentBadge.findFirst({
            where: {
              student_id: cp.student_id,
              badge_id: newBadge.id
            }
          });
          if (!existing) {
            await prisma.studentBadge.create({
              data: {
                student_id: cp.student_id,
                badge_id: newBadge.id
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Auto-award badge error on POST:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Badge berhasil dibuat.",
      badge: newBadge
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Gagal membuat badge.", error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    const { id, name, description, image_url, module_id } = await request.json();

    if (!id || !name || !module_id) {
      return NextResponse.json({ success: false, message: "ID, Nama, dan modul wajib diisi." }, { status: 400 });
    }

    const badgeIdInt = parseInt(id);
    const moduleIdInt = parseInt(module_id);

    // Verify badge belongs to teacher's subject module or class
    const targetBadge = await prisma.badge.findUnique({
      where: { id: badgeIdInt },
      include: { module: { include: { subject: true } } }
    });

    const isAuthorizedBadge = targetBadge?.module?.subject && (
      targetBadge.module.subject.teacher_id === teacher.id ||
      (teacher.class_id && targetBadge.module.subject.class_id === teacher.class_id)
    );

    if (!targetBadge || !isAuthorizedBadge) {
      return NextResponse.json({ success: false, message: "Akses badge tidak valid." }, { status: 403 });
    }

    // Verify new module belongs to teacher's subjects or class
    const targetModule = await prisma.module.findUnique({
      where: { id: moduleIdInt },
      include: { subject: true }
    });

    const isAuthorizedModule = targetModule?.subject && (
      targetModule.subject.teacher_id === teacher.id ||
      (teacher.class_id && targetModule.subject.class_id === teacher.class_id)
    );

    if (!targetModule || !isAuthorizedModule) {
      return NextResponse.json({ success: false, message: "Modul baru yang dipilih tidak valid." }, { status: 403 });
    }

    const updatedBadge = await prisma.badge.update({
      where: { id: badgeIdInt },
      data: {
        name,
        description,
        image_url: image_url || "🏆",
        module_id: moduleIdInt
      }
    });

    // Auto-award updated badge to students who already completed this module
    try {
      const completedProgresses = await prisma.completedModule.findMany({
        where: {
          module_id: moduleIdInt
        },
        select: { student_id: true }
      });

      if (completedProgresses.length > 0) {
        for (const cp of completedProgresses) {
          const existing = await prisma.studentBadge.findFirst({
            where: {
              student_id: cp.student_id,
              badge_id: updatedBadge.id
            }
          });
          if (!existing) {
            await prisma.studentBadge.create({
              data: {
                student_id: cp.student_id,
                badge_id: updatedBadge.id
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Auto-award badge error on PUT:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Badge berhasil diperbarui.",
      badge: updatedBadge
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Gagal memperbarui badge.", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const teacher = await getTeacherFromSession();
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID badge wajib disertakan." }, { status: 400 });
    }

    const badgeIdInt = parseInt(id);

    const targetBadge = await prisma.badge.findUnique({
      where: { id: badgeIdInt },
      include: { module: { include: { subject: true } } }
    });

    const isAuthorizedBadge = targetBadge?.module?.subject && (
      targetBadge.module.subject.teacher_id === teacher.id ||
      (teacher.class_id && targetBadge.module.subject.class_id === teacher.class_id)
    );

    if (!targetBadge || !isAuthorizedBadge) {
      return NextResponse.json({ success: false, message: "Akses badge tidak valid." }, { status: 403 });
    }

    await prisma.badge.delete({
      where: { id: badgeIdInt }
    });

    return NextResponse.json({
      success: true,
      message: "Badge berhasil dihapus."
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Gagal menghapus badge.", error: error.message }, { status: 500 });
  }
}
