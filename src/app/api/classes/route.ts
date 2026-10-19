import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function formatAcademicYear(dateInput: Date | string | null | undefined, explicitYear?: string | null): string {
  if (explicitYear && explicitYear.trim()) return explicitYear.trim();
  if (!dateInput) return "2025/2026";
  const d = new Date(dateInput);
  const year = isNaN(d.getFullYear()) ? 2025 : d.getFullYear();
  return `${year}/${year + 1}`;
}

export async function GET() {
  try {
    const classes = await prisma.schoolClass.findMany({
      include: {
        subjects: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: [
        { name: "asc" },
        { major: "asc" },
      ],
    });

    const formattedClasses = classes.map((c) => {
      const classYear = formatAcademicYear(c.created_at, c.academic_year);
      const fullClassName = c.major ? `${c.name} ${c.major}` : c.name;
      return {
        id: c.id,
        name: c.name,
        major: c.major,
        academic_year: c.academic_year || classYear,
        year: classYear,
        academicYear: `TA ${classYear}`,
        displayName: `${fullClassName} • TA ${classYear}`,
        subjects: c.subjects,
      };
    });

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
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
    const { name, major, academic_year } = await request.json();
    if (!name || !major) {
      return NextResponse.json({
        success: false,
        message: "Nama kelas dan jurusan wajib diisi."
      }, { status: 400 });
    }

    const existingClass = await prisma.schoolClass.findFirst({
      where: {
        name: name.trim(),
        major: major.trim(),
      }
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
        major: major.trim(),
        academic_year: academic_year ? academic_year.trim() : "2025/2026"
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
