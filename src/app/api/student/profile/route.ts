import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT } from "@/lib/auth-utils";

export async function PUT(request: Request) {
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

    const { name, username, avatar } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "Nama tidak boleh kosong."
      }, { status: 400 });
    }

    if (!username || username.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "Username tidak boleh kosong."
      }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: cleanUsername,
        id: { not: decoded.userId }
      }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "Username sudah digunakan oleh pengguna lain."
      }, { status: 400 });
    }

    // Update User and Siswa in transaction
    const [updatedUser, updatedStudent] = await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { username: cleanUsername }
      }),
      prisma.siswa.update({
        where: { id: student.id },
        data: {
          name: name.trim(),
          avatar: avatar
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui!",
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        username: updatedUser.username,
        avatar: updatedStudent.avatar
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui profil.";
    return NextResponse.json({
      success: false,
      message: "Gagal memperbarui profil.",
      error: errorMessage
    }, { status: 500 });
  }
}
