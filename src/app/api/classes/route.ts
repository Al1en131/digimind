import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const classes = await prisma.schoolClass.findMany({
      include: {
        subjects: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal mengambil data kelas.",
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, major } = await request.json();
    if (!name || !major) {
      return NextResponse.json({
        success: false,
        message: "Nama kelas dan jurusan wajib diisi."
      }, { status: 400 });
    }

    const existingClass = await prisma.schoolClass.findFirst({
      where: { name: name.trim() }
    });

    if (existingClass) {
      return NextResponse.json({
        success: true,
        message: "Kelas sudah terdaftar.",
        class: existingClass
      });
    }

    const newClass = await prisma.schoolClass.create({
      data: {
        name: name.trim(),
        major: major.trim()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Kelas baru berhasil dibuat.",
      class: newClass
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Gagal membuat kelas baru.",
      error: error.message
    }, { status: 500 });
  }
}
