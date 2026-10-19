import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

export async function GET() {
  try {
    // 1. Seed Classes
    const defaultClasses = [
      { name: "X MIPA 1", major: "Science" },
      { name: "X MIPA 2", major: "Science" },
      { name: "X IPS 1", major: "Social Studies" },
      { name: "X IPS 2", major: "Social Studies" },
      { name: "XI MIPA 1", major: "Science" },
      { name: "XI MIPA 2", major: "Science" },
      { name: "XI IPS 1", major: "Social Studies" },
      { name: "XI IPS 2", major: "Social Studies" },
      { name: "XII MIPA 1", major: "Science" },
      { name: "XII IPS 1", major: "Social Studies" },
    ];

    const seededClasses = [];
    for (const c of defaultClasses) {
      let existingClass = await prisma.schoolClass.findFirst({
        where: { name: c.name, major: c.major }
      });

      if (!existingClass) {
        existingClass = await prisma.schoolClass.create({
          data: { name: c.name, major: c.major }
        });
      }
      seededClasses.push(existingClass);
    }

    // 1.5. Seed Default Subjects for Classes (Including Literasi Digital)
    for (const cls of seededClasses) {
      const isScience = cls.major === "Science";
      const subjectsForClass = [
        "Literasi Digital",
        "Matematika",
        "Bahasa Indonesia",
        "Bahasa Inggris",
        "Pendidikan Pancasila",
        "Sejarah",
        "Seni Budaya",
        "PJOK"
      ];
      if (isScience) {
        subjectsForClass.push("Fisika", "Kimia", "Biologi");
      } else {
        subjectsForClass.push("Ekonomi", "Geografi", "Sosiologi");
      }

      for (const subName of subjectsForClass) {
        const existingSub = await prisma.subject.findFirst({
          where: { name: subName, class_id: cls.id }
        });
        if (!existingSub) {
          await prisma.subject.create({
            data: {
              name: subName,
              class_id: cls.id,
              teacher_id: null
            }
          });
        }
      }
    }

    // 2. Seed Default Admin User
    const adminUsername = "admin";
    const adminEmail = "admin@digimind.com";
    const adminPass = "adminpassword";

    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: adminUsername },
          { email: adminEmail }
        ]
      }
    });

    if (!adminUser) {
      adminUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: adminUsername,
            email: adminEmail,
            password: hashPassword(adminPass),
            role: "admin",
          }
        });

        await tx.admin.create({
          data: {
            user_id: user.id,
            name: "Super Admin",
            division: "IT Support",
            unit: "Main Office"
          }
        });

        return user;
      });
    }

    // 3. Seed Levels (Beginner, Intermediate, Advanced)
    const defaultLevels = ["Beginner", "Intermediate", "Advanced"];
    const seededLevels = [];
    for (const levelName of defaultLevels) {
      let existingLevel = await prisma.level.findFirst({
        where: { name: levelName }
      });
      if (!existingLevel) {
        existingLevel = await prisma.level.create({
          data: { name: levelName }
        });
      }
      seededLevels.push(existingLevel);
    }

    // 4. Seed Categories ("Digital Literacy", "Mata Pelajaran")
    const defaultCategories = ["Digital Literacy", "Mata Pelajaran"];
    const seededCategories = [];
    for (const catName of defaultCategories) {
      let existingCat = await prisma.category.findFirst({
        where: { name: catName }
      });
      if (!existingCat) {
        existingCat = await prisma.category.create({
          data: { name: catName }
        });
      }
      seededCategories.push(existingCat);
    }

    // Delete old Mental Health category if exists
    const oldMentalCategory = await prisma.category.findFirst({ where: { name: "Mental Health" } });
    if (oldMentalCategory) {
      await prisma.category.delete({ where: { id: oldMentalCategory.id } }).catch(() => {});
    }

    // 5. Seed Initial Pretest Quiz with 29 SRQ-29 Questions
    const srqQuizTitle = "Self Reporting Questionnaire - 29 (SRQ-29)";
    let pretestQuiz = await prisma.quiz.findFirst({
      where: { title: srqQuizTitle, type: "pretest" }
    });

    if (pretestQuiz) {
      await prisma.quiz.delete({
        where: { id: pretestQuiz.id }
      });
      pretestQuiz = null;
    }

    // Also remove old pretests without subject_id
    const oldPretests = await prisma.quiz.findMany({
      where: { type: "pretest", subject_id: null }
    });
    for (const op of oldPretests) {
      await prisma.quiz.delete({ where: { id: op.id } }).catch(() => {});
    }

    pretestQuiz = await prisma.quiz.create({
      data: {
        title: srqQuizTitle,
        type: "pretest",
        module_id: null,
        subject_id: null
      }
    });

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

    // 6. Seed Badges
    const defaultBadges = [
      { name: "Fact-Checker", description: "Membuka modul Literasi Digital Dasar.", image_url: "/badges/fact_checker.png" },
      { name: "Cyber Pioneer", description: "Menyelesaikan kuesioner diagnosis awal SRQ-29.", image_url: "/badges/cyber_pioneer.png" },
      { name: "Digital Citizen", description: "Pendaftaran akun awal di platform DigiMind.", image_url: "/badges/digital_citizen.png" },
    ];
    const seededBadges = [];
    for (const b of defaultBadges) {
      let existingBadge = await prisma.badge.findFirst({
        where: { name: b.name }
      });
      if (!existingBadge) {
        existingBadge = await prisma.badge.create({
          data: {
            name: b.name,
            description: b.description,
            image_url: b.image_url
          }
        });
      }
      seededBadges.push(existingBadge);
    }

    // 7. Seed Level-Adaptive Modules for Literasi Digital Subject
    const levelMap = seededLevels.reduce((acc, lvl) => {
      acc[lvl.name] = lvl.id;
      return acc;
    }, {} as Record<string, number>);

    const digitalLiteracyCategory = await prisma.category.findFirst({ where: { name: "Digital Literacy" } });

    const defaultModules = [
      // Beginner Modules
      {
        title: "Password Bukan Sandi Cinta",
        content: "Keamanan akun dasar. Jangan gunakan kata sandi yang mudah ditebak seperti tanggal lahir atau nama pacar. Gunakan kombinasi huruf besar-kecil, angka, dan simbol unik (min. 8 karakter). Aktifkan juga Two-Factor Authentication (2FA) di akun media sosial penting Anda.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Beginner"
      },
      {
        title: "Jejak Digital, Jejak Seumur Hidup",
        content: "Apa pun yang Anda unggah di internet akan menetap di sana selamanya, meskipun telah Anda hapus. Pikirkan matang-matang konsekuensinya bagi reputasi sekolah dan karir masa depan Anda sebelum memposting sesuatu secara online.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Beginner"
      },
      {
        title: "Scam Alert: Jangan Jadi Korban Klik Asal",
        content: "Cara menghindari penipuan digital (phishing), tautan berhadiah palsu, dan unduhan mencurigakan. Biasakan membedakan situs web resmi berprotokol HTTPS dan domain yang mencurigakan sebelum memasukkan data pribadi.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Beginner"
      },
      {
        title: "Posting Boleh, Nyolong Jangan",
        content: "Mengenal etika hak cipta sederhana. Selalu cantumkan sumber atau gunakan lisensi Creative Commons saat mengambil gambar, musik, atau kutipan di internet untuk keperluan tugas video atau presentasi sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Beginner"
      },
      {
        title: "Like, Share, Think!",
        content: "Saring sebelum sharing. Pelajari bahaya menyebarkan berita bohong (hoaks) dan pesan berantai tanpa verifikasi. Selalu cari kebenaran suatu informasi di situs resmi atau media berita terpercaya sebelum membagikannya.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Beginner"
      },

      // Intermediate Modules
      {
        title: "Privasi Bukan Rahasia Umum",
        content: "Panduan praktis mengatur preferensi privasi akun media sosial Anda secara mendalam. Pelajari cara membatasi siapa saja yang bisa melihat informasi personal, nomor HP, email, dan melacak riwayat lokasi Anda.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Intermediate"
      },
      {
        title: "Speak Up! Tapi Tetap Respect",
        content: "Bagaimana mengekspresikan pendapat secara sehat di ruang komentar. Pelajari teknik berargumentasi yang kritis tanpa harus menghujat, menghina fisik, atau melanggar norma hukum (UU ITE).",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Intermediate"
      },
      {
        title: "Cyberbullying = Nggak Keren",
        content: "Cara mencegah perundungan siber di kalangan teman sekolah. Pelajari cara merespons sebagai korban atau saksi mata, serta mekanisme pelaporan pelaku perundungan ke platform media sosial resmi.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Intermediate"
      },
      {
        title: "From Meme to Movement",
        content: "Aktivisme digital sederhana di sekolah. Bagaimana menggunakan kekuatan media sosial dan infografis secara kreatif untuk menyebarkan pesan kepedulian sosial, kebersihan, atau kesehatan di lingkungan sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Intermediate"
      },
      {
        title: "Digitalpreneur Muda",
        content: "Memanfaatkan platform digital untuk wirausaha kreatif secara sehat. Pelajari pengenalan dasar dropshipping, pembuatan toko digital, pemasaran lewat konten kreatif, dan manajemen keuangan sederhana.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Intermediate"
      },

      // Advanced Modules
      {
        title: "Digital Guardian",
        content: "Merancang peran sebagai mentor sebaya (Peer Mentor) dalam bidang keamanan digital di kelas. Pelajari bagaimana mendampingi teman sekelas yang mengalami perundungan siber atau peretasan akun sosial media.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Advanced"
      },
      {
        title: "Online Debater Pro",
        content: "Strategi menyampaikan data kredibel saat berdiskusi di internet. Cara membedakan bias konfirmasi, menyajikan data statistik yang valid, dan merespons argumentasi lawan bicara dengan kepala dingin dan etis.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Advanced"
      },
      {
        title: "Campaign Against Hate Speech",
        content: "Langkah terstruktur merancang kampanye sosial berskala sekolah. Mulai dari pembuatan narasi kreatif anti-hoaks, poster infografis digital, hingga kolaborasi kampanye massal di lingkungan sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Advanced"
      },
      {
        title: "Tech for Good",
        content: "Mengeksplorasi pemecahan masalah sosial dan lingkungan sekitar menggunakan teknologi digital atau AI. Merancang purwarupa (mockup) aplikasi sederhana yang bermanfaat bagi masyarakat sekitar sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Advanced"
      },
      {
        title: "StartUp Garage",
        content: "Simulasi mendirikan perusahaan rintisan digital skala mikro. Merumuskan Value Proposition Canvas, memetakan masalah pengguna, dan mempresentasikan ide bisnis digital di depan kelas.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        level_name: "Advanced"
      }
    ];

    let seededModulesCount = 0;
    for (const m of defaultModules) {
      const levelId = levelMap[m.level_name];
      if (!levelId || !digitalLiteracyCategory) continue;

      let existingModule = await prisma.module.findFirst({
        where: {
          title: m.title,
          level_id: levelId
        }
      });

      if (!existingModule) {
        existingModule = await prisma.module.create({
          data: {
            title: m.title,
            content: m.content,
            video_url: m.video_url,
            media_type: m.media_type,
            level_id: levelId,
            category_id: digitalLiteracyCategory.id
          }
        });
        seededModulesCount++;
      }
    }

    // 8. Seed Subject Pretests (10 - 15 questions per subject for level placement)
    const allSubjects = await prisma.subject.findMany();

    const generateSubjectPretestQuestions = (subName: string) => {
      const questions = [];
      for (let i = 1; i <= 10; i++) {
        questions.push({
          question: `[Pretest ${subName}] Soal ${i}: Manakah pernyataan berikut yang mendeskripsikan pemahaman konsep materi ${subName} dengan tepat?`,
          options: [
            { text: `A. Prinsip utama dan analisis mendalam tentang ${subName} (Tepat & Lengkap)`, isCorrect: true },
            { text: `B. Penjelasan umum dasar mengenai ${subName} tanpa penerapan`, isCorrect: false },
            { text: `C. Pendapat sekilas yang belum teruji faktanya`, isCorrect: false },
            { text: `D. Pernyataan yang kurang relevan dengan ${subName}`, isCorrect: false }
          ]
        });
      }
      return questions;
    };

    for (const sub of allSubjects) {
      let existingSubPretest = await prisma.quiz.findFirst({
        where: { subject_id: sub.id, type: "pretest" }
      });

      if (!existingSubPretest) {
        existingSubPretest = await prisma.quiz.create({
          data: {
            title: `Pretest Penempatan Level: ${sub.name}`,
            type: "pretest",
            subject_id: sub.id,
            module_id: null
          }
        });

        const questionsList = generateSubjectPretestQuestions(sub.name);
        for (const q of questionsList) {
          const qObj = await prisma.question.create({
            data: {
              quiz_id: existingSubPretest.id,
              question: q.question
            }
          });

          for (const opt of q.options) {
            await prisma.option.create({
              data: {
                question_id: qObj.id,
                option_text: opt.text,
                is_correct: opt.isCorrect
              }
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with SRQ-29 initial pretest, subject pretests, and modules!",
      classesCount: seededClasses.length,
      levelsCount: seededLevels.length,
      categoriesCount: seededCategories.length,
      srq29Created: "29 SRQ questions seeded.",
      badgesCount: seededBadges.length,
      modulesCount: seededModulesCount,
      adminUser: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        note: "Use password 'adminpassword' to login as admin."
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Database seeding failed.",
      error: error.message
    }, { status: 500 });
  }
}
