"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminView = "overview" | "modules" | "quizzes" | "users" | "journals" | "progress";

type ModuleItem = { id: number; title: string; category: string; level: string; status: string };
type QuizItem = { id: number; title: string; type: string; module: string; status: string };
type UserItem = { id: number; name: string; role: string; email: string; status: string };
type JournalItem = { id: number; student: string; mood: number; note: string; date: string };
type ProgressItem = { id: number; student: string; className: string; literacy: number; mental: number; risk: string };

const NAV_ITEMS: Array<{ id: AdminView; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "modules", label: "Modul", icon: "📚" },
  { id: "quizzes", label: "Quiz", icon: "📝" },
  { id: "users", label: "User", icon: "👥" },
  { id: "journals", label: "Jurnal", icon: "🧠" },
  { id: "progress", label: "Progress", icon: "📈" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [summary, setSummary] = useState({ modules: 0, quizzes: 0, users: 0, journals: 0, atRisk: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.success) return;

        setModules(data.modules || []);
        setQuizzes(data.quizzes || []);
        setUsers(data.users || []);
        setJournals(data.journals || []);
        setProgress(data.progress || []);
        setSummary(data.summary || { modules: 0, quizzes: 0, users: 0, journals: 0, atRisk: 0 });
      } catch {
        // Ignore load errors and keep the shell visible.
      }
    };

    loadData();
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: "Modul", value: summary.modules, accent: "text-emerald-300" },
      { label: "Quiz", value: summary.quizzes, accent: "text-cyan-300" },
      { label: "User", value: summary.users, accent: "text-violet-300" },
      { label: "Jurnal", value: summary.journals, accent: "text-amber-300" },
      { label: "Butuh perhatian", value: summary.atRisk, accent: "text-rose-300" },
    ],
    [summary]
  );

  return (
    <div className="min-h-screen bg-[#03000a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-105 w-105 rounded-full bg-emerald-900/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-105 w-105 rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="rounded-2xl border border-white/10 bg-white/3 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Dashboard Admin</p>
              <h1 className="mt-1 text-2xl font-extrabold text-zinc-100">Kelola sistem DigiMind secara penuh</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">Admin memiliki akses penuh untuk mengelola modul, kuis, user, jurnal, dan melihat progress belajar siswa.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
            >
              Kembali ke portal
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="w-full xl:w-72 shrink-0">
            <div className="sticky top-4 rounded-2xl border border-white/10 bg-white/2 p-4 backdrop-blur-xl">
              <div className="border-b border-white/5 px-2 pb-3">
                <p className="text-2xs font-bold uppercase tracking-[0.25em] text-zinc-500">Menu</p>
                <h2 className="text-sm font-semibold text-zinc-100">Admin System</h2>
              </div>
              <div className="mt-3 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                        isActive
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/3 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-6">
            {activeView === "overview" && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-xl">
                      <p className="text-3xs uppercase tracking-wider text-zinc-500">{card.label}</p>
                      <p className={`mt-2 text-2xl font-bold ${card.accent}`}>{card.value}</p>
                      <p className="mt-1 text-3xs text-zinc-400">Ringkasan sistem admin</p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Akses penuh admin</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">Kelola seluruh sistem dari satu dashboard</h2>
                    <p className="mt-3 text-sm text-zinc-400">Admin dapat mengelola modul pembelajaran, kuis pretest/posttest, akun guru dan siswa, data jurnal, serta memantau progress belajar siswa secara real-time.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Catatan cepat</p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                      <li>• CRUD modul pembelajaran</li>
                      <li>• CRUD kuis pretest dan posttest</li>
                      <li>• CRUD akun guru dan siswa</li>
                      <li>• Monitoring jurnal & progress belajar</li>
                    </ul>
                  </div>
                </section>
              </>
            )}

            {activeView === "modules" && (
              <section className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Manajemen Modul</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">CRUD modul pembelajaran</h2>
                  </div>
                  <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Tambah Modul</button>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className="bg-white/3 text-zinc-400">
                      <tr>
                        <th className="px-3 py-3">Judul</th>
                        <th className="px-3 py-3">Kategori</th>
                        <th className="px-3 py-3">Level</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/10">
                      {modules.map((module) => (
                        <tr key={module.id} className="hover:bg-white/3">
                          <td className="px-3 py-3 text-zinc-100">{module.title}</td>
                          <td className="px-3 py-3 text-zinc-300">{module.category}</td>
                          <td className="px-3 py-3 text-zinc-300">{module.level}</td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-semibold text-emerald-300">{module.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === "quizzes" && (
              <section className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Manajemen Kuis</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">CRUD pretest dan posttest</h2>
                  </div>
                  <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Tambah Quiz</button>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className="bg-white/3 text-zinc-400">
                      <tr>
                        <th className="px-3 py-3">Judul</th>
                        <th className="px-3 py-3">Tipe</th>
                        <th className="px-3 py-3">Modul</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/10">
                      {quizzes.map((quiz) => (
                        <tr key={quiz.id} className="hover:bg-white/3">
                          <td className="px-3 py-3 text-zinc-100">{quiz.title}</td>
                          <td className="px-3 py-3 text-zinc-300">{quiz.type}</td>
                          <td className="px-3 py-3 text-zinc-300">{quiz.module}</td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-2xs font-semibold text-cyan-300">{quiz.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === "users" && (
              <section className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-violet-300">Manajemen User</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">CRUD akun guru dan siswa</h2>
                  </div>
                  <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Tambah User</button>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className="bg-white/3 text-zinc-400">
                      <tr>
                        <th className="px-3 py-3">Nama</th>
                        <th className="px-3 py-3">Role</th>
                        <th className="px-3 py-3">Email</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/10">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/3">
                          <td className="px-3 py-3 text-zinc-100">{user.name}</td>
                          <td className="px-3 py-3 text-zinc-300">{user.role}</td>
                          <td className="px-3 py-3 text-zinc-300">{user.email}</td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-2xs font-semibold text-violet-300">{user.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === "journals" && (
              <section className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-amber-300">Data Jurnal</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">Lihat dan pantau jurnal siswa</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {journals.map((journal) => (
                    <div key={journal.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-100">{journal.student}</span>
                        <span className="text-2xs uppercase tracking-wider text-amber-300">Mood {journal.mood}/5</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">{journal.note}</p>
                      <p className="mt-2 text-3xs uppercase tracking-wider text-zinc-500">{journal.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeView === "progress" && (
              <section className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Progress Belajar Siswa</p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-100">Pantau literasi digital dan mental health</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {progress.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-100">{item.student}</span>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-semibold text-emerald-300">{item.risk}</span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm text-zinc-300">
                            <span>Literasi Digital</span>
                            <span>{item.literacy}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${item.literacy}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm text-zinc-300">
                            <span>Mental Health</span>
                            <span>{item.mental}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${item.mental}%` }} />
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-3xs uppercase tracking-wider text-zinc-500">{item.className}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
