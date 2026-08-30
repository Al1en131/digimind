import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";
import { encryptSensitiveText, decryptSensitiveText } from "@/lib/encryption";

// GET: Fetch chat history
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    if (decoded.role === "student") {
      // Find the student profile
      const student = await prisma.siswa.findUnique({
        where: { user_id: decoded.userId }
      });

      if (!student) {
        return NextResponse.json(
          { success: false, message: "Profil siswa tidak ditemukan." },
          { status: 404 }
        );
      }

      // Fetch all Guidance Counselors (Guru BK) with class info
      const bkTeachers = await prisma.guru.findMany({
        where: { type: "bk" },
        select: {
          id: true,
          name: true,
          phone_number: true,
          specialization: true,
          class_id: true,
          class: { select: { id: true, name: true, major: true } }
        }
      });

      if (bkTeachers.length === 0) {
        return NextResponse.json({
          success: true,
          messages: [],
          bkTeachers: [],
          activeTeacherId: null
        });
      }

      // Prioritize Guru BK whose class_id matches the student's class_id
      const classMatchedBk = bkTeachers.find(b => b.class_id === student.class_id);
      const defaultTeacherId = classMatchedBk ? classMatchedBk.id : bkTeachers[0].id;
      const paramTeacherId = searchParams.get("teacherId");
      const activeTeacherId = paramTeacherId ? parseInt(paramTeacherId) : defaultTeacherId;

      // Get chat history with active BK teacher
      const messages = await prisma.chatMessage.findMany({
        where: {
          student_id: student.id,
          teacher_id: activeTeacherId
        },
        orderBy: { created_at: "asc" }
      });

      const decryptedMessages = messages.map((m) => ({
        ...m,
        message: decryptSensitiveText(m.message),
      }));

      return NextResponse.json({
        success: true,
        messages: decryptedMessages,
        bkTeachers,
        activeTeacherId
      });

    } else if (decoded.role === "teacher") {
      // Find the teacher profile
      const teacher = await prisma.guru.findUnique({
        where: { user_id: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json(
          { success: false, message: "Profil guru tidak ditemukan." },
          { status: 404 }
        );
      }

      if (teacher.type !== "bk") {
        return NextResponse.json(
          { success: false, message: "Hanya Guru BK yang dapat mengakses intervensi chat." },
          { status: 403 }
        );
      }

      const paramStudentId = searchParams.get("studentId");
      if (!paramStudentId) {
        return NextResponse.json(
          { success: false, message: "Parameter studentId wajib diisi." },
          { status: 400 }
        );
      }

      const studentId = parseInt(paramStudentId);

      // Get chat history with student
      const messages = await prisma.chatMessage.findMany({
        where: {
          student_id: studentId,
          teacher_id: teacher.id
        },
        orderBy: { created_at: "asc" }
      });

      const decryptedMessages = messages.map((m) => ({
        ...m,
        message: decryptSensitiveText(m.message),
      }));

      return NextResponse.json({
        success: true,
        messages: decryptedMessages
      });
    }

    return NextResponse.json(
      { success: false, message: "Akses ditolak." },
      { status: 403 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil pesan chat.", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Send new message
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login kembali." },
        { status: 401 }
      );
    }

    const { message, studentId, teacherId } = await request.json();

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const encryptedMessagePayload = encryptSensitiveText(message.trim()) || message.trim();

    if (decoded.role === "student") {
      const student = await prisma.siswa.findUnique({
        where: { user_id: decoded.userId }
      });

      if (!student) {
        return NextResponse.json(
          { success: false, message: "Profil siswa tidak ditemukan." },
          { status: 404 }
        );
      }

      const targetTeacherId = teacherId ? parseInt(teacherId) : null;
      if (!targetTeacherId) {
        // If not specified, try to find the first BK teacher in system
        const firstBk = await prisma.guru.findFirst({ where: { type: "bk" } });
        if (!firstBk) {
          return NextResponse.json(
            { success: false, message: "Tidak ada guru BK terdaftar di sistem." },
            { status: 400 }
          );
        }
        
        const newMessage = await prisma.chatMessage.create({
          data: {
            student_id: student.id,
            teacher_id: firstBk.id,
            message: encryptedMessagePayload,
            sender: "student"
          }
        });

        return NextResponse.json({
          success: true,
          message: {
            ...newMessage,
            message: decryptSensitiveText(newMessage.message)
          }
        });
      }

      const newMessage = await prisma.chatMessage.create({
        data: {
          student_id: student.id,
          teacher_id: targetTeacherId,
          message: encryptedMessagePayload,
          sender: "student"
        }
      });

      return NextResponse.json({
        success: true,
        message: {
          ...newMessage,
          message: decryptSensitiveText(newMessage.message)
        }
      });

    } else if (decoded.role === "teacher") {
      const teacher = await prisma.guru.findUnique({
        where: { user_id: decoded.userId }
      });

      if (!teacher) {
        return NextResponse.json(
          { success: false, message: "Profil guru tidak ditemukan." },
          { status: 404 }
        );
      }

      if (teacher.type !== "bk") {
        return NextResponse.json(
          { success: false, message: "Hanya Guru BK yang dapat melakukan intervensi chat." },
          { status: 403 }
        );
      }

      if (!studentId) {
        return NextResponse.json(
          { success: false, message: "ID Siswa tujuan wajib diisi." },
          { status: 400 }
        );
      }

      const newMessage = await prisma.chatMessage.create({
        data: {
          student_id: parseInt(studentId),
          teacher_id: teacher.id,
          message: encryptedMessagePayload,
          sender: "teacher"
        }
      });

      // Also create/update a MentalIntervention record to keep historical logs if desired
      const existingIntervention = await prisma.mentalIntervention.findFirst({
        where: {
          student_id: parseInt(studentId),
          assigned_by: decoded.userId,
          status: "active"
        }
      });

      if (!existingIntervention) {
        await prisma.mentalIntervention.create({
          data: {
            student_id: parseInt(studentId),
            name: encryptSensitiveText("Intervensi Bimbingan Chat") || "Intervensi Bimbingan Chat",
            description: encryptSensitiveText(`Intervensi chat aktif dimulai oleh Guru BK: ${teacher.name}`) || `Intervensi chat aktif dimulai oleh Guru BK: ${teacher.name}`,
            status: "active",
            assigned_by: decoded.userId,
            started_at: new Date()
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: {
          ...newMessage,
          message: decryptSensitiveText(newMessage.message)
        }
      });
    }

    return NextResponse.json(
      { success: false, message: "Akses ditolak." },
      { status: 403 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim pesan chat.", error: error.message },
      { status: 500 }
    );
  }
}
