"use client";

import { CheckCircle2, PartyPopper, AlertCircle } from "lucide-react";

type Props = {
  completedItems: number;
  totalItems: number;
  status: "in_progress" | "completed" | "overdue" | null;
};

export default function ExecutionProgressBar({
  completedItems,
  totalItems,
  status,
}: Props) {
  const pct =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (status === "completed") {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-center gap-3">
        <PartyPopper className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            SOP completed!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            All {totalItems} checklist items done — great work.
          </p>
        </div>
      </div>
    );
  }

  if (status === "overdue") {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Overdue — {completedItems} of {totalItems} items done
          </span>
          <span className="ml-auto text-xs text-red-400">{pct}%</span>
        </div>
        <div className="w-full bg-red-100 dark:bg-red-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-red-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // in_progress
  return (
    <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {completedItems} of {totalItems} steps done
          </span>
        </div>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="w-full bg-white dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct === 100 && (
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
          All items checked — mark the run as complete above.
        </p>
      )}
    </div>
  );
}