import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, signJWT } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        message: "Username/Email dan Password wajib diisi."
      }, { status: 400 });
    }

    // Find admin user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier }
        ],
        role: "admin"
      },
      include: {
        admin: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Akun Admin tidak ditemukan atau tidak memiliki hak akses."
      }, { status: 401 });
    }

    // Verify password
    const isPasswordCorrect = verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({
        success: false,
        message: "Password Admin yang Anda masukkan salah."
      }, { status: 401 });
    }

    const adminName = user.admin?.name || "Admin";

    // Sign JWT Token
    const token = signJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: "admin",
      name: adminName
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
      message: "Login Admin berhasil! Mengalihkan ke panel admin...",
      user: {
        username: user.username,
        email: user.email,
        role: "admin",
        name: adminName
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan sistem saat login admin.",
      error: error.message
    }, { status: 500 });
  }
}
