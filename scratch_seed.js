const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "digimind",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const srqQuestions = [
  "Apakah anda sering merasa sakit kepala?",
  "Apakah anda kehilangan nafsu makan?",
  "Apakah tidur anda tidak nyenyak?",
  "Apakah anda mudah merasa takut?",
  "Apakah anda merasa cemas, tegang, atau khawatir?",
  "Apakah tangan anda gemetar?",
  "Apakah anda mengalami gangguan pencernaan?",
  "Apakah anda merasa sulit berpikir jernih?",
  "Apakah anda merasa tidak bahagia?",
  "Apakah anda lebih sering menangis?",
  "Apakah anda merasa sulit untuk menikmati aktivitas sehari-hari?",
  "Apakah anda mengalami kesulitan untuk mengambil keputusan?",
  "Apakah aktivitas/ tugas sehari-hari anda terbengkalai?",
  "Apakah anda merasa tidak mampu berperan dalam kehidupan ini?",
  "Apakah anda kehilangan minat terhadap banyak hal?",
  "Apakah anda merasa tidak berharga?",
  "Apakah anda mempunyai pikiran untuk mengakhiri hidup anda?",
  "Apakah anda merasa lelah sepanjang waktu?",
  "Apakah anda merasa tidak enak di perut?",
  "Apakah anda mudah lelah?",
  "Apakah anda minum alkohol lebih banyak dari biasanya atau apakah anda menggunakan narkoba?",
  "Apakah anda yakin bahwa seseorang mencoba mencelakai anda dengan cara tertentu?",
  "Apakah ada yang mengganggu atau hal yang tidak biasa dalam pikiran anda?",
  "Apakah anda pernah mendengar suara tanpa tahu sumbernya atau yang orang lain dapat mendengar?",
  "Apakah anda mengalami mimpi yang mengganggu tentang suatu bencana/ musibah atau adakah saat-saat anda seolah mengalami kembali kejadian bencana itu?",
  "Apakah anda menghindari kegiatan, tempat, orang atau pikiran yang mengingatkan anda akan bencana tersebut?",
  "Apakah minat anda terhadap teman dan kegiatan yang biasa anda lakukan berkurang?",
  "Apakah anda merasa sangat terganggu jika berada dalam situasi yang mengingatkan anda akan bencana atau jika anda berpikir tentang bencana itu?",
  "Apakah anda kesulitan memahami atau mengekspresikan perasaan anda?"
];

async function seed() {
  console.log("Seeding database with SRQ-29...");

  const oldPretests = await prisma.quiz.findMany({
    where: { type: "pretest", subject_id: null }
  });
  for (const op of oldPretests) {
    await prisma.quiz.delete({ where: { id: op.id } }).catch(() => {});
  }

  const pretestQuiz = await prisma.quiz.create({
    data: {
      title: "Self Reporting Questionnaire - 29 (SRQ-29)",
      type: "pretest",
      module_id: null,
      subject_id: null
    }
  });

  for (let i = 0; i < srqQuestions.length; i++) {
    const qText = srqQuestions[i];
    const questionObj = await prisma.question.create({
      data: {
        quiz_id: pretestQuiz.id,
        question: qText
      }
    });

    await prisma.option.createMany({
      data: [
        { question_id: questionObj.id, option_text: "Y (YA)", is_correct: true },
        { question_id: questionObj.id, option_text: "T (TIDAK)", is_correct: false }
      ]
    });
  }

  console.log("SUCCESS! Created SRQ-29 quiz ID:", pretestQuiz.id, "with 29 questions.");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
