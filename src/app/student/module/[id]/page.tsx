"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface Option {
  id: number;
  option_text: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

interface ModuleDetails {
  id: number;
  title: string;
  content: string;
  video_url: string | null;
  media_type: string | null;
  category: string;
  level: string;
}

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const moduleId = parseInt(id);

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [highestScore, setHighestScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Flow State: reading material vs showing posttest quiz questions
  const [showQuiz, setShowQuiz] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [readingProgress, setReadingProgress] = useState(0);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [showScrollRestoredToast, setShowScrollRestoredToast] = useState(false);

  // Active question index for single-question view
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Transition wrappers to scroll to top and show intermediate loader
  const handleStartQuiz = () => {
    setTransitioning(true);
    setTimeout(() => {
      setShowQuiz(true);
      setTransitioning(false);
      setCurrentQuestionIndex(0); // Reset to first question
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 450);
  };

  const handleBackToMaterial = () => {
    setTransitioning(true);
    setTimeout(() => {
      setShowQuiz(false);
      setTransitioning(false);
      setCurrentQuestionIndex(0);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 450);
  };

  // Quiz answering state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    badgeAwarded: string | null;
  } | null>(null);

  // Fetch module and quiz on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj.role === "student" && !userObj.hasCompletedPretest) {
          router.push("/student/pretest");
          return;
        }
      } catch {}
    }

    async function loadModule() {
      try {
        const res = await fetch(`/api/student/module/${moduleId}`);
        const data = await res.json();
        
        if (data.success) {
          setModule(data.module);
          setQuiz(data.quiz);
          setIsCompleted(data.isCompleted);
          setHighestScore(data.highestScore);
          setReadingProgress(data.savedProgress || 0);
          setSavedScrollPos(data.savedScrollPos || 0);
        } else {
          setError(data.message || "Gagal memuat modul.");
        }
      } catch {
        setError("Gagal menghubungi server.");
      } finally {
        setLoading(false);
      }
    }
    loadModule();
  }, [moduleId, router]);

  // Restore scroll position once data is loaded
  useEffect(() => {
    if (!loading && savedScrollPos > 0 && !showQuiz) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: savedScrollPos, behavior: "smooth" });
        setShowScrollRestoredToast(true);
        setTimeout(() => setShowScrollRestoredToast(false), 4000);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [loading, savedScrollPos, showQuiz]);

  // Dynamic Scroll Progress Listener
  useEffect(() => {
    if (showQuiz || loading || !module) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      const scrollable = docHeight - winHeight;
      if (scrollable <= 0) return;

      const rawScrollPercent = Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
      const calculatedReadingProgress = isCompleted ? 100 : Math.min(80, Math.max(10, rawScrollPercent));

      setReadingProgress((prev) => {
        const newProg = Math.max(prev, calculatedReadingProgress);

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetch("/api/student/module/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId,
              progress: newProg,
              scrollPos: Math.round(scrollTop)
            })
          }).catch(() => {});
        }, 600);

        return newProg;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [showQuiz, loading, module, moduleId, isCompleted]);

  // Handle option selection
  const handleSelectOption = (questionId: number, optionId: number) => {
    if (quizResult?.passed) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Submit posttest quiz
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert("Silakan jawab semua pertanyaan terlebih dahulu sebelum mengirim!");
      return;
    }

    setSubmittingQuiz(true);
    const formattedAnswers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
      questionId: parseInt(qId),
      optionId: oId,
    }));

    try {
      const res = await fetch("/api/student/module/posttest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          moduleId: moduleId,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult({
          score: data.score,
          passed: data.passed,
          badgeAwarded: data.badgeAwarded,
        });

        if (data.passed) {
          setIsCompleted(true);
          setHighestScore((prev) => Math.max(prev || 0, data.score));
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.message || "Gagal mengirim jawaban.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Retry quiz after failing
  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-600">Memuat materi modul...</p>
        </div>
      </div>
    );
  }

  if (transitioning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-700 font-extrabold tracking-wide animate-pulse">
            {showQuiz ? "Kembali ke Materi Pembelajaran..." : "Mempersiapkan Lembar Soal..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-zinc-900 p-6">
        <div className="max-w-md w-full bg-white border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-zinc-900">Modul Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-600 font-medium">{error || "Modul yang dicari tidak tersedia."}</p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full py-3 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] text-xs font-extrabold text-white transition shadow-md"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = quiz ? quiz.questions.filter((q) => selectedAnswers[q.id] !== undefined).length : 0;
  const totalQuestions = quiz ? quiz.questions.length : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  return (
    <div className="relative min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-16">
      {/* Dynamic Reading Progress Top Bar */}
      {!showQuiz && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-zinc-200">
          <div
            className="h-full bg-gradient-to-r from-[#5A77DF] via-[#4A64CA] to-[#3E53A2] transition-all duration-300 ease-out"
            style={{ width: `${isCompleted ? 100 : Math.max(readingProgress, 5)}%` }}
          />
        </div>
      )}

      {/* Floating Toast Notification when Scroll Position is Restored */}
      {showScrollRestoredToast && !showQuiz && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="rounded-2xl border border-[#5A77DF]/30 bg-white px-4 py-3 text-xs text-[#3E53A2] font-bold shadow-xl flex items-center gap-2">
            <span>📍 Melanjutkan posisi membaca sebelumnya (<strong>{readingProgress}%</strong>)</span>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className={`z-10 w-full ${showQuiz ? "max-w-7xl" : "max-w-4xl"} mx-auto px-4 py-4 flex items-center justify-between`}>
        <button
          onClick={() => {
            if (showQuiz) {
              handleBackToMaterial();
            } else {
              router.push("/student/dashboard");
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-[#5A77DF]/20 bg-white px-4 py-2 text-xs font-extrabold text-[#3E53A2] hover:bg-[#5A77DF]/10 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          {showQuiz ? "Kembali ke Materi" : "Kembali ke Dashboard"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-3xs uppercase tracking-widest text-[#5A77DF] font-black font-mono">Modul Belajar</span>
        </div>
      </header>

      {/* Step Progress Tracker (Shown only on material reading page) */}
      {!showQuiz && (
        <div className="z-10 w-full max-w-4xl mx-auto px-4 mt-2">
          <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-extrabold tracking-widest uppercase text-[#5A77DF] font-mono">
                Status Belajar
              </span>
              <span className="text-3xs font-extrabold tracking-widest uppercase text-[#3E53A2] bg-[#5A77DF]/10 px-3 py-1 rounded-full border border-[#5A77DF]/30">
                Progres Membaca: {isCompleted ? 100 : readingProgress}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5A77DF] via-[#4A64CA] to-[#3E53A2] transition-all duration-300 ease-out"
                  style={{ width: `${isCompleted ? 100 : Math.max(readingProgress, 5)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-3xs font-bold uppercase tracking-wider text-zinc-600">
                <span>Pelajari video dan teks ringkasan di bawah (Scroll untuk memperbarui)</span>
                <span className="text-[#3E53A2] font-black">{isCompleted ? <span className="inline-flex items-center gap-1">Modul Selesai <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /></span> : `Tersimpan ${readingProgress}%`}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="z-10 w-full px-4 py-6">
        
        {/* ========================================================
            STEP 1: READING MATERIAL MODE (showQuiz === false)
            ======================================================== */}
        {!showQuiz ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            
            {/* Title Card */}
            <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-3xs px-3 py-1 rounded-full font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30">
                  {module.category}
                </span>
                <span className="text-3xs px-3 py-1 rounded-full font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30">
                  Level: {module.level}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                {module.title}
              </h1>
            </div>

            {/* Video Player with Ambient Border */}
            {module.video_url && module.media_type === "youtube" && (
              <div className="relative group">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#5A77DF]/20 bg-black shadow-lg">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={module.video_url}
                    title={module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Material Reading Text */}
            <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 pb-3 border-b border-zinc-100 flex items-center gap-2 font-mono">
                <BookOpen className="h-4 w-4 text-[#5A77DF]" />
                Materi Pembelajaran
              </h2>
              
              {(() => {
                const contentStr = module.content || "";
                const isHtml = /<[a-z][\s\S]*>/i.test(contentStr);

                if (isHtml) {
                  return (
                    <div
                      className="text-xs text-zinc-800 font-medium leading-relaxed max-w-none space-y-4"
                      dangerouslySetInnerHTML={{ __html: contentStr }}
                    />
                  );
                }

                const paragraphs = contentStr.split("\n\n");
                return (
                  <div className="space-y-4 text-xs text-zinc-800 font-medium leading-relaxed">
                    {paragraphs.map((p, idx) => {
                      const imgMatch = /!\[(.*?)\]\((.*?)\)/.exec(p);
                      if (imgMatch) {
                        const caption = imgMatch[1];
                        const imgSrc = imgMatch[2];
                        return (
                          <div key={idx} className="my-4 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 p-2 space-y-2">
                            <img src={imgSrc} alt={caption || "Gambar Modul"} className="w-full h-auto max-h-[450px] object-cover rounded-lg" />
                            {caption && <p className="text-3xs text-center text-zinc-500 italic">{caption}</p>}
                          </div>
                        );
                      }

                      const parts = p.split(/(\[.*?\]\(.*?\))/g);
                      return (
                        <p key={idx} className="whitespace-pre-line text-justify">
                          {parts.map((part, pIdx) => {
                            const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(part);
                            if (linkMatch) {
                              return (
                                <a
                                  key={pIdx}
                                  href={linkMatch[2]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#5A77DF] underline hover:text-[#3E53A2] font-bold transition"
                                >
                                  {linkMatch[1]} 🔗
                                </a>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Learning Tips Callout */}
            <div className="rounded-2xl border border-[#5A77DF]/20 bg-[#5A77DF]/5 p-6 shadow-sm flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-[#5A77DF] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-[#3E53A2]">Tips Uji Pemahaman</h4>
                <p className="text-2xs text-zinc-700 leading-relaxed font-medium">
                  Pahami video pembelajaran dan teks ringkasan materi di atas dengan saksama. Setelah merasa yakin, tekan tombol di bawah untuk memulai posttest. Anda memerlukan nilai minimal <strong className="text-[#3E53A2] font-black">70%</strong> untuk menyelesaikan modul ini dan membuka lencana baru!
                </p>
              </div>
            </div>

            {/* BOTTOM NAVIGATION / ACTION CTA */}
            {isCompleted ? (
              <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 text-center space-y-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-[#3E53A2] font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-5 w-5 text-[#5A77DF]" />
                  <span>Anda telah menyelesaikan modul ini!</span>
                </div>
                {highestScore !== null && (
                  <p className="text-xs text-zinc-700 font-medium">
                    Nilai Posttest Tertinggi Anda: <strong className="text-[#3E53A2] font-black text-sm">{highestScore}%</strong>
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="rounded-xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 px-6 py-3 text-xs font-extrabold text-[#3E53A2] transition cursor-pointer"
                  >
                    Uji Ulang Pemahaman
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/student/dashboard")}
                    className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full max-w-md rounded-2xl bg-[#5A77DF] hover:bg-[#3E53A2] py-4 text-xs font-extrabold tracking-wider uppercase text-white shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Mulai Uji Pemahaman</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        ) : (
          /* ========================================================
             STEP 2: POSTTEST QUIZ MODE (showQuiz === true)
             ======================================================== */
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            
            {/* Header Info */}
            <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase tracking-widest text-[#5A77DF] font-black font-mono">Uji Pemahaman</span>
                <h2 className="text-sm font-black text-zinc-900 mt-0.5">Posttest: {module.title}</h2>
              </div>
              <button
                type="button"
                onClick={handleBackToMaterial}
                className="rounded-xl border border-[#5A77DF]/20 bg-white px-4 py-2 text-xs font-extrabold text-[#3E53A2] hover:bg-[#5A77DF]/10 transition cursor-pointer"
              >
                ← Lihat Materi
              </button>
            </div>

            {/* Quiz content layouts */}
            {quiz ? (
              <div className="flex flex-col gap-8 md:flex-row">
                
                {/* Left side: Question detail or results */}
                <div className="flex-1 rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  {quizResult ? (
                    /* Quiz Result UI */
                    <div className="text-center space-y-5 py-4 animate-fadeIn">
                      <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-3xl border shadow-xs ${
                        quizResult.passed 
                          ? "bg-[#5A77DF]/10 border-[#5A77DF]/30 text-[#5A77DF]" 
                          : "bg-rose-50 border-rose-200 text-rose-600"
                      }`}>
                        {quizResult.passed ? <CheckCircle2 className="h-8 w-8 text-[#5A77DF]" /> : <AlertCircle className="h-8 w-8 text-rose-600" />}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-zinc-600 uppercase tracking-wider font-mono">
                          {quizResult.passed ? "Hasil Evaluasi: LULUS" : "Hasil Evaluasi: BELUM LULUS"}
                        </h4>
                        <p className="text-2xs text-zinc-500 font-medium">Skor Anda:</p>
                        <div className={`text-4xl font-black ${quizResult.passed ? "text-[#3E53A2]" : "text-rose-600"}`}>
                          {quizResult.score}%
                        </div>
                      </div>

                      {quizResult.passed ? (
                        <p className="text-xs text-zinc-700 max-w-sm mx-auto leading-relaxed font-medium">
                          Luar biasa! Anda memahami materi dengan baik dan berhasil menyelesaikan modul ini.
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-700 max-w-sm mx-auto leading-relaxed font-medium">
                          Batas kelulusan adalah <strong className="text-zinc-900 font-bold">70%</strong>. Silakan baca kembali materi untuk mempertajam pemahaman Anda dan coba lagi!
                        </p>
                      )}

                      {quizResult.badgeAwarded && (
                        <div className="max-w-md mx-auto rounded-2xl border border-[#5A77DF]/30 bg-[#5A77DF]/10 p-4 text-xs text-[#3E53A2] leading-normal font-bold flex items-center justify-center gap-2">
                          <Award className="h-5 w-5 text-[#5A77DF]" />
                          <span>Lencana Baru diperoleh: <strong>&apos;{quizResult.badgeAwarded}&apos;</strong></span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        {!quizResult.passed ? (
                          <>
                            <button
                              type="button"
                              onClick={handleBackToMaterial}
                              className="rounded-xl border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 px-6 py-3 text-xs font-bold text-zinc-700 transition cursor-pointer"
                            >
                              Baca Materi Kembali
                            </button>
                            <button
                              type="button"
                              onClick={handleRetryQuiz}
                              className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                            >
                              Coba Lagi
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push("/student/dashboard")}
                            className="w-full max-w-xs rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                          >
                            Selesai & Masuk Dashboard
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Quiz Answering UI */
                    <div className="space-y-6">
                      {/* Question progress bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-3xs uppercase tracking-widest text-zinc-600 font-extrabold font-mono">
                          <span>Progress Posttest</span>
                          <span className="text-[#3E53A2] font-black">{progressPercent}% Selesai ({answeredCount} dari {totalQuestions} terjawab)</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] transition-all duration-300 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Current Question Text and Options */}
                      {currentQuestion && (
                        <div className="space-y-6 pt-4 border-t border-zinc-100">
                          <div className="text-sm font-extrabold leading-relaxed text-zinc-900">
                            <span className="text-[#5A77DF] font-black uppercase mr-1.5 font-mono">
                              Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}:
                            </span>
                            {currentQuestion.question}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2.5">
                            {currentQuestion.options.map((opt) => {
                              const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                  className={`w-full text-left rounded-xl border px-4 py-3.5 text-xs font-medium transition duration-200 cursor-pointer ${
                                    isSelected
                                      ? "border-[#5A77DF] bg-[#5A77DF]/10 text-[#3E53A2] font-extrabold shadow-2xs"
                                      : "border-zinc-200 bg-white text-zinc-800 hover:border-[#5A77DF]/50 hover:bg-zinc-50"
                                  }`}
                                >
                                  {opt.option_text}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Navigation Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-6 mt-8">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQuestionIndex > 0) {
                              setCurrentQuestionIndex(prev => prev - 1);
                            }
                          }}
                          disabled={currentQuestionIndex === 0}
                          className="rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                        >
                          Sebelumnya
                        </button>

                        {currentQuestionIndex === totalQuestions - 1 ? (
                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={submittingQuiz}
                            className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-8 py-3 text-xs font-extrabold text-white shadow-md transition disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                          >
                            {submittingQuiz ? "Mengirim..." : "Kirim Jawaban Posttest"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (currentQuestionIndex < totalQuestions - 1) {
                                setCurrentQuestionIndex(prev => prev + 1);
                              }
                            }}
                            className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-8 py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                          >
                            Selanjutnya
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* Right side: Sidebar list of questions navigator */}
                {!quizResult && (
                  <div className="w-full md:w-72 rounded-2xl border border-[#5A77DF]/20 bg-white p-5 shadow-sm shrink-0 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5A77DF] pb-2 border-b border-zinc-100 font-mono">
                      Navigasi Soal
                    </h3>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {quiz.questions.map((q, idx) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const isActive = currentQuestionIndex === idx;
                        
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`flex flex-col items-center justify-center rounded-xl border transition-all cursor-pointer w-14 h-14 sm:w-16 sm:h-16 ${
                              isActive
                                ? "border-[#5A77DF] bg-[#5A77DF] text-white font-extrabold shadow-md"
                                : isAnswered
                                ? "border-[#5A77DF]/30 bg-[#5A77DF]/10 text-[#3E53A2] font-bold"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-[#5A77DF]/50 hover:bg-zinc-50"
                            }`}
                          >
                            <span className={`text-3xs font-extrabold uppercase tracking-wider font-mono ${isActive ? "text-white" : "text-zinc-500"}`}>Soal</span>
                            <span className="text-sm font-extrabold mt-0.5">{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 text-3xs text-zinc-600 border-t border-zinc-100 pt-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#5A77DF]/20 border border-[#5A77DF]" />
                        <span>Sudah dijawab</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#5A77DF]" />
                        <span>Soal aktif saat ini</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-white border border-zinc-300" />
                        <span>Belum dijawab</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-8 text-center text-zinc-500 text-xs italic">
                Ujian posttest sedang disiapkan oleh Guru/AI.
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
