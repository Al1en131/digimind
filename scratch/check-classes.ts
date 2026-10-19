import { prisma } from "../src/lib/db";

async function main() {
  const classes = await prisma.schoolClass.findMany({
    include: {
      students: { select: { id: true, name: true, nis: true } },
      subjects: { select: { id: true, name: true } },
    }
  });
  console.log("CLASSES:", JSON.stringify(classes, null, 2));

  const students = await prisma.siswa.findMany({
    select: {
      id: true,
      name: true,
      nis: true,
      class_id: true,
      class: { select: { id: true, name: true, major: true, academic_year: true } },
      quiz_attempts: { select: { id: true, quiz: { select: { title: true, subject_id: true } } } },
      completed_modules: { select: { id: true, module: { select: { title: true, subject_id: true } } } }
    }
  });
  console.log("STUDENTS:", JSON.stringify(students, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
