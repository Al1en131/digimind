"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  ChevronRight, 
  AlertCircle
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
  subjectName?: string;
}

interface StudentModuleDetailViewProps {
  moduleId: number;
  onBack: () => void;
}

export default function StudentModuleDetailView({ moduleId, onBack }: StudentModuleDetailViewProps) {
  const router = useRouter();

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

  // Active question index for single-question view
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Transition wrappers to scroll to top and show intermediate loader
  const handleStartQuiz = () => {
    setTransitioning(true);
    setTimeout(() => {
      setShowQuiz(true);
      setTransitioning(false);
      setCurrentQuestionIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 350);
  };

  const handleBackToMaterial = () => {
    setTransitioning(true);
    setTimeout(() => {
      setShowQuiz(false);
      setTransitioning(false);
      setCurrentQuestionIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 350);
  };

  // Quiz answering state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    badgeAwarded: string | null;
  } | null>(null);

  // Fetch module and quiz on mount
  useEffect(() => {
    let isMounted = true;
    async function loadModule() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/module/${moduleId}`);
        const data = await res.json();
        
        if (isMounted) {
          if (data.success) {
            setModule(data.module);
            setQuiz(data.quiz);
            setIsCompleted(data.isCompleted);
            setHighestScore(data.highestScore);
            setReadingProgress(data.savedProgress || 0);
          } else {
            setError(data.message || "Gagal memuat modul.");
          }
        }
      } catch {
        if (isMounted) setError("Gagal menghubungi server.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadModule();
    return () => { isMounted = false; };
  }, [moduleId]);

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
      <div className="flex py-24 items-center justify-center bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-xs">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-600">Memuat materi modul...</p>
        </div>
      </div>
    );
  }

  if (transitioning) {
    return (
      <div className="flex py-24 items-center justify-center bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-xs">
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
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-zinc-900">Modul Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-600 font-medium">{error || "Modul yang dicari tidak tersedia."}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] text-xs font-extrabold text-white transition shadow-md cursor-pointer"
        >
          Kembali ke Daftar Modul
        </button>
      </div>
    );
  }

  const answeredCount = quiz ? quiz.questions.filter((q) => selectedAnswers[q.id] !== undefined).length : 0;
  const totalQuestions = quiz ? quiz.questions.length : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-6 animate-fadeIn text-zinc-900">
      {/* Dynamic Reading Progress Top Bar */}
      {/* {!showQuiz && (
        <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#5A77DF] via-[#4A64CA] to-[#3E53A2] transition-all duration-300 ease-out"
            style={{ width: `${isCompleted ? 100 : Math.max(readingProgress, 5)}%` }}
          />
        </div>
      )} */}

      {/* TOP ACTION BAR */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => {
            if (showQuiz) {
              handleBackToMaterial();
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-extrabold text-zinc-700 hover:border-[#5A77DF] hover:bg-[#5A77DF]/10 hover:text-[#3E53A2] transition cursor-pointer shadow-2xs"
          title="Kembali ke Daftar Modul Pembelajaran"
        >
          <ArrowLeft className="h-4 w-4 text-[#5A77DF]" />
          {/* <span>{showQuiz ? "Kembali ke Materi" : "Kembali ke Daftar Modul"}</span> */}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-3xs uppercase tracking-widest text-[#5A77DF] font-black font-mono">Modul Belajar</span>
        </div>
      </div>

      {/* ========================================================
         STEP 1: READING MATERIAL MODE (showQuiz === false)
         ======================================================== */}
      {!showQuiz ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Status Belajar Card */}
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
                {/* <span>Pelajari video dan teks ringkasan di bawah (Scroll untuk memperbarui)</span> */}
                <span className="text-[#3E53A2] font-black">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1">Modul Selesai <CheckCircle2 className="w-3 h-3 text-[#5A77DF]" /></span>
                  ) : (
                    `Tersimpan ${readingProgress}%`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Title Card */}
          <div className="rounded-2xl border border-[#5A77DF]/20 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-3xs px-3 py-1 rounded-full font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30 font-mono">
                {module.subjectName || module.category}
              </span>
              <span className="text-3xs px-3 py-1 rounded-full font-extrabold uppercase bg-[#5A77DF]/10 text-[#3E53A2] border border-[#5A77DF]/30 font-mono">
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
                    className="text-xs sm:text-sm text-zinc-800 font-medium leading-relaxed max-w-none space-y-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:mx-auto [&_img]:shadow-sm [&_img]:my-4 [&_iframe]:max-w-full [&_iframe]:rounded-2xl [&_table]:w-full"
                    dangerouslySetInnerHTML={{ __html: contentStr }}
                  />
                );
              }

              const paragraphs = contentStr.split("\n\n");
              return (
                <div className="space-y-4 text-xs sm:text-sm text-zinc-800 font-medium leading-relaxed">
                  {paragraphs.map((p, idx) => {
                    const imgMatch = /!\[(.*?)\]\((.*?)\)/.exec(p);
                    if (imgMatch) {
                      const caption = imgMatch[1];
                      const imgSrc = imgMatch[2];
                      return (
                        <div key={idx} className="my-4 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 p-2 space-y-2">
                          <img src={imgSrc} alt={caption || "Gambar Modul"} className="max-w-full h-auto max-h-[450px] object-contain rounded-lg mx-auto" />
                          {caption && <p className="text-3xs text-center text-zinc-500 italic">{caption}</p>}
                        </div>
                      );
                    }
                    return <p key={idx}>{p}</p>;
                  })}
                </div>
              );
            })()}
          </div>

          {/* Bottom Action: Proceed to Posttest Quiz */}
          {quiz && quiz.questions && quiz.questions.length > 0 && (
            <div className="rounded-2xl border border-[#5A77DF]/30 bg-gradient-to-r from-[#5A77DF]/10 via-[#5A77DF]/5 to-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Award className="h-5 w-5 text-[#5A77DF]" />
                  <h3 className="text-sm font-black text-zinc-900">Uji Pemahaman Posttest</h3>
                </div>
                <p className="text-2xs text-zinc-600 font-medium">
                  {isCompleted
                    ? `Modul telah selesai dikerjakan dengan nilai tertinggi ${highestScore || 100}%. Anda dapat mencoba lagi kapan saja.`
                    : `Selesaikan ${quiz.questions.length} soal posttest ini untuk lulus dari modul ini.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartQuiz}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-3 text-xs font-extrabold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isCompleted ? "Ulangi Posttest" : "Mulai Uji Pemahaman"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      ) : (
        /* ========================================================
           STEP 2: POSTTEST QUIZ MODE (showQuiz === true)
           ======================================================== */
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Title Card */}
          <div className="shrink-0 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-4 md:p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/quiz-illustration.png"
                  alt="DigiMind Quiz Illustration"
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0 drop-shadow-md"
                />
                <div className="space-y-1">
                  <span className="inline-flex items-center text-3xs font-black uppercase tracking-widest text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-full border border-[#5A77DF]/20 font-mono">
                    Uji Pemahaman Modul
                  </span>
                  <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-900 uppercase">
                    Posttest: {module.title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xs sm:text-xs text-zinc-700 max-w-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium hidden lg:block">
                  <strong className="text-zinc-900 font-extrabold">Petunjuk:</strong> Jawablah seluruh soal posttest untuk menguji pemahaman Anda. Batas kelulusan adalah 70%.
                </div>
                {/* <button
                  type="button"
                  onClick={handleBackToMaterial}
                  className="rounded-xl border border-[#5A77DF]/20 bg-slate-50 hover:bg-[#5A77DF]/10 px-4 py-2.5 text-xs font-extrabold text-[#3E53A2] transition cursor-pointer shrink-0"
                >
                  ← Lihat Materi
                </button> */}
              </div>
            </div>

            {/* Progress Bar */}
            {quiz && !quizResult && (
              <div className="pt-1 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-[#5A77DF]/15 border border-[#5A77DF]/25 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-zinc-600 font-mono">{progressPercent}% ({answeredCount}/{totalQuestions})</span>
              </div>
            )}
          </div>

          {/* Quiz content layouts */}
          {quiz ? (
            quizResult ? (
              /* Quiz Result UI */
              <div className="rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-10 shadow-sm text-center space-y-5 animate-fadeIn">
                <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-3xl border shadow-xs ${
                  quizResult.passed 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                    : "bg-rose-50 border-rose-200 text-rose-600"
                }`}>
                  {quizResult.passed ? <CheckCircle2 className="h-8 w-8 text-emerald-600" /> : <AlertCircle className="h-8 w-8 text-rose-600" />}
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
                      onClick={onBack}
                      className="w-full max-w-xs rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] py-3 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                    >
                      Selesai & Kembali ke Modul
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 5:7 Ratio Grid Quiz Answering UI */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
                
                {/* Left Quiz Card (5 Cols) */}
                <div className="md:col-span-5 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4">
                  {currentQuestion && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs md:text-sm font-black text-[#5A77DF] uppercase tracking-wider font-mono block">
                          PERTANYAAN {currentQuestionIndex + 1} DARI {totalQuestions}
                        </span>
                        <h2 className="text-base sm:text-lg font-black leading-relaxed text-zinc-900">
                          {currentQuestion.question}
                        </h2>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2.5 pt-1">
                        {currentQuestion.options.map((opt) => {
                          const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-2xs ${
                                isSelected
                                  ? "border-2 border-[#5A77DF] bg-indigo-50/70 text-[#3E53A2] shadow-md shadow-indigo-100 font-black"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-[#5A77DF] hover:bg-slate-50 hover:text-zinc-900"
                              }`}
                            >
                              <span className="text-xs sm:text-sm font-black tracking-wide text-left">{opt.option_text}</span>
                              <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all shrink-0 ${
                                isSelected
                                  ? "border-[#5A77DF] bg-[#5A77DF] text-white"
                                  : "border-zinc-300 text-transparent"
                              }`}>
                                ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation Actions */}
                  <div className="mt-4 flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentQuestionIndex > 0) {
                          setCurrentQuestionIndex(prev => prev - 1);
                        }
                      }}
                      disabled={currentQuestionIndex === 0}
                      className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 shadow-2xs cursor-pointer"
                    >
                      Sebelumnya
                    </button>

                    {currentQuestionIndex === totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={submittingQuiz}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-200 transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                      >
                        {submittingQuiz ? "Mengirim..." : "Kirim Posttest"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentQuestionIndex < totalQuestions - 1) {
                            setCurrentQuestionIndex(prev => prev + 1);
                          }
                        }}
                        className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Selanjutnya
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Navigator Sidebar (7 Cols) */}
                <div className="md:col-span-7 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 shrink-0 font-mono flex items-center justify-between">
                      <span>Daftar Soal Posttest</span>
                      <span className="text-3xs font-extrabold text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-lg border border-[#5A77DF]/20">
                        {answeredCount}/{totalQuestions} DIJAWAB
                      </span>
                    </h2>

                    {/* Number Grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-2 sm:gap-2.5">
                      {quiz.questions.map((q, idx) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const isActive = currentQuestionIndex === idx;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`flex flex-col items-center justify-center rounded-xl py-2.5 sm:py-3 px-1.5 text-center border transition-all cursor-pointer h-full min-h-[50px] ${
                              isActive
                                ? "border-2 border-[#3E53A2] bg-[#5A77DF] text-white font-black shadow-md shadow-indigo-200 ring-2 ring-[#5A77DF]/40 scale-[1.02]"
                                : isAnswered
                                ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-900 font-black shadow-2xs hover:bg-emerald-100"
                                : "border-zinc-200 bg-slate-50 text-zinc-700 hover:border-zinc-300 hover:bg-slate-100 font-bold"
                            }`}
                          >
                            <span className={`text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-widest font-mono ${isActive ? "text-white/80" : isAnswered ? "text-emerald-700" : "text-zinc-400"}`}>
                              SOAL
                            </span>
                            <span className="text-sm sm:text-base font-black mt-0.5 leading-none">{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend Footer */}
                  <div className="mt-2 shrink-0 flex flex-wrap items-center justify-between gap-3 text-2xs text-zinc-600 leading-normal pt-2 font-extrabold">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
                      <span className="text-emerald-700">Sudah dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#5A77DF] border border-[#3E53A2]" />
                      <span className="text-[#5A77DF]">Sedang aktif</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200 border border-zinc-300" />
                      <span className="text-zinc-500">Belum dijawab</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
