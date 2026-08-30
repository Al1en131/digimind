import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT, verifyPassword, hashPassword } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded) {
      return NextResponse.json({
        success: false,
        message: "Akses ditolak. Silakan login kembali."
      }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        message: "Password lama dan password baru wajib diisi."
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan."
      }, { status: 404 });
    }

    const isPasswordCorrect = verifyPassword(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({
        success: false,
        message: "Password lama salah."
      }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword(newPassword)
      }
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal mengubah password.",
      error: error.message
    }, { status: 500 });
  }
}
