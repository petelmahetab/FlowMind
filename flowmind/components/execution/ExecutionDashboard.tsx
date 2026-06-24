"use client";

import { useEffect, useState } from "react";
import { Users, AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";

type Run = {
  id: string;
  executorEmail: string;
  executorName: string | null;
  status: "in_progress" | "completed" | "overdue";
  completedItems: number;
  totalItems: number;
  startedAt: string;
  completedAt: string | null;
};

type Summary = {
  totalRuns: number;
  completed: number;
  inProgress: number;
  overdue: number;
};

export default function ExecutionDashboard({ sopId }: { sopId: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sop/${sopId}/executions`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setRuns(data.runs);
          setSummary(data.summary);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sopId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (!summary || summary.totalRuns === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <Users className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No one has started this SOP yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Share the public link — once someone opens it and enters their email,
          their progress shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{summary.inProgress}</p>
          <p className="text-xs text-gray-400">In progress</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-green-600">{summary.completed}</p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${summary.overdue > 0 ? "text-red-600" : "text-gray-900"}`}>
            {summary.overdue}
          </p>
          <p className="text-xs text-gray-400">Overdue</p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {runs.map((run) => {
          const pct =
            run.totalItems > 0
              ? Math.round((run.completedItems / run.totalItems) * 100)
              : 0;
          return (
            <div key={run.id} className="p-3 flex items-center gap-3">
              <div className="flex-shrink-0">
                {run.status === "completed" && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {run.status === "overdue" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {run.status === "in_progress" && (
                  <Clock3 className="w-4 h-4 text-indigo-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {run.executorName || run.executorEmail}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                    <div
                      className={`h-1.5 rounded-full ${
                        run.status === "overdue" ? "bg-red-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {run.completedItems}/{run.totalItems}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}