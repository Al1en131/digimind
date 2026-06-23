import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, username, email, password } = body;

    // Validate common fields
    if (!role || !username || !email || !password) {
      return NextResponse.json({
        success: false,
        message: "Semua kolom wajib diisi."
      }, { status: 400 });
    }

    if (role !== "student" && role !== "teacher") {
      return NextResponse.json({
        success: false,
        message: "Peran pengguna tidak valid."
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUsername) {
      return NextResponse.json({
        success: false,
        message: "Username sudah digunakan oleh orang lain."
      }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail) {
      return NextResponse.json({
        success: false,
        message: "Email sudah digunakan oleh orang lain."
      }, { status: 400 });
    }

    // Process registration based on role
    if (role === "student") {
      const { name, class_id, nis } = body;
      if (!name || !class_id || !nis) {
        return NextResponse.json({
          success: false,
          message: "Nama, Kelas, dan NIS wajib diisi untuk siswa."
        }, { status: 400 });
      }

      // Check if NIS is already registered
      const existingNis = await prisma.siswa.findUnique({
        where: { nis }
      });
      if (existingNis) {
        return NextResponse.json({
          success: false,
          message: "NIS sudah terdaftar di sistem."
        }, { status: 400 });
      }

      // Verify class exists
      const targetClass = await prisma.schoolClass.findUnique({
        where: { id: parseInt(class_id) }
      });
      if (!targetClass) {
        return NextResponse.json({
          success: false,
          message: "Kelas yang dipilih tidak valid."
        }, { status: 400 });
      }

      // Create student user in transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            password: hashPassword(password),
            role: "student"
          }
        });

        await tx.siswa.create({
          data: {
            user_id: user.id,
            class_id: parseInt(class_id),
            nis,
            name,
            literacy_level: "Beginner", // default value
            mental_level: "Stable",     // default value
            risk_flag: false
          }
        });
      });

    } else if (role === "teacher") {
      const { name, nip, specialization, position, phone_number } = body;
      if (!name || !nip) {
        return NextResponse.json({
          success: false,
          message: "Nama dan NIP wajib diisi untuk guru."
        }, { status: 400 });
      }

      // Check if NIP is already registered
      const existingNip = await prisma.guru.findUnique({
        where: { nip }
      });
      if (existingNip) {
        return NextResponse.json({
          success: false,
          message: "NIP sudah terdaftar di sistem."
        }, { status: 400 });
      }

      // Create teacher user in transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            password: hashPassword(password),
            role: "teacher"
          }
        });

        await tx.guru.create({
          data: {
            user_id: user.id,
            nip,
            name,
            specialization,
            position,
            phone_number
          }
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan masuk."
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan sistem saat registrasi.",
      error: error.message
    }, { status: 500 });
  }
}
