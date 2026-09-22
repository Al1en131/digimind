"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-zinc-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-zinc-600">Memuat Kuesioner SRQ-29...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 text-zinc-900 font-sans p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white p-8 md:p-10 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold shadow-sm">
            ✓
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Analisis SRQ-29 Selesai!</h2>
          <p className="text-sm text-zinc-600">
            Terima kasih telah mengisi kuesioner Self Reporting Questionnaire 29 secara jujur.
          </p>

          <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-left space-y-3 shadow-2xs">
            <div className="text-2xs font-extrabold uppercase tracking-wider text-[#5A77DF]">
              Hasil Asesmen Emosional & Kesehatan Mental
            </div>
            <div className="text-lg font-extrabold text-zinc-900">
              {result.mentalLevel}
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed font-medium">
              {result.summaryText}
            </p>
          </div>

          {result.findings && result.findings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900 text-left space-y-2.5">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Catatan Penanganan Konseling:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-800/90 font-medium">
                {result.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p className="text-2xs text-amber-700 pt-1 font-semibold">
                * Tim bimbingan konseling (BK) akan mendampingi Anda secara rahasia dan aman.
              </p>
            </div>
          )}

          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full rounded-2xl bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] py-4 text-sm font-extrabold text-white shadow-md shadow-indigo-200 transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
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
    <div className="relative flex min-h-screen md:h-screen md:max-h-screen flex-col items-center justify-between bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 p-3 sm:p-4 md:p-5 font-sans text-zinc-900 md:overflow-hidden">
      {/* Decorative Background Blur Circles */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl z-10 flex flex-col h-full space-y-3.5 min-h-0">
        
        {/* Header Title Card (Shrink-0) */}
        <div className="shrink-0 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-4 md:p-5 shadow-md shadow-slate-200/60 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/screening-illustration.png"
                alt="DigiMind Screening Illustration"
                className="h-16 sm:h-20 md:h-22 w-auto object-contain shrink-0 drop-shadow-sm"
              />
              <div className="space-y-1">
                <span className="inline-flex items-center text-3xs font-black uppercase tracking-widest text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-full border border-[#5A77DF]/20 font-mono">
                  Kuesioner Diagnosis Awal
                </span>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-zinc-900 uppercase">
                  SELF REPORTING QUESTIONNAIRE - 29 (SRQ-29)
                </h1>
              </div>
            </div>
            <div className="text-2xs sm:text-xs text-zinc-700 max-w-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
              <strong className="text-zinc-900 font-extrabold">Petunjuk:</strong> Pilih <strong className="text-emerald-700 font-black">Y (YA)</strong> jika Anda mengalaminya dalam 30 hari terakhir, atau <strong className="text-[#3E53A2] font-black">T (TIDAK)</strong> jika tidak. Jawaban bersifat rahasia.
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-1 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#5A77DF]/15 border border-[#5A77DF]/25 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5A77DF] to-[#3E53A2] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-zinc-600 font-mono">{progressPercent}% ({answeredCount}/29)</span>
          </div>
        </div>

        {/* Content Layout - Flex-1 Grid 5:7 Ratio */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 overflow-y-auto md:overflow-hidden">
          
          {/* Main Quiz Card (5 Cols - Compact Question Area) */}
          <div className="md:col-span-5 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-md shadow-slate-200/60 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Question */}
              {currentQuestion && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs md:text-sm font-black text-[#5A77DF] uppercase tracking-wider font-mono block">
                      PERTANYAAN {currentIndex + 1} DARI {quiz?.questions.length}
                    </span>
                    <h2 className="text-base sm:text-lg md:text-xl font-black leading-relaxed text-zinc-900">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  {/* Y / T Options */}
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.id;
                      const isYesOption = opt.option_text.toUpperCase().includes("Y");

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                          className={`w-full flex items-center justify-between rounded-xl border px-4.5 py-3.5 text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-2xs ${
                            isSelected
                              ? isYesOption
                                ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-100"
                                : "border-2 border-[#5A77DF] bg-indigo-50/70 text-[#3E53A2] shadow-md shadow-indigo-100"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-[#5A77DF] hover:bg-slate-50 hover:text-zinc-900"
                          }`}
                        >
                          <span className="text-sm sm:text-base font-black tracking-wide">{opt.option_text}</span>
                          <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                            isSelected
                              ? isYesOption
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-[#5A77DF] bg-[#5A77DF] text-white"
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
            </div>

            {/* Navigation Actions */}
            <div className="mt-4 flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 transition-all hover:bg-slate-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 disabled:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Sebelumnya
              </button>

              {quiz && currentIndex === quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-200 transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menganalisis...
                    </span>
                  ) : (
                    "Kirim SRQ-29"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Selanjutnya
                </button>
              )}
            </div>

          </div>

          {/* Question Navigator Sidebar (7 Cols - Fill Section Grid) */}
          <div className="md:col-span-7 rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white p-5 md:p-6 shadow-md shadow-slate-200/60 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="flex-1 flex flex-col min-h-0 justify-between space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 shrink-0 font-mono flex items-center justify-between">
                <span>Daftar Soal SRQ-29</span>
                <span className="text-3xs font-extrabold text-[#5A77DF] bg-[#5A77DF]/10 px-2.5 py-0.5 rounded-lg border border-[#5A77DF]/20">
                  {answeredCount}/29 DIJAWAB
                </span>
              </h2>
              
              {/* Enlarged Number Grid (6 Columns) filling the section */}
              <div className="flex-1 min-h-0 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-6 gap-2.5 sm:gap-3 my-auto">
                {quiz?.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isActive = currentIndex === idx;
                  
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex flex-col items-center justify-center rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 px-1.5 text-center border transition-all cursor-pointer h-full min-h-[52px] sm:min-h-[60px] ${
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
                      <span className="text-sm sm:text-lg md:text-xl font-black mt-0.5 leading-none">{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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

      </div>
    </div>
  );
}
