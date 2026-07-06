import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

// GET: Fetch subjects taught by this teacher
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali." },
        { status: 401 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Profil guru tidak ditemukan." },
        { status: 404 }
      );
    }

    const subjects = await prisma.subject.findMany({
      where: { teacher_id: teacher.id },
      include: {
        class: true,
        modules: {
          include: {
            quizzes: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      subjects
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data mata pelajaran.", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Add a new subject
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali." },
        { status: 401 }
      );
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Profil guru tidak ditemukan." },
        { status: 404 }
      );
    }

    if (teacher.type !== "subject") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran yang dapat mengelola mata pelajaran." },
        { status: 403 }
      );
    }

    const { name, classId } = await request.json();

    if (!name || !classId) {
      return NextResponse.json(
        { success: false, message: "Nama mata pelajaran dan Kelas wajib diisi." },
        { status: 400 }
      );
    }

    // Verify class exists
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!schoolClass) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check if subject already exists for this class by this teacher
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: name.trim(),
        class_id: parseInt(classId),
        teacher_id: teacher.id
      }
    });

    if (existingSubject) {
      return NextResponse.json(
        { success: false, message: "Anda sudah mengampu mata pelajaran ini di kelas tersebut." },
        { status: 400 }
      );
    }

    const newSubject = await prisma.subject.create({
      data: {
        name: name.trim(),
        class_id: parseInt(classId),
        teacher_id: teacher.id
      },
      include: {
        class: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil ditambahkan!",
      subject: newSubject
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat mata pelajaran.", error: error.message },
      { status: 500 }
    );
  }
}
