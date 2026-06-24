"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle2, Clock } from "lucide-react";

type Run = {
  id: string;
  executorEmail: string;
  executorName: string | null;
  status: "in_progress" | "completed" | "overdue";
  completedItems: number;
  totalItems: number;
  startedAt: string;
};

export default function RunsAnalytics({ sopId }: { sopId: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sop/${sopId}/runs`)
      .then((res) => res.json())
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [sopId]);

  if (loading) return null;
  if (runs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4 text-center">
        <Users className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No one has started this SOP yet</p>
      </div>
    );
  }

  const completedCount = runs.filter((r) => r.status === "completed").length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Execution history
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-auto">
          {completedCount}/{runs.length} completed
        </span>
      </div>

      <div className="space-y-2">
        {runs.map((run) => {
          const pct = run.totalItems > 0 ? Math.round((run.completedItems / run.totalItems) * 100) : 0;
          return (
            <div
              key={run.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                {run.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {run.executorName ?? run.executorEmail}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(run.startedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">
                {run.completedItems}/{run.totalItems} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}