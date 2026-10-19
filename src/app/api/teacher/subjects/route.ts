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
      where: teacher.type === "wali_kelas" && teacher.class_id
        ? { class_id: teacher.class_id }
        : { teacher_id: teacher.id },
      include: {
        class: true,
        quizzes: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        modules: {
          include: {
            level: true,
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const dbSubjects = await prisma.subject.findMany({
      select: { name: true },
      distinct: ["name"]
    });

    const defaultNames = [
      "Matematika",
      "Bahasa Indonesia",
      "Bahasa Inggris",
      "Informatika",
      "Fisika",
      "Kimia",
      "Biologi",
      "Ekonomi",
      "Geografi",
      "Sosiologi",
      "Sejarah",
      "Pendidikan Pancasila",
      "Seni Budaya",
      "PJOK",
      "Literasi Digital & Kesehatan Mental"
    ];

    const allSubjectNames = Array.from(
      new Set([...dbSubjects.map((s) => s.name), ...defaultNames])
    ).sort();

    return NextResponse.json({
      success: true,
      subjects,
      allSubjectNames
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

    if (teacher.type !== "subject" && teacher.type !== "bk") {
      return NextResponse.json(
        { success: false, message: "Hanya Guru Mata Pelajaran dan Guru BK yang dapat mengelola kelas pengampuan/binaan." },
        { status: 403 }
      );
    }

    const { name, classId } = await request.json();
    const subjectName = (name || (teacher.type === "bk" ? "Bimbingan Konseling (BK)" : "")).trim();

    if (!subjectName || !classId) {
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

    // Check if subject already exists for this class
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: subjectName,
        class_id: parseInt(classId)
      }
    });

    let targetSubject;
    if (existingSubject) {
      if (existingSubject.teacher_id === teacher.id) {
        return NextResponse.json(
          { success: false, message: "Anda sudah mengampu/membimbing kelas ini." },
          { status: 400 }
        );
      }
      targetSubject = await prisma.subject.update({
        where: { id: existingSubject.id },
        data: { teacher_id: teacher.id },
        include: { class: true }
      });
    } else {
      targetSubject = await prisma.subject.create({
        data: {
          name: subjectName,
          class_id: parseInt(classId),
          teacher_id: teacher.id
        },
        include: { class: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Kelas binaan / pengampuan berhasil ditambahkan.",
      subject: targetSubject
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat mata pelajaran.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Unassign a subject / class assignment
export async function DELETE(request: Request) {
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

    const { subjectId } = await request.json();

    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: "ID Kelas / Mata Pelajaran wajib diisi." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject || subject.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, message: "Kelas / Mata Pelajaran tidak ditemukan atau tidak diampu oleh Anda." },
        { status: 404 }
      );
    }

    await prisma.subject.update({
      where: { id: subject.id },
      data: { teacher_id: null }
    });

    return NextResponse.json({
      success: true,
      message: "Kelas pengampuan / binaan berhasil dilepas."
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal melepaskan kelas pengampuan.", error: error.message },
      { status: 500 }
    );
  }
}
