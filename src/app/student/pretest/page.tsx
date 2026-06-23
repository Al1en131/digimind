"use client";

import { useState, useEffect } from "react";
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

export default function PretestPage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [currentIndex, setCurrentIndex] = useState(0); // active question index
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    literacyLevel: string;
    mentalLevel: string;
    riskFlag: boolean;
  } | null>(null);

  // Fetch quiz on mount
  useEffect(() => {
    // 1. Client-side localStorage check for quick redirect
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj.hasCompletedPretest) {
          router.push("/student/dashboard");
          return;
        }
      } catch {}
    }

    async function fetchQuiz() {
      try {
        const res = await fetch("/api/student/quiz/pretest");
        const data = await res.json();
        if (data.success) {
          if (data.hasCompletedPretest) {
            // Update local storage just in case
            if (storedUser) {
              try {
                const userObj = JSON.parse(storedUser);
                userObj.hasCompletedPretest = true;
                localStorage.setItem("user", JSON.stringify(userObj));
              } catch {}
            }
            router.push("/student/dashboard");
            return;
          }
          setQuiz(data.quiz);
        } else {
          setError(data.message || "Gagal memuat kuis.");
        }
      } catch {
        setError("Gagal menghubungi server.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [router]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (quiz && currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError("Silakan jawab semua pertanyaan terlebih dahulu sebelum mengirim.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Format answers array
    const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
      questionId: parseInt(qId),
      optionId: oId,
    }));

    try {
      const res = await fetch("/api/student/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim jawaban.");
      }

      setResult(data.result);
      
      // Update local storage user object
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.hasCompletedPretest = true;
        localStorage.setItem("user", JSON.stringify(userObj));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03000a] text-white">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Memuat Kuesioner Diagnosis Awal...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-radial from-[#1e1b4b] via-[#090514] to-[#03000a] px-4 py-12 text-white font-sans">
        <div className="w-full max-w-3xl rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-fadeIn">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Analisis Selesai!</h2>
          <p className="text-sm text-zinc-300">
            Terima kasih telah mengisi kuesioner. Profil literasi digital dan kesiapan mental Anda berhasil dipetakan:
          </p>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-2xs text-zinc-500 uppercase tracking-widest mb-1">Tingkat Literasi</div>
              <div className="text-lg font-bold text-violet-400">{result.literacyLevel}</div>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-2xs text-zinc-500 uppercase tracking-widest mb-1">Kesehatan Mental</div>
              <div className="text-lg font-bold text-indigo-400">{result.mentalLevel}</div>
            </div>
          </div>

          {result.riskFlag && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400 text-left leading-relaxed">
              💡 <strong>Rekomendasi Awal:</strong> AI mendeteksi tingkat stres/screen-time Anda cukup tinggi. Sistem kami akan menyesuaikan modul motivasi dan menugaskan intervensi bimbingan ringan untuk membantu Anda.
            </div>
          )}

          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Masuk ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz?.questions[currentIndex];
  const answeredCount = quiz ? quiz.questions.filter((q) => answers[q.id]).length : 0;
  const progressPercent = quiz ? Math.round((answeredCount / quiz.questions.length) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-[#03000a] px-4 py-12 font-sans text-white md:py-20">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl z-10 flex flex-col gap-8 md:flex-row px-2 sm:px-4">
        
        {/* Main Left Section: Quiz Content */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl md:p-8">
          
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 uppercase sm:text-2xl">
              {quiz?.title || "Kuesioner Diagnosis Awal"}
            </h1>
            
            {/* Progress Bar Container */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-zinc-400">{progressPercent}% selesai</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {/* Question Text */}
          {currentQuestion && (
            <div className="space-y-6">
              <div className="text-sm font-semibold leading-relaxed text-zinc-200">
                <span className="text-violet-400 font-extrabold uppercase mr-1">
                  Pertanyaan {currentIndex + 1} dari {quiz?.questions.length}:
                </span>{" "}
                {currentQuestion.question.replace(/\[.*?\]\s*/, "")}
              </div>

              {/* Vertical Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full text-left rounded-xl border px-5 py-4 text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? "border-violet-500 bg-violet-600/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                          : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/15 hover:bg-white/[0.03]"
                      }`}
                    >
                      {opt.option_text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Actions Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              Sebelumnya
            </button>

            {quiz && currentIndex === quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  "Kirim Jawaban"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-violet-600 px-8 py-3 text-xs font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
              >
                Selanjutnya
              </button>
            )}
          </div>

        </div>

        {/* Right Section: Question Navigator Sidebar */}
        <div className="w-full md:w-80 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 pb-2 border-b border-white/5">
            Daftar Soal
          </h2>
          
          {/* Sidebar grid listing Questions */}
          <div className="grid grid-cols-5 gap-2 md:grid-cols-3">
            {quiz?.questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isActive = currentIndex === idx;
              
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                    isActive
                      ? "border-violet-500 bg-violet-600/20 text-white font-bold ring-1 ring-violet-500/30"
                      : isAnswered
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                      : "border-white/5 bg-white/[0.01] text-zinc-500 hover:border-white/15 hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="text-2xs font-semibold uppercase tracking-wider">Soal</span>
                  <span className="text-sm font-bold mt-0.5">{idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 text-3xs text-zinc-500 leading-normal border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500/50 border border-emerald-500/30" />
              <span>Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-600/30 border border-violet-500/50" />
              <span>Soal aktif saat ini</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/5 border border-white/10" />
              <span>Belum dijawab</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
