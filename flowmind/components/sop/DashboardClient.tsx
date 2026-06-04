"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UserButton } from "@clerk/nextjs";
import { Plus, FileText, Trash2, ChevronRight, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner"; // 👈
import { usePlan } from "@/hooks/usePlan";
import BrainDumpModal from "./BrainDumpModal";
import UpgradeModal from "./UpgradeModal";
import ThemeToggle from "@/components/ThemeToggle";
import type { Sop } from "@prisma/client";
import { FREE_LIMIT } from "@/lib/utils";

type SopWithStepCount = Sop & { steps: { id: string }[] };
type InitialUser = {
  name: string | null;
  email: string;
  plan: string;
  sops: SopWithStepCount[];
};

export default function DashboardClient({ initialUser }: { initialUser: InitialUser }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { atLimit, plan, sopCount, remaining, isLoading } = usePlan();

  const [sops, setSops] = useState<SopWithStepCount[]>(initialUser.sops);
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SopWithStepCount | null>(null); // 👈 replaces confirm()

  function handleNewSop() {
    if (!isLoading && atLimit) {
      setShowUpgrade(true);
    } else {
      setShowBrainDump(true);
    }
  }

  // 👈 Step 1: open custom dialog instead of confirm()
  function handleDeleteClick(e: React.MouseEvent, sop: SopWithStepCount) {
    e.stopPropagation();
    setDeleteTarget(sop);
  }

  // 👈 Step 2: actual delete after user confirms in dialog
  async function confirmDelete() {
    if (!deleteTarget) return;
    const sopId = deleteTarget.id;
    const sopTitle = (deleteTarget as any).title ?? "This SOP";
    setDeleteTarget(null);
    setDeletingId(sopId);

    const toastId = toast.loading("Deleting SOP...");
    try {
      const res = await fetch(`/api/sop/${sopId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSops((prev) => prev.filter((s) => s.id !== sopId));
      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      toast.success(`"${sopTitle}" deleted`, { id: toastId });
    } catch {
      toast.error("Failed to delete. Try again.", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  }

  function handleSopCreated(newSop: SopWithStepCount) {
    setSops((prev) => [newSop, ...prev]);
    queryClient.invalidateQueries({ queryKey: ["user-plan"] });
    setShowBrainDump(false);
    toast.success("SOP created! ✨"); // 👈 yeh wala missing tha
    router.push(`/dashboard/sop/${newSop.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-indigo-600 text-lg">FlowMind</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {plan === "free" && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Upgrade to Pro
            </button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Hey {initialUser.name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {plan === "free"
                ? `${sopCount} of ${FREE_LIMIT} SOPs used · ${remaining} remaining`
                : "Pro · unlimited SOPs"}
            </p>
          </div>
          <button
            onClick={handleNewSop}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New SOP
          </button>
        </div>

        {/* Free tier progress bar */}
        {plan === "free" && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Free plan usage</span>
              <span className="text-gray-500">{sopCount} / {FREE_LIMIT}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (sopCount / FREE_LIMIT) * 100)}%` }}
              />
            </div>
            {atLimit && (
              <p className="text-xs text-amber-600 mt-2">
                Limit reached.{" "}
                <button onClick={() => setShowUpgrade(true)} className="underline">
                  Upgrade to Pro
                </button>
              </p>
            )}
          </div>
        )}

        {/* SOP list */}
        {sops.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No SOPs yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              Describe any process and AI will structure it for you
            </p>
            <button
              onClick={handleNewSop}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first SOP
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sops.map((sop) => (
              <div
                key={sop.id}
                onClick={() => router.push(`/dashboard/sop/${sop.id}`)}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {(sop as any).title ?? sop.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {sop.steps.length} steps ·{" "}
                        {new Date(sop.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteClick(e, sop)} // 👈 changed
                      disabled={deletingId === sop.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 👇 Custom Delete Dialog — replaces window.confirm() */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Delete SOP?</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  "{(deleteTarget as any).title ?? deleteTarget.id}"
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will permanently delete the SOP and all its steps. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showBrainDump && (
        <BrainDumpModal
          onClose={() => setShowBrainDump(false)}
          onCreated={handleSopCreated}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}