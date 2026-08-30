import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { type: "posttest" },
      },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    let count = 0;
    for (const attempt of attempts) {
      if (attempt.answers.length === 0 && attempt.quiz?.questions?.length > 0) {
        for (const q of attempt.quiz.questions) {
          if (q.options.length > 0) {
            const correctOpt = q.options.find((o) => o.is_correct) || q.options[0];
            const selectedOpt = (attempt.score ?? 0) >= 70 && correctOpt ? correctOpt : q.options[0];
            await prisma.answer.create({
              data: {
                attempt_id: attempt.id,
                question_id: q.id,
                option_id: selectedOpt.id,
              },
            });
            count++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: `Backfilled ${count} answers.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
