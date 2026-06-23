import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, signJWT } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const { identifier, password, role } = await request.json();

    if (!identifier || !password || !role) {
      return NextResponse.json({
        success: false,
        message: "Username/Email dan Password wajib diisi."
      }, { status: 400 });
    }

    if (role !== "student" && role !== "teacher") {
      return NextResponse.json({
        success: false,
        message: "Peran pengguna tidak valid."
      }, { status: 400 });
    }

    // Find user by role and role-specific identifier (NIS/NIP) or Email/Username
    let user;

    if (role === "student") {
      user = await prisma.user.findFirst({
        where: {
          role: "student",
          OR: [
            { email: identifier },
            { username: identifier },
            { student: { nis: identifier } }
          ]
        },
        include: {
          student: true,
          teacher: true
        }
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          role: "teacher",
          OR: [
            { email: identifier },
            { username: identifier },
            { teacher: { nip: identifier } }
          ]
        },
        include: {
          student: true,
          teacher: true
        }
      });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Akun tidak ditemukan. Silakan periksa kembali."
      }, { status: 401 });
    }

    // Verify role matches
    if (user.role !== role) {
      return NextResponse.json({
        success: false,
        message: `Akun ini terdaftar sebagai ${user.role}, bukan ${role}.`
      }, { status: 401 });
    }

    // Verify password
    const isPasswordCorrect = verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({
        success: false,
        message: "Password yang Anda masukkan salah."
      }, { status: 401 });
    }

    // Get name based on profile
    const profileName = user.role === "student" ? user.student?.name : user.teacher?.name;

    // Check if student has completed the pretest
    let hasCompletedPretest = false;
    if (user.role === "student" && user.student) {
      const pretestAttempt = await prisma.quizAttempt.findFirst({
        where: {
          student_id: user.student.id,
          quiz: {
            type: "pretest"
          },
          completed_at: { not: null }
        }
      });
      hasCompletedPretest = !!pretestAttempt;
    }

    // Sign JWT Token
    const token = signJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: profileName,
      hasCompletedPretest
    });

    // Set secure HTTPOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400, // 24 hours
      path: "/",
      sameSite: "lax"
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil! Mengalihkan...",
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        name: profileName,
        hasCompletedPretest
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan sistem saat login.",
      error: error.message
    }, { status: 500 });
  }
}
