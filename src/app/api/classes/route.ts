import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const classes = await prisma.schoolClass.findMany({
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
