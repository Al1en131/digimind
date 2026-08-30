"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
    findings?: string[];
    summaryText?: string;
  } | null>(null);

  // Fetch quiz on mount
  useEffect(() => {
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
        if (!res.ok) {
          setError("Gagal memuat kuesioner dari server. Silakan refresh/muat ulang halaman.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.success) {
          if (data.hasCompletedPretest) {
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
          setError(data.message || "Gagal memuat kuesioner SRQ-29.");
        }
      } catch {
        setError("Gagal menghubungi server. Silakan coba lagi.");
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

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Silakan jawab semua pertanyaan terlebih dahulu. Masih ada ${unanswered.length} soal yang belum dijawab.`);
      return;
    }

    setSubmitting(true);
    setError(null);

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

      if (!res.ok) {
        throw new Error("Terjadi kesalahan server saat menyimpan kuesioner.");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal mengirim kuesioner.");
      }

      setResult(data.result);
      
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
      <div className="flex min-h-screen items-center justify-center bg-white text-zinc-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Memuat Kuesioner SRQ-29...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-white text-zinc-900 font-sans">
        <div className="w-full max-w-3xl rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-fadeIn">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Analisis SRQ-29 Selesai!</h2>
          <p className="text-sm text-zinc-300">
            Terima kasih telah mengisi kuesioner Self Reporting Questionnaire 29 secara jujur.
          </p>

          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-left space-y-3">
            <div className="text-2xs font-extrabold uppercase tracking-wider text-violet-400">
              Hasil Asesmen Emosional & Kesehatan Mental
            </div>
            <div className="text-base font-bold text-zinc-100">
              {result.mentalLevel}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {result.summaryText}
            </p>
          </div>

          {result.findings && result.findings.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Catatan Penanganan Konseling:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-2xs text-amber-200/90">
                {result.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p className="text-3xs text-amber-400/80 pt-1">
                * Tim bimbingan konseling (BK) akan mendampingi Anda secara rahasia dan aman.
              </p>
            </div>
          )}

          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] py-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
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
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-white px-4 py-10 font-sans text-zinc-900 md:py-16">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl z-10 space-y-6 px-2 sm:px-4">
        
        {/* Header Title Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20 font-mono">
                Kuesioner Diagnosis Awal
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100 uppercase mt-1">
                SELF REPORTING QUESTIONNAIRE - 29 (SRQ-29)
              </h1>
            </div>
            <div className="text-2xs text-zinc-400 max-w-md bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed">
              <strong>Petunjuk:</strong> Bacalah pertanyaan seluruhnya. Apabila anda menganggap pertanyaan ini anda alami dalam 30 hari terakhir, pilih <strong>Y (YA)</strong>. Sebaliknya apabila tidak anda alami dalam 30 hari terakhir, pilih <strong>T (TIDAK)</strong>. Jawaban anda bersifat rahasia.
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-2 flex items-center gap-4 border-t border-white/5">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-zinc-400 font-mono">{progressPercent}% ({answeredCount}/29)</span>
          </div>
        </div>

        {/* Content Layout - Grid 7:5 Ratio for Wider Number Navigator Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Quiz Card (7 Cols) */}
          <div className="md:col-span-7 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl md:p-8 space-y-6 flex flex-col justify-between">
            
            <div className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 animate-pulse flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Question */}
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-base font-semibold leading-relaxed text-zinc-100">
                    <span className="text-violet-400 font-extrabold uppercase mr-1.5 font-mono">
                      Pertanyaan {currentIndex + 1} dari {quiz?.questions.length}:
                    </span>{" "}
                    {currentQuestion.question}
                  </div>

                  {/* Y / T Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.id;
                      const isYesOption = opt.option_text.toUpperCase().includes("Y");

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                          className={`w-full flex items-center justify-between rounded-xl border px-5 py-4 text-sm font-bold transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? isYesOption
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                : "border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                              : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-200"
                          }`}
                        >
                          <span className="text-base font-black">{opt.option_text}</span>
                          <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs ${
                            isSelected
                              ? isYesOption ? "border-emerald-400 bg-emerald-400 text-black font-extrabold" : "border-indigo-400 bg-indigo-400 text-black font-extrabold"
                              : "border-white/20"
                          }`}>
                            {isSelected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
              >
                Sebelumnya
              </button>

              {quiz && currentIndex === quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] px-8 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menganalisis SRQ-29...
                    </span>
                  ) : (
                    "Kirim Kuesioner SRQ-29"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-violet-600 px-8 py-3 text-xs font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] cursor-pointer"
                >
                  Selanjutnya
                </button>
              )}
            </div>

          </div>

          {/* Question Navigator Sidebar (Wider - 5 Cols) */}
          <div className="md:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 pb-2 border-b border-white/5 font-mono flex items-center justify-between">
                <span>Daftar Soal SRQ-29</span>
                <span className="text-3xs font-extrabold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                  {answeredCount}/29 Dijawab
                </span>
              </h2>
              
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                {quiz?.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isActive = currentIndex === idx;
                  
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex flex-col items-center justify-center rounded-xl py-3 px-2 text-center border transition-all cursor-pointer ${
                        isActive
                          ? "border-violet-500 bg-violet-600/25 text-white font-bold ring-2 ring-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                          : isAnswered
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:border-emerald-500/60 font-semibold"
                          : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider font-mono opacity-80">Soal</span>
                      <span className="text-sm font-bold mt-0.5">{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-3xs text-zinc-400 leading-normal border-t border-white/5 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                <span className="font-medium text-emerald-300">Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500 border border-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                <span className="font-medium text-violet-300">Sedang aktif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10 border border-white/20" />
                <span className="font-medium text-zinc-400">Belum dijawab</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
