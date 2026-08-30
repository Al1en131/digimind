import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJWT, hashPassword } from "@/lib/auth-utils";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json({
        success: false,
        message: "Akses ditolak."
      }, { status: 401 });
    }

    const teacher = await prisma.guru.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!teacher) {
      return NextResponse.json({
        success: false,
        message: "Profil guru tidak ditemukan."
      }, { status: 404 });
    }

    const { name, specialization, position, phone_number, password, class_id } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "Nama tidak boleh kosong."
      }, { status: 400 });
    }

    // Update User and Guru in transaction
    const userUpdateData: any = {};
    if (password && password.trim() !== "") {
      userUpdateData.password = hashPassword(password);
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: decoded.userId },
          data: userUpdateData
        });
      }

      const updateData: any = {
        name: name.trim(),
        specialization: specialization || null,
        position: position || null,
        phone_number: phone_number || null,
      };

      if (class_id !== undefined) {
        updateData.class_id = class_id ? parseInt(class_id) : null;
      }

      await tx.guru.update({
        where: { id: teacher.id },
        data: updateData
      });
    });

    return NextResponse.json({
      success: true,
      message: "Profil guru berhasil diperbarui!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal memperbarui profil guru.",
      error: error.message
    }, { status: 500 });
  }
}
