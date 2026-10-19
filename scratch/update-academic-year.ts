import { prisma } from "../src/lib/db";

async function main() {
  const updated = await prisma.schoolClass.updateMany({
    where: { academic_year: null },
    data: { academic_year: "2025/2026" },
  });
  console.log("Updated classes with academic_year:", updated.count);

  const classes = await prisma.schoolClass.findMany();
  console.log("Current classes:", classes.map(c => ({ id: c.id, name: c.name, major: c.major, year: c.academic_year })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
