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

    // 4. Seed Categories (Digital Literacy, Mental Health)
    const defaultCategories = ["Digital Literacy", "Mental Health"];
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

    // 5. Seed Pretest Quiz with 15 Questions and Options
    const quizTitle = "Pretest Literasi & Kesehatan Mental Digital";
    let pretestQuiz = await prisma.quiz.findFirst({
      where: { title: quizTitle, type: "pretest" }
    });

    // If pretest exists, we drop it to reseed with the new 15 questions structure
    if (pretestQuiz) {
      await prisma.quiz.delete({
        where: { id: pretestQuiz.id }
      });
      pretestQuiz = null;
    }

    if (!pretestQuiz) {
      pretestQuiz = await prisma.quiz.create({
        data: {
          title: quizTitle,
          type: "pretest",
          module_id: null // Global test
        }
      });

      const pretestQuestions = [
        // ==========================================
        // LITERASI DIGITAL (8 QUESTIONS TOTAL)
        // ==========================================
        {
          question: "[Literasi Digital Dasar] Saat mencari informasi di internet, bagaimana cara kamu memastikan informasi itu benar?",
          options: [
            { text: "A. Langsung percaya jika banyak orang membagikan", isCorrect: false }, // 1 pt
            { text: "B. Membandingkan dengan 1 sumber lain", isCorrect: false },            // 2 pt
            { text: "C. Mengecek dari sumber resmi/lebih dari 3 sumber berbeda", isCorrect: true }, // 4 pt
            { text: "D. Tidak terlalu peduli", isCorrect: false }                            // 1 pt
          ]
        },
        {
          question: "[Literasi Digital Dasar] Ketika menerima pesan berantai di WhatsApp/medsos, apa yang biasanya kamu lakukan?",
          options: [
            { text: "A. Langsung meneruskan", isCorrect: false },                            // 1 pt
            { text: "B. Membaca saja tanpa cek", isCorrect: false },                        // 2 pt
            { text: "C. Memverifikasi dulu sebelum membagikan", isCorrect: true },          // 4 pt
            { text: "D. Mengingatkan teman untuk berhati-hati", isCorrect: false }          // 3 pt
          ]
        },
        {
          question: "[Literasi Digital Dasar] Bagaimana kamu menjaga keamanan akun digitalmu?",
          options: [
            { text: "A. Menggunakan kata sandi sederhana", isCorrect: false },               // 1 pt
            { text: "B. Menggunakan 1 password untuk semua akun", isCorrect: false },       // 2 pt
            { text: "C. Menggunakan password berbeda + autentikasi ganda", isCorrect: true }, // 4 pt
            { text: "D. Membiarkan teman mengetahui password", isCorrect: false }            // 1 pt
          ]
        },
        {
          question: "[Literasi Digital Lanjutan] Saat membuat konten digital (tugas video/presentasi), apakah kamu sudah memperhatikan hak cipta (musik, gambar, kutipan)?",
          options: [
            { text: "A. Tidak pernah", isCorrect: false },                                   // 1 pt
            { text: "B. Kadang-kadang", isCorrect: false },                                 // 2 pt
            { text: "C. Sering", isCorrect: false },                                         // 3 pt
            { text: "D. Selalu", isCorrect: true }                                           // 4 pt
          ]
        },
        {
          question: "[Literasi Digital Lanjutan] Bagaimana sikapmu jika menemukan ujaran kebencian atau cyberbullying di media sosial?",
          options: [
            { text: "A. Diam saja", isCorrect: false },                                       // 1 pt
            { text: "B. Ikut menanggapi dengan emosi", isCorrect: false },                   // 2 pt
            { text: "C. Melaporkan ke pihak berwenang/platform", isCorrect: true },          // 4 pt
            { text: "D. Mengingatkan dengan cara baik", isCorrect: false }                   // 3 pt
          ]
        },
        {
          question: "[Literasi Digital Lanjutan] Jika kamu menerima email dari bank yang meminta klik link untuk mengganti password segera, apa tindakanmu?",
          options: [
            { text: "A. Langsung klik link tersebut", isCorrect: false },                    // 1 pt
            { text: "B. Mengabaikannya tanpa melapor", isCorrect: false },                   // 2 pt
            { text: "C. Menghubungi call center resmi bank untuk konfirmasi", isCorrect: true }, // 4 pt
            { text: "D. Menghapus email dan tidak melakukan apa-apa", isCorrect: false }     // 3 pt
          ]
        },
        {
          question: "[Literasi Digital Dasar] Saat menggunakan Wi-Fi publik di kafe, tindakan pencegahan apa yang paling tepat dilakukan?",
          options: [
            { text: "A. Langsung login akun bank/belanja online", isCorrect: false },        // 1 pt
            { text: "B. Menggunakan sesuka hati karena menghemat kuota", isCorrect: false }, // 2 pt
            { text: "C. Menghindari transaksi penting dan menggunakan VPN jika ada", isCorrect: true }, // 4 pt
            { text: "D. Hanya membuka media sosial saja", isCorrect: false }                 // 3 pt
          ]
        },
        {
          question: "[Literasi Digital Lanjutan] Mengapa penting untuk memeriksa tanggal publikasi sebuah artikel ilmiah/berita di internet?",
          options: [
            { text: "A. Tidak penting, semua informasi di internet selalu relevan", isCorrect: false }, // 1 pt
            { text: "B. Hanya penting untuk tugas sekolah", isCorrect: false },                 // 2 pt
            { text: "C. Memastikan informasi tersebut masih relevan dan belum kadaluarsa", isCorrect: true }, // 4 pt
            { text: "D. Agar data presentasi terlihat lebih profesional", isCorrect: false }    // 3 pt
          ]
        },
        // ==========================================
        // KESEHATAN MENTAL (6 QUESTIONS TOTAL)
        // ==========================================
        {
          question: "[Kesehatan Mental Digital] Rata-rata berapa lama kamu menggunakan gawai per hari di luar belajar?",
          options: [
            { text: "A. >8 jam", isCorrect: false },                                         // 1 pt
            { text: "B. 5–7 jam", isCorrect: false },                                       // 2 pt
            { text: "C. 2–4 jam", isCorrect: false },                                       // 3 pt
            { text: "D. <2 jam", isCorrect: true }                                           // 4 pt
          ]
        },
        {
          question: "[Kesehatan Mental Digital] Jika terlalu lama online, apa yang sering kamu rasakan?",
          options: [
            { text: "A. Lelah/tidak fokus", isCorrect: false },                              // 2 pt
            { text: "B. Cemas/khawatir", isCorrect: false },                                 // 1 pt
            { text: "C. Sering membandingkan diri dengan orang lain", isCorrect: false },   // 1 pt
            { text: "D. Tidak ada masalah, saya merasa tenang", isCorrect: true }            // 4 pt
          ]
        },
        {
          question: "[Kesehatan Mental Digital] Ketika merasa stres karena tugas online/media sosial, biasanya kamu:",
          options: [
            { text: "A. Terus scrolling hingga lupa waktu", isCorrect: false },              // 1 pt
            { text: "B. Mengeluh ke teman", isCorrect: false },                             // 2 pt
            { text: "C. Istirahat sejenak, lakukan aktivitas offline", isCorrect: true },    // 4 pt
            { text: "D. Mencari bantuan (guru/konselor/keluarga)", isCorrect: false }       // 3 pt
          ]
        },
        {
          question: "[Kesehatan Mental Digital] Apakah kamu sudah memiliki rutinitas sehat terkait gawai? (misalnya: screen time, istirahat mata, tidur cukup)",
          options: [
            { text: "A. Tidak pernah", isCorrect: false },                                   // 1 pt
            { text: "B. Kadang-kadang", isCorrect: false },                                 // 2 pt
            { text: "C. Sering", isCorrect: false },                                         // 3 pt
            { text: "D. Selalu", isCorrect: true }                                           // 4 pt
          ]
        },
        {
          question: "[Kesehatan Mental Digital] Apakah kamu merasa cemas atau takut ketinggalan informasi (FOMO) ketika tidak membuka media sosial selama beberapa jam?",
          options: [
            { text: "A. Selalu merasa cemas dan tidak tenang", isCorrect: false },           // 1 pt
            { text: "B. Sering merasa khawatir", isCorrect: false },                         // 2 pt
            { text: "C. Kadang-kadang memikirkannya", isCorrect: false },                    // 3 pt
            { text: "D. Tidak peduli sama sekali dan merasa tenang", isCorrect: true }       // 4 pt
          ]
        },
        {
          question: "[Kesehatan Mental Digital] Bagaimana kualitas tidurmu ketika menggunakan gawai tepat sebelum tidur?",
          options: [
            { text: "A. Sangat terganggu dan sering tidur larut malam", isCorrect: false },   // 1 pt
            { text: "B. Kadang-kadang sulit tidur", isCorrect: false },                      // 2 pt
            { text: "C. Cukup baik karena dibatasi waktu penggunaannya", isCorrect: false }, // 3 pt
            { text: "D. Sangat baik, saya mematikan gawai 1 jam sebelum tidur", isCorrect: true } // 4 pt
          ]
        },
        // ==========================================
        // HARAPAN & ADAPTASI (1 QUESTION - PREFERENCE)
        // ==========================================
        {
          question: "[Harapan & Adaptasi] Apa yang paling kamu butuhkan dari pembelajaran berbasis AI?",
          options: [
            { text: "A. Bimbingan step by step saat belajar teknologi", isCorrect: true },
            { text: "B. Saran untuk mengatur waktu online dengan sehat", isCorrect: false },
            { text: "C. Tantangan belajar yang sesuai kemampuan", isCorrect: false },
            { text: "D. Dukungan motivasi dan konseling ringan", isCorrect: false }
          ]
        }
      ];

      for (const q of pretestQuestions) {
        const questionObj = await prisma.question.create({
          data: {
            quiz_id: pretestQuiz.id,
            question: q.question
          }
        });

        for (const o of q.options) {
          await prisma.option.create({
            data: {
              question_id: questionObj.id,
              option_text: o.text,
              is_correct: o.isCorrect
            }
          });
        }
      }
    }

    // 6. Seed Badges
    const defaultBadges = [
      { name: "Fact-Checker", description: "Membuka modul Literasi Digital Dasar.", image_url: "/badges/fact_checker.png" },
      { name: "Screen Guard", description: "Membuka modul Kesehatan Mental Digital.", image_url: "/badges/screen_guard.png" },
      { name: "Cyber Pioneer", description: "Menyelesaikan kuesioner diagnosis awal pertama kali.", image_url: "/badges/cyber_pioneer.png" },
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

    // 7. Seed Modules with Level Matrix
    const levelMap = seededLevels.reduce((acc, lvl) => {
      acc[lvl.name] = lvl.id;
      return acc;
    }, {} as Record<string, number>);

    const catMap = seededCategories.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    const defaultModules = [
      // Beginner Modules
      {
        title: "Password Bukan Sandi Cinta",
        content: "Keamanan akun dasar. Jangan gunakan kata sandi yang mudah ditebak seperti tanggal lahir atau nama pacar. Gunakan kombinasi huruf besar-kecil, angka, dan simbol unik (min. 8 karakter). Aktifkan juga Two-Factor Authentication (2FA) di akun media sosial penting Anda.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Beginner"
      },
      {
        title: "Jejak Digital, Jejak Seumur Hidup",
        content: "Apa pun yang Anda unggah di internet akan menetap di sana selamanya, meskipun telah Anda hapus. Pikirkan matang-matang konsekuensinya bagi reputasi sekolah dan karir masa depan Anda sebelum memposting sesuatu secara online.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Beginner"
      },
      {
        title: "Scam Alert: Jangan Jadi Korban Klik Asal",
        content: "Cara menghindari penipuan digital (phishing), tautan berhadiah palsu, dan unduhan mencurigakan. Biasakan membedakan situs web resmi berprotokol HTTPS dan domain yang mencurigakan sebelum memasukkan data pribadi.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Beginner"
      },
      {
        title: "Posting Boleh, Nyolong Jangan",
        content: "Mengenal etika hak cipta sederhana. Selalu cantumkan sumber atau gunakan lisensi Creative Commons saat mengambil gambar, musik, atau kutipan di internet untuk keperluan tugas video atau presentasi sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Beginner"
      },
      {
        title: "Like, Share, Think!",
        content: "Saring sebelum sharing. Pelajari bahaya menyebarkan berita bohong (hoaks) dan pesan berantai tanpa verifikasi. Selalu cari kebenaran suatu informasi di situs resmi atau media berita terpercaya sebelum membagikannya.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Beginner"
      },
      {
        title: "Me Time, Not Screen Time",
        content: "Memahami batasan screen time harian Anda. Kenali tanda-tanda kecanduan gawai, seperti mata lelah, sulit fokus, dan insomnia. Pelajari pentingnya menyeimbangkan waktu layar gawai dengan aktivitas fisik di dunia nyata.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Beginner"
      },
      {
        title: "Scroll Sehat, Hati Sehat",
        content: "Menjaga stabilitas emosi saat bersosial media. Sadari pengaruh durasi scrolling berlebih terhadap suasana hati Anda. Kurangi kebiasaan membandingkan diri Anda dengan profil orang lain secara berlebihan.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Beginner"
      },

      // Intermediate Modules
      {
        title: "Privasi Bukan Rahasia Umum",
        content: "Panduan praktis mengatur preferensi privasi akun media sosial Anda secara mendalam. Pelajari cara membatasi siapa saja yang bisa melihat informasi personal, nomor HP, email, dan melacak riwayat lokasi Anda.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Intermediate"
      },
      {
        title: "Speak Up! Tapi Tetap Respect",
        content: "Bagaimana mengekspresikan pendapat secara sehat di ruang komentar. Pelajari teknik berargumentasi yang kritis tanpa harus menghujat, menghina fisik, atau melanggar norma hukum (UU ITE).",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Intermediate"
      },
      {
        title: "Cyberbullying = Nggak Keren",
        content: "Cara mencegah perundungan siber di kalangan teman sekolah. Pelajari cara merespons sebagai korban atau saksi mata, serta mekanisme pelaporan pelaku perundungan ke platform media sosial resmi.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Intermediate"
      },
      {
        title: "From Meme to Movement",
        content: "Aktivisme digital sederhana di sekolah. Bagaimana menggunakan kekuatan media sosial dan infografis secara kreatif untuk menyebarkan pesan kepedulian sosial, kebersihan, atau kesehatan di lingkungan sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Intermediate"
      },
      {
        title: "Digitalpreneur Muda",
        content: "Memanfaatkan platform digital untuk wirausaha kreatif secara sehat. Pelajari pengenalan dasar dropshipping, pembuatan toko digital, pemasaran lewat konten kreatif, dan manajemen keuangan sederhana.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Intermediate"
      },
      {
        title: "Mindful Online, Mindful Life",
        content: "Mempraktikkan kesadaran penuh (mindfulness) saat menggunakan internet. Pelajari teknik meditasi pernapasan 5 menit untuk meredakan kepenatan akibat tugas sekolah yang menumpuk di gawai.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Intermediate"
      },
      {
        title: "Balance Your Feed",
        content: "Mengurasi timeline sosial media Anda. Pelajari cara men-unfollow atau menyembunyikan postingan toxic yang memicu rasa tidak aman (insecure), dan menggantinya dengan akun-akun edukatif serta positif.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Intermediate"
      },

      // Advanced Modules
      {
        title: "Digital Guardian",
        content: "Merancang peran sebagai mentor sebaya (Peer Mentor) dalam bidang keamanan digital di kelas. Pelajari bagaimana mendampingi teman sekelas yang mengalami perundungan siber atau peretasan akun sosial media.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Advanced"
      },
      {
        title: "Online Debater Pro",
        content: "Strategi menyampaikan data kredibel saat berdiskusi di internet. Cara membedakan bias konfirmasi, menyajikan data statistik yang valid, dan merespons argumentasi lawan bicara dengan kepala dingin dan etis.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Advanced"
      },
      {
        title: "Campaign Against Hate Speech",
        content: "Langkah terstruktur merancang kampanye sosial berskala sekolah. Mulai dari pembuatan narasi kreatif anti-hoaks, poster infografis digital, hingga kolaborasi kampanye massal di lingkungan sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Advanced"
      },
      {
        title: "Tech for Good",
        content: "Mengeksplorasi pemecahan masalah sosial dan lingkungan sekitar menggunakan teknologi digital atau AI. Merancang purwarupa (mockup) aplikasi sederhana yang bermanfaat bagi masyarakat sekitar sekolah.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Advanced"
      },
      {
        title: "StartUp Garage",
        content: "Simulasi mendirikan perusahaan rintisan digital skala mikro. Merumuskan Value Proposition Canvas, memetakan masalah pengguna, dan mempresentasikan ide bisnis digital di depan kelas.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Digital Literacy",
        level_name: "Advanced"
      },
      {
        title: "Digital Detox Challenge",
        content: "Tantangan detoks digital terstruktur selama 3 hari. Panduan langkah demi langkah membatasi gawai di luar belajar, mematikan notifikasi non-penting, dan mencatat jurnal refleksi emosional Anda.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Advanced"
      },
      {
        title: "Be a Digital Mentor",
        content: "Menjadi teladan digital (role model) dalam menerapkan konsep digital wellbeing bagi siswa tingkat di bawah Anda. Pelajari teknik membimbing adik-adik kelas dalam mengatur waktu layar gawai secara mandiri.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        media_type: "youtube",
        category_name: "Mental Health",
        level_name: "Advanced"
      }
    ];

    // 8. Define Posttest Questions Matrix for each module title
    const posttestMap: Record<string, { question: string; options: { text: string; isCorrect: boolean }[] }[]> = {
      "Password Bukan Sandi Cinta": [
        {
          question: "Apa kombinasi terbaik untuk membuat kata sandi (password) yang aman?",
          options: [
            { text: "A. Nama panggilan + tanggal lahir", isCorrect: false },
            { text: "B. Campuran huruf besar, huruf kecil, angka, dan simbol unik", isCorrect: true },
            { text: "C. Angka berurutan seperti 123456", isCorrect: false },
            { text: "D. Nama hewan peliharaan saja", isCorrect: false }
          ]
        },
        {
          question: "Apa manfaat utama dari mengaktifkan Two-Factor Authentication (2FA)?",
          options: [
            { text: "A. Membuat koneksi internet Anda menjadi lebih stabil", isCorrect: false },
            { text: "B. Memberikan lapisan keamanan kedua selain password", isCorrect: true },
            { text: "C. Menghemat penggunaan kuota internet gawai", isCorrect: false },
            { text: "D. Mengubah password Anda secara otomatis setiap hari", isCorrect: false }
          ]
        },
        {
          question: "Apa tindakan pertama jika Anda menerima pemberitahuan login asing dari perangkat lain?",
          options: [
            { text: "A. Mengabaikannya karena sistem pasti salah", isCorrect: false },
            { text: "B. Segera mengganti kata sandi dan mengaktifkan 2FA", isCorrect: true },
            { text: "C. Membagikan screenshot notifikasi tersebut ke story media sosial", isCorrect: false },
            { text: "D. Menghapus aplikasi tersebut dari gawai Anda", isCorrect: false }
          ]
        }
      ],
      "Jejak Digital, Jejak Seumur Hidup": [
        {
          question: "Apa yang dimaksud dengan jejak digital pasif?",
          options: [
            { text: "A. Data yang kita unggah secara sadar di medsos", isCorrect: false },
            { text: "B. Informasi yang terkumpul tentang kita tanpa disadari (seperti riwayat lokasi dan IP)", isCorrect: true },
            { text: "C. Akun media sosial yang sudah tidak kita gunakan lagi", isCorrect: false },
            { text: "D. Penghapusan data internet secara berkala", isCorrect: false }
          ]
        },
        {
          question: "Mengapa jejak digital sangat sulit untuk dihapus sepenuhnya?",
          options: [
            { text: "A. Karena aturan hukum melarang penghapusan data", isCorrect: false },
            { text: "B. Karena data bisa dengan mudah disalin, diunduh, dan disimpan di server lain", isCorrect: true },
            { text: "C. Karena kapasitas server internet sangat terbatas", isCorrect: false },
            { text: "D. Karena browser Anda menyimpan cache selamanya", isCorrect: false }
          ]
        },
        {
          question: "Sebelum membagikan konten di internet, apa pertimbangan utama yang paling tepat?",
          options: [
            { text: "A. Berapa banyak jumlah like yang akan didapatkan", isCorrect: false },
            { text: "B. Bagaimana dampaknya terhadap nama baik dan karir masa depan saya", isCorrect: true },
            { text: "C. Apakah teman dekat saya akan menyukainya atau tidak", isCorrect: false },
            { text: "D. Apakah konten tersebut sedang trending minggu ini", isCorrect: false }
          ]
        }
      ],
      "Scam Alert: Jangan Jadi Korban Klik Asal": [
        {
          question: "Manakah di bawah ini yang merupakan ciri utama dari penipuan digital (phishing)?",
          options: [
            { text: "A. Menawarkan bantuan teknis secara gratis dan bertahap", isCorrect: false },
            { text: "B. Meminta informasi pribadi sensitif secara mendesak lewat tautan palsu", isCorrect: true },
            { text: "C. Memberikan update keamanan sistem gawai secara berkala", isCorrect: false },
            { text: "D. Iklan promosi produk resmi dari toko online terkenal", isCorrect: false }
          ]
        },
        {
          question: "Protokol apa yang menandakan sebuah situs web aman untuk memasukkan informasi penting?",
          options: [
            { text: "A. HTTP biasa tanpa ikon gembok", isCorrect: false },
            { text: "B. HTTPS disertai ikon gembok terkunci pada alamat browser", isCorrect: true },
            { text: "C. FTP dengan alamat IP publik", isCorrect: false },
            { text: "D. XML dengan domain .xyz atau .cc", isCorrect: false }
          ]
        },
        {
          question: "Apa yang sebaiknya dilakukan jika tidak sengaja mengunduh file mencurigakan berakhiran .exe dari internet?",
          options: [
            { text: "A. Langsung mengklik ganda file tersebut untuk melihat isinya", isCorrect: false },
            { text: "B. Segera hapus file tersebut dan jalankan pemindaian antivirus", isCorrect: true },
            { text: "C. Memindahkan file tersebut ke folder rahasia", isCorrect: false },
            { text: "D. Membagikannya ke grup chat kelas untuk ditanyakan", isCorrect: false }
          ]
        }
      ],
      "Posting Boleh, Nyolong Jangan": [
        {
          question: "Jenis lisensi apa yang mengizinkan Anda menggunakan karya orang lain secara gratis dengan syarat mencantumkan atribusi?",
          options: [
            { text: "A. All Rights Reserved", isCorrect: false },
            { text: "B. Creative Commons (CC)", isCorrect: true },
            { text: "C. Lisensi Eksklusif Komersial", isCorrect: false },
            { text: "D. Lisensi Hak Milik Tunggal", isCorrect: false }
          ]
        },
        {
          question: "Mengambil karya tulis atau ide orang lain tanpa izin dan mengakuinya sebagai karya sendiri disebut?",
          options: [
            { text: "A. Hak paten mandiri", isCorrect: false },
            { text: "B. Plagiarisme", isCorrect: true },
            { text: "C. Sindikasi materi publik", isCorrect: false },
            { text: "D. Kurasi konten digital", isCorrect: false }
          ]
        },
        {
          question: "Bagaimana cara menghargai hak cipta saat menggunakan ilustrasi dari internet untuk tugas sekolah?",
          options: [
            { text: "A. Mengedit gambar tersebut agar tidak dikenali pembuatnya", isCorrect: false },
            { text: "B. Mencantumkan nama pencipta asli dan tautan sumber gambarnya", isCorrect: true },
            { text: "C. Mengaku bahwa Anda menggambarnya sendiri secara digital", isCorrect: false },
            { text: "D. Membelinya secara ilegal dari situs pihak ketiga", isCorrect: false }
          ]
        }
      ],
      "Like, Share, Think!": [
        {
          question: "Langkah pertama yang paling bijak saat menerima berita yang terkesan heboh di grup WhatsApp adalah?",
          options: [
            { text: "A. Langsung menyebarkannya ke grup lain agar mereka waspada", isCorrect: false },
            { text: "B. Memeriksa kebenaran berita di situs web verifikasi fakta terpercaya", isCorrect: true },
            { text: "C. Mempercayainya karena dikirim oleh kerabat dekat", isCorrect: false },
            { text: "D. Menghapus pesan tersebut tanpa membacanya sama sekali", isCorrect: false }
          ]
        },
        {
          question: "Apa bahaya utama dari penyebaran berita bohong (hoaks)?",
          options: [
            { text: "A. Mengurangi bandwidth kuota internet Anda", isCorrect: false },
            { text: "B. Menimbulkan kecemasan, kepanikan, dan perpecahan di masyarakat", isCorrect: true },
            { text: "C. Membuat performa gawai Anda menjadi lambat", isCorrect: false },
            { text: "D. Menurunkan resolusi layar saat membaca berita", isCorrect: false }
          ]
        },
        {
          question: "Mengapa kita tidak boleh mudah terkecoh oleh judul artikel yang bombastis (clickbait)?",
          options: [
            { text: "A. Karena judul tersebut biasanya ditulis dengan huruf kapital saja", isCorrect: false },
            { text: "B. Karena judul clickbait seringkali tidak sesuai dengan isi fakta artikel", isCorrect: true },
            { text: "C. Karena link clickbait pasti berisi virus trojan berbahaya", isCorrect: false },
            { text: "D. Karena artikel tersebut tidak berbayar", isCorrect: false }
          ]
        }
      ],
      "Me Time, Not Screen Time": [
        {
          question: "Berapa durasi waktu layar (screen time) ideal di luar jam belajar yang disarankan?",
          options: [
            { text: "A. Lebih dari 6 jam sehari", isCorrect: false },
            { text: "B. Maksimal 2 jam sehari", isCorrect: true },
            { text: "C. Sekitar 4 sampai 5 jam sehari", isCorrect: false },
            { text: "D. Tergantung sisa baterai gawai Anda", isCorrect: false }
          ]
        },
        {
          question: "Gejala kesehatan fisik apa yang sering timbul akibat menatap layar gawai terlalu lama tanpa jeda?",
          options: [
            { text: "A. Peningkatan daya ingat secara tajam", isCorrect: false },
            { text: "B. Mata lelah, mata kering, penglihatan kabur, dan sakit kepala", isCorrect: true },
            { text: "C. Penurunan nafsu makan secara berlebihan", isCorrect: false },
            { text: "D. Gangguan pendengaran pada telinga bagian dalam", isCorrect: false }
          ]
        },
        {
          question: "Mengapa disarankan untuk menjauhkan gawai minimal 1 jam sebelum tidur malam?",
          options: [
            { text: "A. Agar gawai Anda tidak kehabisan daya saat pagi hari", isCorrect: false },
            { text: "B. Cahaya biru layar menghambat hormon melatonin yang mengatur tidur", isCorrect: true },
            { text: "C. Menghindari bahaya radiasi gelombang mikro", isCorrect: false },
            { text: "D. Mencegah layar gawai pecah karena terjatuh", isCorrect: false }
          ]
        }
      ],
      "Scroll Sehat, Hati Sehat": [
        {
          question: "Apa istilah psikologis untuk kecemasan merasa tertinggal informasi atau aktivitas seru orang lain di sosial media?",
          options: [
            { text: "A. Phubbing", isCorrect: false },
            { text: "B. FOMO (Fear Of Missing Out)", isCorrect: true },
            { text: "C. Cyberloafing", isCorrect: false },
            { text: "D. Nomophobia", isCorrect: false }
          ]
        },
        {
          question: "Bagaimana cara terbaik mengatasi rasa rendah diri akibat sering melihat kehidupan 'sempurna' orang lain di medsos?",
          options: [
            { text: "A. Membuat postingan palsu yang terlihat jauh lebih mewah", isCorrect: false },
            { text: "B. Membatasi waktu medsos dan lebih mensyukuri realitas kehidupan nyata", isCorrect: true },
            { text: "C. Menulis komentar negatif di postingan akun tersebut", isCorrect: false },
            { text: "D. Membuat akun kloningan untuk memantau aktivitas mereka", isCorrect: false }
          ]
        },
        {
          question: "Tindakan kurasi feed apa yang paling bijak jika sebuah akun sosial media terus memicu stres atau kecemasan Anda?",
          options: [
            { text: "A. Terus membacanya agar terbiasa dengan tekanan emosional", isCorrect: false },
            { text: "B. Menyembunyikan, membisukan (mute), atau men-unfollow akun tersebut", isCorrect: true },
            { text: "C. Melaporkan akun tersebut ke polisi internet", isCorrect: false },
            { text: "D. Meminta teman-teman Anda untuk ikut merundung akun itu", isCorrect: false }
          ]
        }
      ],
      "Privasi Bukan Rahasia Umum": [
        {
          question: "Mengapa menyebarkan foto KTP atau tiket pesawat dengan barcode jelas di medsos sangat berbahaya?",
          options: [
            { text: "A. Foto tersebut akan memenuhi kapasitas penyimpanan memori gawai", isCorrect: false },
            { text: "B. Data pribadi tersebut dapat disalahgunakan untuk penipuan atau pencurian identitas", isCorrect: true },
            { text: "C. Postingan Anda akan diturunkan otomatis oleh sistem algoritma", isCorrect: false },
            { text: "D. Kualitas foto KTP biasanya tidak bagus untuk estetika feed", isCorrect: false }
          ]
        },
        {
          question: "Di mana fitur utama untuk membatasi siapa saja yang dapat melihat postingan dan riwayat profil Anda?",
          options: [
            { text: "A. Halaman edit bio profil utama", isCorrect: false },
            { text: "B. Menu pengaturan privasi dan keamanan akun", isCorrect: true },
            { text: "C. Kolom filter komentar pada setiap foto", isCorrect: false },
            { text: "D. Halaman bantuan dan pusat pelaporan platform", isCorrect: false }
          ]
        },
        {
          question: "Apa bahaya dari mengaktifkan pelacakan lokasi (share location) secara publik sepanjang waktu?",
          options: [
            { text: "A. Mengakibatkan baterai gawai Anda menjadi cepat rusak", isCorrect: false },
            { text: "B. Memudahkan pelaku kejahatan melacak keberadaan fisik kita secara real-time", isCorrect: true },
            { text: "C. Mengurangi kecepatan sinyal internet Anda", isCorrect: false },
            { text: "D. Menampilkan iklan lokal secara berlebihan di layar gawai", isCorrect: false }
          ]
        }
      ],
      "Speak Up! Tapi Tetap Respect": [
        {
          question: "Bagaimana cara menyalurkan kritik atau saran secara sehat di ruang komentar internet?",
          options: [
            { text: "A. Menyampaikan dengan emosi meledak-ledak agar didengar", isCorrect: false },
            { text: "B. Menggunakan bahasa yang sopan, fokus pada solusi, tanpa menyerang pribadi", isCorrect: true },
            { text: "C. Menyerang penampilan fisik pembuat konten agar dia jera", isCorrect: false },
            { text: "D. Menyebarkan kritik tersebut secara berulang-ulang di akun spam", isCorrect: false }
          ]
        },
        {
          question: "Undang-Undang apa di Indonesia yang mengatur tentang perbuatan hukum di dunia digital, termasuk fitnah dan pencemaran nama baik?",
          options: [
            { text: "A. Undang-Undang Hak Cipta", isCorrect: false },
            { text: "B. Undang-Undang Informasi dan Transaksi Elektronik (UU ITE)", isCorrect: true },
            { text: "C. Undang-Undang Keterbukaan Informasi Publik", isCorrect: false },
            { text: "D. Kitab Undang-Undang Hukum Perdata pasal 1365", isCorrect: false }
          ]
        },
        {
          question: "Apa perbedaan paling mendasar antara kritik konstruktif dan ujaran kebencian di media sosial?",
          options: [
            { text: "A. Kritik konstruktif selalu ditulis dengan kalimat yang panjang", isCorrect: false },
            { text: "B. Kritik konstruktif bertujuan membangun solusi, sedangkan ujaran kebencian bertujuan menyerang dan merendahkan", isCorrect: true },
            { text: "C. Ujaran kebencian hanya dilarang bagi tokoh publik saja", isCorrect: false },
            { text: "D. Kritik konstruktif tidak memerlukan data pendukung apapun", isCorrect: false }
          ]
        }
      ],
      "Cyberbullying = Nggak Keren": [
        {
          question: "Tindakan awal apa yang paling tepat dilakukan jika Anda menjadi target perundungan siber (cyberbullying)?",
          options: [
            { text: "A. Membalas dengan hinaan yang lebih kejam di kolom komentar", isCorrect: false },
            { text: "B. Blokir akun pelaku, screenshot semua bukti, dan laporkan ke guru atau orang tua", isCorrect: true },
            { text: "C. Menutup akun selamanya dan mengurung diri di dalam kamar", isCorrect: false },
            { text: "D. Mengabaikannya dan berpura-pura bahwa semuanya baik-baik saja", isCorrect: false }
          ]
        },
        {
          question: "Mengapa membiarkan atau menonton saja (bystander) ketika teman dirundung online itu tidak dibenarkan?",
          options: [
            { text: "A. Karena Anda akan dianggap sebagai pelaku utama", isCorrect: false },
            { text: "B. Karena sikap diam memberikan kekuatan bagi pelaku untuk terus merundung", isCorrect: true },
            { text: "C. Karena Anda akan diblokir oleh platform sosial media tersebut", isCorrect: false },
            { text: "D. Karena hal tersebut melanggar hak cipta konten", isCorrect: false }
          ]
        },
        {
          question: "Fitur apa yang bisa kita gunakan di media sosial untuk melaporkan akun yang melakukan pelecehan?",
          options: [
            { text: "A. Fitur Share atau Bagikan", isCorrect: false },
            { text: "B. Fitur Report/Laporkan Konten atau Pengguna", isCorrect: true },
            { text: "C. Fitur Simpan ke Koleksi", isCorrect: false },
            { text: "D. Fitur Tambahkan sebagai Teman Dekat", isCorrect: false }
          ]
        }
      ],
      "From Meme to Movement": [
        {
          question: "Bagaimana cara memanfaatkan meme internet secara positif untuk kepentingan sosial?",
          options: [
            { text: "A. Menyindir teman sekelas yang berbuat salah agar dia malu", isCorrect: false },
            { text: "B. Mengemas pesan edukasi lingkungan atau kesehatan menjadi konten humor yang mendidik", isCorrect: true },
            { text: "C. Menyebarkan ujaran kebencian dengan kedok sarkasme", isCorrect: false },
            { text: "D. Mengambil karya orang lain tanpa izin demi mendapatkan klik", isCorrect: false }
          ]
        },
        {
          question: "Apa tujuan utama dari sebuah gerakan kampanye sosial (aktivisme digital) di media sosial?",
          options: [
            { text: "A. Mencari pengikut sebanyak-banyaknya untuk monetisasi", isCorrect: false },
            { text: "B. Membangun kesadaran publik dan mendorong aksi nyata terkait isu tertentu", isCorrect: true },
            { text: "C. Membuktikan bahwa pendapat kelompok Anda yang paling benar", isCorrect: false },
            { text: "D. Menjatuhkan reputasi organisasi atau kelompok yang berseberangan", isCorrect: false }
          ]
        },
        {
          question: "Sebelum meluncurkan petisi online, apa hal terpenting yang wajib disiapkan secara matang?",
          options: [
            { text: "A. Desain logo kampanye yang sangat rumit dan mahal", isCorrect: false },
            { text: "B. Fakta, data kredibel, dan kejelasan solusi yang ditawarkan", isCorrect: true },
            { text: "C. Jumlah minimal donasi uang yang harus dikumpulkan", isCorrect: false },
            { text: "D. Dukungan dari influencer media sosial terkenal", isCorrect: false }
          ]
        }
      ],
      "Digitalpreneur Muda": [
        {
          question: "Apa kelebihan dari menjalankan model bisnis e-commerce dengan sistem dropship?",
          options: [
            { text: "A. Keuntungan per transaksi jauh lebih besar dibanding stok barang", isCorrect: false },
            { text: "B. Tidak memerlukan gudang penyimpanan fisik dan modal stok barang", isCorrect: true },
            { text: "C. Pengiriman barang sepenuhnya berada di bawah kendali kita", isCorrect: false },
            { text: "D. Kualitas barang dijamin 100% selalu memuaskan", isCorrect: false }
          ]
        },
        {
          question: "Langkah pemasaran digital awal apa yang paling hemat biaya bagi wirausaha pemula?",
          options: [
            { text: "A. Memasang papan baliho besar di jalan protokol kota", isCorrect: false },
            { text: "B. Memanfaatkan konten kreatif di media sosial (seperti TikTok atau Reels)", isCorrect: true },
            { text: "C. Menyewa jasa agensi periklanan internasional", isCorrect: false },
            { text: "D. Mengirim brosur kertas secara acak ke perumahan", isCorrect: false }
          ]
        },
        {
          question: "Mengapa pelayanan yang ramah dan cepat (fast response) sangat penting dalam transaksi online?",
          options: [
            { text: "A. Agar pelanggan tidak sempat mencari alternatif toko lain", isCorrect: false },
            { text: "B. Membangun rasa percaya dan meningkatkan reputasi toko di mata konsumen", isCorrect: true },
            { text: "C. Memenuhi syarat algoritma mesin pencari", isCorrect: false },
            { text: "D. Menghindari pajak komersial dari e-commerce", isCorrect: false }
          ]
        }
      ],
      "Mindful Online, Mindful Life": [
        {
          question: "Apa arti dari mempraktikkan kesadaran penuh (mindfulness) saat berselancar di dunia digital?",
          options: [
            { text: "A. Membaca semua artikel berita secara detail tanpa terlewat", isCorrect: false },
            { text: "B. Sadar secara penuh akan tujuan, durasi, dan kondisi emosi kita saat memegang gawai", isCorrect: true },
            { text: "C. Mematikan seluruh jaringan internet rumah sepanjang hari", isCorrect: false },
            { text: "D. Menyimpan semua postingan yang kita temui di feed", isCorrect: false }
          ]
        },
        {
          question: "Latihan sederhana apa yang bisa dilakukan saat mulai merasa jenuh dan stres akibat belajar online?",
          options: [
            { text: "A. Menambah durasi bermain game kompetitif secara maraton", isCorrect: false },
            { text: "B. Melakukan teknik pernapasan dalam (deep breathing) selama 3-5 menit", isCorrect: true },
            { text: "C. Membuka media sosial baru dan me-refresh feed berulang kali", isCorrect: false },
            { text: "D. Mengonsumsi kafein dalam jumlah banyak", isCorrect: false }
          ]
        },
        {
          question: "Kapan waktu yang paling tepat untuk melakukan jeda sejenak (pause) dari aktivitas gawai?",
          options: [
            { text: "A. Saat daya baterai gawai Anda tersisa 1%", isCorrect: false },
            { text: "B. Saat Anda mulai merasa emosional, cemas, atau sulit berkonsentrasi", isCorrect: true },
            { text: "C. Setelah Anda menyelesaikan seluruh level permainan game", isCorrect: false },
            { text: "D. Hanya jika ada teguran keras dari orang tua", isCorrect: false }
          ]
        }
      ],
      "Balance Your Feed": [
        {
          question: "Apa tujuan utama dari melakukan kurasi atau pembersihan feed sosial media secara berkala?",
          options: [
            { text: "A. Memperbanyak jumlah pengikut di profil Anda", isCorrect: false },
            { text: "B. Menjaga kesehatan mental dengan hanya mengonsumsi konten edukatif dan positif", isCorrect: true },
            { text: "C. Mengelabui sistem algoritma sosial media", isCorrect: false },
            { text: "D. Membuat tampilan profil Anda terlihat lebih estetik", isCorrect: false }
          ]
        },
        {
          question: "Manakah akun di bawah ini yang sebaiknya Anda follow untuk menunjang wellbeing Anda?",
          options: [
            { text: "A. Akun yang sering memicu rasa rendah diri (insecure) atau kecemasan", isCorrect: false },
            { text: "B. Akun edukatif, sains, pengembangan diri, dan komunitas hobi yang sehat", isCorrect: true },
            { text: "C. Akun gosip selebritas yang selalu memperbarui informasi pribadi orang lain", isCorrect: false },
            { text: "D. Akun pembuat konten provokatif dan sensasional", isCorrect: false }
          ]
        },
        {
          question: "Bagaimana algoritma platform sosial media menentukan konten apa yang muncul di timeline Anda?",
          options: [
            { text: "A. Secara acak tanpa memperhatikan aktivitas pengguna", isCorrect: false },
            { text: "B. Menampilkan konten sejenis dengan apa yang sering Anda tonton, sukai, dan komentari", isCorrect: true },
            { text: "C. Menampilkan konten yang paling mahal biaya produksinya saja", isCorrect: false },
            { text: "D. Berdasarkan urutan alfabet judul konten tersebut", isCorrect: false }
          ]
        }
      ],
      "Digital Guardian": [
        {
          question: "Bagaimana sikap awal Anda sebagai Digital Guardian jika ada teman dekat curhat bahwa akun medsosnya diretas?",
          options: [
            { text: "A. Memarahinya karena tidak berhati-hati menjaga password", isCorrect: false },
            { text: "B. Menenangkan emosinya, membantu melapor ke platform, dan mengamankan email pemulihan", isCorrect: true },
            { text: "C. Menyebarkan berita peretasan tersebut ke grup kelas agar semua tahu", isCorrect: false },
            { text: "D. Mencoba meretas balik pelaku tersebut secara mandiri", isCorrect: false }
          ]
        },
        {
          question: "Apa peran utama seorang Digital Guardian di lingkungan sekolah?",
          options: [
            { text: "A. Mengawasi dan memata-matai riwayat chat teman-teman sekelas", isCorrect: false },
            { text: "B. Menjadi role model dan jembatan edukasi seputar keselamatan & etika digital sebaya", isCorrect: true },
            { text: "C. Menghukum teman kelas yang melakukan pelanggaran aturan sekolah di internet", isCorrect: false },
            { text: "D. Menjadi admin grup chat sekolah yang paling ditakuti", isCorrect: false }
          ]
        },
        {
          question: "Mengapa kerahasiaan identitas korban cyberbullying wajib dilindungi saat Anda mendampinginya melapor?",
          options: [
            { text: "A. Agar pelaku tidak menuntut balik Anda atas pelanggaran hak cipta", isCorrect: false },
            { text: "B. Melindungi kesehatan mental korban dari intimidasi atau gunjingan lanjutan", isCorrect: true },
            { text: "C. Agar proses penyelidikan polisi tidak terhambat oleh publikasi", isCorrect: false },
            { text: "D. Karena aturan administrasi sekolah mengharuskan demikian", isCorrect: false }
          ]
        }
      ],
      "Online Debater Pro": [
        {
          question: "Apa sebutan untuk kesalahan logika saat seseorang menyerang karakter pribadi lawan bicara ketimbang argumennya?",
          options: [
            { text: "A. Strawman Fallacy", isCorrect: false },
            { text: "B. Ad Hominem", isCorrect: true },
            { text: "C. Slippery Slope", isCorrect: false },
            { text: "D. False Dilemma", isCorrect: false }
          ]
        },
        {
          question: "Bagaimana cara terbaik menyanggah opini lawan bicara yang menyajikan berita palsu (hoaks) saat berdiskusi online?",
          options: [
            { text: "A. Membalasnya dengan kalimat sindiran kasar agar dia malu", isCorrect: false },
            { text: "B. Mengoreksi secara sopan dengan menyertakan bukti data resmi dari sumber kredibel", isCorrect: true },
            { text: "C. Melaporkan akun tersebut ke kominfo secara massal", isCorrect: false },
            { text: "D. Mengalihkan topik pembicaraan ke isu lain yang tidak berkaitan", isCorrect: false }
          ]
        },
        {
          question: "Kapan sebuah perdebatan di media sosial sebaiknya segera Anda hentikan?",
          options: [
            { text: "A. Saat argumen Anda mulai terlihat kalah oleh data lawan", isCorrect: false },
            { text: "B. Saat diskusi mulai diwarnai kemarahan emosional dan tidak lagi bersifat edukatif", isCorrect: true },
            { text: "C. Saat jumlah komentar sudah mencapai lebih dari 100", isCorrect: false },
            { text: "D. Jika belum ada pihak ketiga yang menengahi perdebatan", isCorrect: false }
          ]
        }
      ],
      "Campaign Against Hate Speech": [
        {
          question: "Manakah tindakan di bawah ini yang paling tepat digolongkan sebagai ujaran kebencian (hate speech)?",
          options: [
            { text: "A. Kritik pedas terhadap kinerja pengurus OSIS di forum sekolah", isCorrect: false },
            { text: "B. Hasutan dan hinaan rasial yang mendiskreditkan kelompok SARA tertentu di internet", isCorrect: true },
            { text: "C. Perbedaan argumen politik di kolom komentar media massa", isCorrect: false },
            { text: "D. Komentar ketidakpuasan pelanggan terhadap kualitas produk toko online", isCorrect: false }
          ]
        },
        {
          question: "Format konten digital apa yang paling efektif dan komunikatif untuk kampanye sosial anti-hoaks di sekolah?",
          options: [
            { text: "A. Dokumen PDF laporan ilmiah setebal 50 halaman", isCorrect: false },
            { text: "B. Poster digital infografis yang menarik atau video edukasi berdurasi pendek", isCorrect: true },
            { text: "C. Rekaman suara pembacaan teks pidato tanpa visual", isCorrect: false },
            { text: "D. Rentetan teks panjang tanpa jeda paragraf di status medsos", isCorrect: false }
          ]
        },
        {
          question: "Bagaimana cara terbaik mengukur keberhasilan suatu kampanye anti-hate speech di sekolah?",
          options: [
            { text: "A. Berapa banyak jumlah biaya anggaran yang dihabiskan untuk promosi", isCorrect: false },
            { text: "B. Tingkat partisipasi, respon umpan balik positif, serta penurunan laporan kasus perundungan siber", isCorrect: true },
            { text: "C. Berapa banyak jumlah akun palsu yang menyukai postingan tersebut", isCorrect: false },
            { text: "D. Ketenangan guru BK karena tidak ada laporan dari orang tua", isCorrect: false }
          ]
        }
      ],
      "Tech for Good": [
        {
          question: "Apa prinsip dasar paling utama dari konsep Tech for Good?",
          options: [
            { text: "A. Membeli gawai dengan teknologi terbaru yang paling mahal", isCorrect: false },
            { text: "B. Memanfaatkan inovasi teknologi untuk menyelesaikan isu sosial dan kelestarian lingkungan", isCorrect: true },
            { text: "C. Memaksimalkan keuntungan bisnis digital dari penjualan produk elektronik", isCorrect: false },
            { text: "D. Membuat program kecerdasan buatan (AI) tercanggih untuk keperluan militer", isCorrect: false }
          ]
        },
        {
          question: "Manakah contoh proyek digital siswa sekolah yang paling tepat menerapkan prinsip Tech for Good?",
          options: [
            { text: "A. Membuat game aksi petualangan online berbayar", isCorrect: false },
            { text: "B. Merancang aplikasi bank sampah sekolah untuk pengelolaan limbah plastik", isCorrect: true },
            { text: "C. Membuat sistem otomatisasi ujian yang mempersulit kelulusan siswa", isCorrect: false },
            { text: "D. Membangun situs web galeri foto pribadi guru kelas", isCorrect: false }
          ]
        },
        {
          question: "Apa langkah awal yang wajib dilakukan sebelum mulai membuat rancangan aplikasi solusi sosial?",
          options: [
            { text: "A. Menulis seluruh baris kode pemograman secara mandiri", isCorrect: false },
            { text: "B. Mengobservasi dan berdiskusi langsung dengan calon pengguna untuk memetakan masalah nyata mereka", isCorrect: true },
            { text: "C. Mencari pendanaan modal dari investor startup berskala besar", isCorrect: false },
            { text: "D. Membeli domain situs web premium yang mahal", isCorrect: false }
          ]
        }
      ],
      "StartUp Garage": [
        {
          question: "Dalam simulasi startup digital, apa fungsi utama dari menyusun Value Proposition Canvas?",
          options: [
            { text: "A. Menghitung neraca laba-rugi bisnis selama setahun", isCorrect: false },
            { text: "B. Menyelaraskan keunggulan solusi produk kita dengan pain (masalah) dan gain (kebutuhan) calon pengguna", isCorrect: true },
            { text: "C. Mendesain logo dan warna identitas perusahaan rintisan", isCorrect: false },
            { text: "D. Menentukan porsi kepemilikan saham di antara para pendiri", isCorrect: false }
          ]
        },
        {
          question: "Apa istilah untuk prototipe produk paling sederhana yang memiliki fungsi dasar cukup untuk diuji ke pasar?",
          options: [
            { text: "A. Final Finished Product (FFP)", isCorrect: false },
            { text: "B. Minimum Viable Product (MVP)", isCorrect: true },
            { text: "C. Alpha Testing System (ATS)", isCorrect: false },
            { text: "D. Beta Launching Core (BLC)", isCorrect: false }
          ]
        },
        {
          question: "Manakah di bawah ini yang merupakan contoh model bisnis startup digital yang mengandalkan biaya langganan berkala?",
          options: [
            { text: "A. E-commerce jual beli lepas sekali beli", isCorrect: false },
            { text: "B. Layanan Software-as-a-Service (SaaS) atau platform streaming bulanan", isCorrect: true },
            { text: "C. Bisnis grosir barang fisik tradisional", isCorrect: false },
            { text: "D. Penjualan lisensi produk sekali pakai", isCorrect: false }
          ]
        }
      ],
      "Digital Detox Challenge": [
        {
          question: "Langkah persiapan apa yang paling penting sebelum memulai tantangan detoks digital 3 hari?",
          options: [
            { text: "A. Menjual seluruh perangkat gawai Anda ke toko terdekat", isCorrect: false },
            { text: "B. Memberitahu keluarga/teman dekat tentang tantangan ini dan menonaktifkan notifikasi non-penting", isCorrect: true },
            { text: "C. Mengunduh puluhan aplikasi game baru untuk dimainkan saat offline", isCorrect: false },
            { text: "D. Menimbun kuota data internet sebanyak mungkin", isCorrect: false }
          ]
        },
        {
          question: "Aktivitas offline apa yang paling direkomendasikan untuk mengisi waktu luang selama detoks gawai?",
          options: [
            { text: "A. Menonton siaran televisi kabel tanpa henti sepanjang hari", isCorrect: false },
            { text: "B. Membaca buku fisik, berolahraga, bersosialisasi tatap muka, dan melakukan hobi kreatif", isCorrect: true },
            { text: "C. Tidur seharian penuh untuk menghemat energi tubuh", isCorrect: false },
            { text: "D. Merencanakan liburan mewah yang memakan banyak biaya", isCorrect: false }
          ]
        },
        {
          question: "Manfaat psikologis apa yang paling dirasakan setelah berhasil menyelesaikan tantangan detoks digital?",
          options: [
            { text: "A. Mengalami penurunan minat belajar di sekolah", isCorrect: false },
            { text: "B. Pikiran terasa lebih fokus, tidur lebih nyenyak, serta tingkat kecemasan (stres) berkurang", isCorrect: true },
            { text: "C. Rasa kesepian yang semakin mendalam dan tidak terkendali", isCorrect: false },
            { text: "D. Mengalami kepikunan jangka pendek", isCorrect: false }
          ]
        }
      ],
      "Be a Digital Mentor": [
        {
          question: "Bagaimana cara terbaik membagikan nilai etika digital kepada adik kelas di sekolah?",
          options: [
            { text: "A. Menggurui mereka dengan ceramah panjang di depan pintu kelas", isCorrect: false },
            { text: "B. Memberikan contoh langsung yang konsisten lewat bahasa dan perilaku sopan kita saat berinternet", isCorrect: true },
            { text: "C. Mengancam akan melaporkan mereka ke guru jika melanggar aturan", isCorrect: false },
            { text: "D. Membuat akun khusus untuk mengoreksi postingan mereka secara publik", isCorrect: false }
          ]
        },
        {
          question: "Nasihat terbaik apa yang bisa Anda berikan jika adik kelas mulai menunjukkan tanda-tanda kecanduan game online?",
          options: [
            { text: "A. Menyuruhnya langsung menghapus game tersebut tanpa kompromi", isCorrect: false },
            { text: "B. Mendengarkan keluhannya secara empati dan membimbingnya membagi waktu bermain & belajar secara seimbang", isCorrect: true },
            { text: "C. Membiarkannya karena bermain game adalah hak pribadinya", isCorrect: false },
            { text: "D. Melaporkannya langsung ke kepala sekolah agar diberi sanksi", isCorrect: false }
          ]
        },
        {
          question: "Mengapa pendekatan empati sangat diperlukan dalam membimbing orang lain mengenai digital wellbeing?",
          options: [
            { text: "A. Agar Anda dinilai sebagai mentor yang paling hebat", isCorrect: false },
            { text: "B. Agar mereka merasa dirangkul, dipahami masalahnya, dan termotivasi melakukan perubahan tanpa merasa dihakimi", isCorrect: true },
            { text: "C. Pendekatan empati mempercepat proses administrasi sekolah", isCorrect: false },
            { text: "D. Menghindari terjadinya perdebatan yang sengit", isCorrect: false }
          ]
        }
      ]
    };

    let seededModulesCount = 0;
    let seededQuizzesCount = 0;

    for (const m of defaultModules) {
      const levelId = levelMap[m.level_name];
      const categoryId = catMap[m.category_name];

      if (!levelId || !categoryId) continue;

      let existingModule = await prisma.module.findFirst({
        where: {
          title: m.title,
          level_id: levelId,
          category_id: categoryId
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
            category_id: categoryId
          }
        });
        seededModulesCount++;
      }

      // Check and seed posttest quiz for this module
      let posttestQuiz = await prisma.quiz.findFirst({
        where: { module_id: existingModule.id, type: "posttest" }
      });

      if (!posttestQuiz) {
        const questionsData = posttestMap[m.title];
        if (questionsData) {
          posttestQuiz = await prisma.quiz.create({
            data: {
              title: `Posttest: ${m.title}`,
              type: "posttest",
              module_id: existingModule.id
            }
          });
          seededQuizzesCount++;

          for (const q of questionsData) {
            const questionObj = await prisma.question.create({
              data: {
                quiz_id: posttestQuiz.id,
                question: q.question
              }
            });

            for (const o of q.options) {
              await prisma.option.create({
                data: {
                  question_id: questionObj.id,
                  option_text: o.text,
                  is_correct: o.isCorrect
                }
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with questions, badges, and level-adaptive modules + posttests!",
      classesCount: seededClasses.length,
      levelsCount: seededLevels.length,
      categoriesCount: seededCategories.length,
      pretestCreated: "Seeded 15 questions successfully.",
      badgesCount: seededBadges.length,
      modulesCount: seededModulesCount,
      quizzesCount: seededQuizzesCount,
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
