import { prisma } from "@/lib/db";

/**
 * Calculates student module progress scoped strictly to:
 * Subject modules belonging to subjects of the student's class (class_id)
 * where the student has completed the subject pretest, filtered by placement level.
 */
export async function calculateStudentModuleProgress(
  studentId: number,
  classId: number,
  literacyLevel: string | null
): Promise<{
  progressPercent: number;
  totalAccessible: number;
  completedCount: number;
}> {
  // 1. Get completed module IDs for student
  const completedRecords = await prisma.completedModule.findMany({
    where: { student_id: studentId },
    select: { module_id: true }
  });
  const completedModuleIds = new Set(completedRecords.map(r => r.module_id));

  // 2. Get student subject placement levels
  const studentSubjectLevels = await prisma.studentSubjectLevel.findMany({
    where: { student_id: studentId }
  });

  // 3. Get quiz attempts for student
  const studentAttempts = await prisma.quizAttempt.findMany({
    where: { student_id: studentId },
    include: { quiz: true }
  });

  // 4. Get subjects belonging ONLY to the student's class
  const classSubjects = await prisma.subject.findMany({
    where: { class_id: classId },
    include: {
      quizzes: { where: { type: "pretest" }, select: { id: true } },
      modules: { include: { level: true } }
    }
  });

  const accessibleModuleIds = new Set<number>();

  for (const sub of classSubjects) {
    const subjectLevelRecord = studentSubjectLevels.find(sl => sl.subject_id === sub.id);
    const pretestQuiz = sub.quizzes[0] || null;
    const hasCompletedPretest = !!subjectLevelRecord || (pretestQuiz ? studentAttempts.some(a => a.quiz_id === pretestQuiz.id && !!a.completed_at) : false);

    const currentLevel = subjectLevelRecord?.level_name || "Beginner";
    const targetLevelStr = currentLevel.trim().toLowerCase();

    let subMods = sub.modules.filter(m => {
      if (!m.level || !m.level.name) return true;
      const modLevelStr = m.level.name.trim().toLowerCase();
      return modLevelStr === targetLevelStr ||
        (targetLevelStr.startsWith("advan") && modLevelStr.startsWith("advan")) ||
        (targetLevelStr.startsWith("intermed") && modLevelStr.startsWith("intermed")) ||
        (targetLevelStr.startsWith("basic") && modLevelStr.startsWith("basic")) ||
        (targetLevelStr.startsWith("beginner") && modLevelStr.startsWith("basic")) ||
        (targetLevelStr.startsWith("basic") && modLevelStr.startsWith("beginner"));
    });

    if (subMods.length === 0) {
      subMods = sub.modules;
    }
    subMods.forEach(m => accessibleModuleIds.add(m.id));
  }

  const totalAccessible = accessibleModuleIds.size;
  const completedCount = Array.from(accessibleModuleIds).filter(id => completedModuleIds.has(id)).length;

  const progressPercent = totalAccessible > 0
    ? Math.round((completedCount / totalAccessible) * 100)
    : 0;

  await prisma.siswa.update({
    where: { id: studentId },
    data: { module_progress: progressPercent }
  });

  return {
    progressPercent,
    totalAccessible,
    completedCount
  };
}
