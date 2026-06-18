"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

type Assignment = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate: string | null;
  sop: {
    id: string;
    title: string;
    steps: { id: string }[];
  };
  assignedBy: {
    name: string | null;
    email: string;
  };
};

export default function MyAssignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assignments/my")
      .then((res) => res.json())
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading || assignments.length === 0) return null;

  function getDueDateInfo(dueDate: string | null) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d`, color: "text-red-600 bg-red-50 border-red-200" };
    }
    if (diffDays === 0) {
      return { label: "Due today", color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    if (diffDays <= 3) {
      return { label: `Due in ${diffDays}d`, color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    return { label: `Due ${due.toLocaleDateString()}`, color: "text-gray-500 bg-gray-50 border-gray-200" };
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assigned to you</h2>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {assignments.length}
        </span>
      </div>

      <div className="space-y-2">
        {assignments.map((a) => {
          const dueInfo = getDueDateInfo(a.dueDate);
          const isCompleted = a.status === "completed";

          return (
            <div
              key={a.id}
              onClick={() => router.push(`/dashboard/sop/${a.sop.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-indigo-900 p-4 cursor-pointer hover:border-indigo-300 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                    {a.sop.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Assigned by {a.assignedBy.name ?? a.assignedBy.email} · {a.sop.steps.length} steps
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {dueInfo && (
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${dueInfo.color}`}>
                    <Clock className="w-3 h-3" />
                    {dueInfo.label}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}