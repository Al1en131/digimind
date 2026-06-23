"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

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

  // Active question index for single-question view (Pretest style!)
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
    async function loadModule() {
      try {
        const res = await fetch(`/api/student/module/${moduleId}`);
        const data = await res.json();
        
        if (data.success) {
          setModule(data.module);
          setQuiz(data.quiz);
          setIsCompleted(data.isCompleted);
          setHighestScore(data.highestScore);
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
  }, [moduleId]);

  // Handle option selection
  const handleSelectOption = (questionId: number, optionId: number) => {
    if (quizResult?.passed) return; // Prevent changing answers if already passed
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
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] text-white">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Memuat materi modul...</p>
        </div>
      </div>
    );
  }

  if (transitioning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] text-white">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide animate-pulse">
            {showQuiz ? "Kembali ke Materi Pembelajaran..." : "Mempersiapkan Lembar Soal..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#03000a] text-white p-6">
        <div className="max-w-md w-full bg-red-950/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold">Modul Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-400">{error || "Modul yang dicari tidak tersedia."}</p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold"
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
    <div className="relative min-h-screen bg-[#03000a] text-white font-sans pb-16">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

      {/* TOP BAR */}
      <header className={`z-10 w-full ${showQuiz ? "max-w-7xl" : "max-w-4xl"} mx-auto px-4 py-4 flex items-center justify-between border-b border-white/5`}>
        <button
          onClick={() => {
            if (showQuiz) {
              handleBackToMaterial();
            } else {
              router.push("/student/dashboard");
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5 transition cursor-pointer"
        >
          {showQuiz ? "← Kembali ke Materi" : "← Kembali ke Dashboard"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-3xs uppercase tracking-widest text-zinc-500 font-extrabold font-mono">Modul Belajar</span>
        </div>
      </header>

      {/* Step Progress Tracker (Shown only on material reading page) */}
      {!showQuiz && (
        <div className="z-10 w-full max-w-4xl mx-auto px-4 mt-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xs font-extrabold tracking-widest uppercase text-zinc-500 font-mono">
                Status Belajar
              </span>
              <span className="text-3xs font-extrabold tracking-widest uppercase text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                Membaca Materi
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)] w-full animate-pulse" />
              <div className="flex justify-between items-center text-4xs font-bold uppercase tracking-wider text-zinc-500">
                <span>Pelajari video dan teks ringkasan di bawah</span>
                <span className="text-violet-400 font-bold">Sedang Berlangsung</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="z-10 w-full px-4 py-8">
        
        {/* ========================================================
            STEP 1: READING MATERIAL MODE (showQuiz === false)
            ======================================================== */}
        {!showQuiz ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            
            {/* Title Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-3xs px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {module.category}
                </span>
                <span className="text-3xs px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Level: {module.level}
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {module.title}
              </h1>
            </div>

            {/* Video Player with Ambient Glow */}
            {module.video_url && module.media_type === "youtube" && (
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 opacity-20 blur-xl group-hover:opacity-30 transition duration-1000" />
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 shadow-xl backdrop-blur-xl space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                Materi Pembelajaran
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line text-justify">
                {module.content}
              </p>
            </div>

            {/* Learning Tips Callout */}
            <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.02] p-5 shadow-lg backdrop-blur-xl flex items-start gap-4">
              <span className="text-xl">💡</span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-violet-400">Tips Uji Pemahaman</h4>
                <p className="text-2xs text-zinc-400 leading-relaxed">
                  Pahami video pembelajaran dan teks ringkasan materi di atas dengan saksama. Setelah merasa yakin, tekan tombol di bawah untuk memulai posttest. Anda memerlukan nilai minimal <strong className="text-violet-300 font-bold">70%</strong> untuk menyelesaikan modul ini dan membuka lencana baru!
                </p>
              </div>
            </div>

            {/* BOTTOM NAVIGATION / ACTION CTA */}
            {isCompleted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 text-center space-y-4 shadow-xl">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                  <span>Anda telah menyelesaikan modul ini!</span>
                </div>
                {highestScore !== null && (
                  <p className="text-2xs text-zinc-300">
                    Nilai Posttest Tertinggi Anda: <strong className="text-emerald-400 font-bold">{highestScore}%</strong>
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-3 text-2xs font-bold text-zinc-300 transition cursor-pointer"
                  >
                    Uji Ulang Pemahaman
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/student/dashboard")}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-2xs font-bold text-white transition hover:brightness-110 shadow-lg shadow-indigo-500/20 cursor-pointer"
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
                  className="w-full max-w-md rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-xs font-extrabold tracking-widest uppercase text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110 hover:shadow-violet-600/40 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Mulai Uji Pemahaman</span>
                  <span className="text-sm">→</span>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase tracking-widest text-violet-400 font-extrabold font-mono">Uji Pemahaman</span>
                <h2 className="text-xs font-bold text-zinc-300 mt-0.5">Posttest: {module.title}</h2>
              </div>
              <button
                type="button"
                onClick={handleBackToMaterial}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-3xs font-bold text-zinc-400 hover:bg-white/5 transition cursor-pointer"
              >
                ← Lihat Materi
              </button>
            </div>

            {/* Quiz content layouts (Pretest style!) */}
            {quiz ? (
              <div className="flex flex-col gap-8 md:flex-row">
                
                {/* Left side: Question detail or results */}
                <div className="flex-1 rounded-2xl border border-white/10 bg-[#090514] p-6 md:p-8 shadow-2xl space-y-6">
                  {quizResult ? (
                    /* Quiz Result UI */
                    <div className="text-center space-y-5 py-4 animate-fadeIn">
                      <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center text-3xl border ${
                        quizResult.passed 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>
                        {quizResult.passed ? "✓" : "✗"}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          {quizResult.passed ? "Hasil Evaluasi: LULUS" : "Hasil Evaluasi: BELUM LULUS"}
                        </h4>
                        <p className="text-2xs text-zinc-400">Skor Anda:</p>
                        <div className={`text-4xl font-black ${quizResult.passed ? "text-emerald-400" : "text-red-400"}`}>
                          {quizResult.score}%
                        </div>
                      </div>

                      {quizResult.passed ? (
                        <p className="text-2xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                          Luar biasa! Anda memahami materi dengan baik dan berhasil menyelesaikan modul ini.
                        </p>
                      ) : (
                        <p className="text-2xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                          Batas kelulusan adalah <strong className="text-white">70%</strong>. Silakan baca kembali materi untuk mempertajam pemahaman Anda dan coba lagi!
                        </p>
                      )}

                      {quizResult.badgeAwarded && (
                        <div className="max-w-md mx-auto rounded-xl border border-violet-500/20 bg-violet-600/5 p-3 text-3xs text-violet-400 leading-normal">
                          🏆 <strong>Lencana Baru!</strong> Anda memperoleh lencana <strong>&apos;{quizResult.badgeAwarded}&apos;</strong> karena menyelesaikan modul ini.
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        {!quizResult.passed ? (
                          <>
                            <button
                              type="button"
                              onClick={handleBackToMaterial}
                              className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-3 text-2xs font-bold text-zinc-300 transition cursor-pointer"
                            >
                              Baca Materi Kembali
                            </button>
                            <button
                              type="button"
                              onClick={handleRetryQuiz}
                              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3 text-2xs font-bold text-white transition cursor-pointer"
                            >
                              Coba Lagi
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push("/student/dashboard")}
                            className="w-full max-w-xs rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-2xs font-bold text-white transition hover:brightness-110 shadow-lg shadow-indigo-500/20 cursor-pointer"
                          >
                            Selesai & Masuk Dashboard
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Quiz Answering UI */
                    <div className="space-y-6">
                      {/* Question progress bar (Pretest style!) */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-3xs uppercase tracking-widest text-zinc-500 font-bold font-mono">
                          <span>Progress Posttest</span>
                          <span className="text-violet-400">{progressPercent}% Selesai ({answeredCount} dari {totalQuestions} terjawab)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Current Question Text and Options */}
                      {currentQuestion && (
                        <div className="space-y-6 pt-4 border-t border-white/5">
                          <div className="text-sm font-semibold leading-relaxed text-zinc-200">
                            <span className="text-violet-400 font-extrabold uppercase mr-1.5 font-mono">
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
                                  className={`w-full text-left rounded-xl border px-4 py-3.5 text-2xs font-medium transition duration-200 cursor-pointer ${
                                    isSelected
                                      ? "border-violet-500 bg-violet-600/15 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                                      : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-200"
                                  }`}
                                >
                                  {opt.option_text}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Navigation Actions (Pretest style!) */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQuestionIndex > 0) {
                              setCurrentQuestionIndex(prev => prev - 1);
                            }
                          }}
                          disabled={currentQuestionIndex === 0}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-2xs font-semibold text-zinc-300 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                        >
                          Sebelumnya
                        </button>

                        {currentQuestionIndex === totalQuestions - 1 ? (
                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={submittingQuiz}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-2xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
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
                            className="rounded-xl bg-violet-600 px-8 py-3 text-2xs font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98] cursor-pointer"
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
                  <div className="w-full md:w-72 rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl shrink-0 space-y-4">
                    <h3 className="text-2xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/5 font-mono">
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
                                ? "border-violet-500 bg-violet-600/20 text-white font-bold ring-1 ring-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                                : isAnswered
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                                : "border-white/5 bg-white/[0.01] text-zinc-500 hover:border-white/15 hover:bg-white/[0.03]"
                            }`}
                          >
                            <span className="text-3xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Soal</span>
                            <span className="text-sm font-extrabold mt-0.5">{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 text-4xs text-zinc-500 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 border border-emerald-500/30" />
                        <span>Sudah dijawab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-600/30 border border-violet-500/50" />
                        <span>Soal aktif saat ini</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/5 border border-white/10" />
                        <span>Belum dijawab</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center text-zinc-500 text-xs italic">
                Ujian posttest sedang disiapkan oleh Guru/AI.
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
