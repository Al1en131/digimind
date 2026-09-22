"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      router.replace(`/student/dashboard?module=${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 border-4 border-[#5A77DF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-600">Membuka modul di Dashboard Siswa...</p>
      </div>
    </div>
  );
}
