"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, User2, GitBranch, ArrowRight } from "lucide-react";
import StartExecutionCard from "./StartExecutionCard";
import ExecutionProgressBar from "./ExecutionProgressBar";
import type { Branch } from "@/types";

type ChecklistItem = { id: string; text: string };
type Step = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  durationMins: number | null;
  order: number;
  branches: Branch[] | null;
  checklistItems: ChecklistItem[];
};

type Run = {
  id: string;
  completedItems: number;
  totalItems: number;
  status: "in_progress" | "completed" | "overdue";
};

export default function ExecutableSopView({
  sopId,
  steps,
}: {
  sopId: string;
  steps: Step[];
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Branching state — which step orders are currently visible
  // Start with all steps visible (linear), then hide skipped branches
  const [visibleStepOrders, setVisibleStepOrders] = useState<Set<number>>(
    new Set(steps.map((s) => s.order))
  );
  const [chosenBranches, setChosenBranches] = useState<Record<string, string>>({});

  function handleBranchChoice(step: Step, branch: Branch) {
    // Mark which branch was chosen for this step
    setChosenBranches((prev) => ({ ...prev, [step.id]: branch.condition }));

    // Show only steps that lead from this branch — hide all other branch paths
    // Logic: find all steps that are NOT the chosen path's target
    const allBranchTargets = (step.branches ?? []).map((b) => b.nextStepOrder);
    const chosenTarget = branch.nextStepOrder;
    const hiddenTargets = allBranchTargets.filter((t) => t !== chosenTarget);

    setVisibleStepOrders((prev) => {
      const next = new Set(prev);
      hiddenTargets.forEach((order) => next.delete(order));
      return next;
    });
  }

  async function handleToggle(itemId: string) {
    if (!run || run.status === "completed") return;

    const willBeDone = !checkedIds.has(itemId);
    setPendingId(itemId);

    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (willBeDone) next.add(itemId);
      else next.delete(itemId);
      return next;
    });

    try {
      const res = await fetch(`/api/runs/${run.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItemId: itemId, done: willBeDone }),
      });
      const data = await res.json();
      if (res.ok) {
        setRun({
          id: data.id,
          completedItems: data.completedItems,
          totalItems: data.totalItems,
          status: data.status,
        });
      } else {
        setCheckedIds((prev) => {
          const next = new Set(prev);
          if (willBeDone) next.delete(itemId);
          else next.add(itemId);
          return next;
        });
      }
    } finally {
      setPendingId(null);
    }
  }

  const visibleSteps = steps.filter((s) => visibleStepOrders.has(s.order));

  return (
    <>
      {!run ? (
        <StartExecutionCard sopId={sopId} onStarted={setRun} />
      ) : (
        <ExecutionProgressBar
          completedItems={run.completedItems}
          totalItems={run.totalItems}
          status={run.status}
        />
      )}

      <div className="space-y-4">
        {visibleSteps.map((step, i) => {
          const isBranching = step.branches && step.branches.length > 0;
          const chosenBranch = chosenBranches[step.id];

          return (
            <div key={step.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-start gap-4">
                <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isBranching
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {step.title}
                    </h3>
                    {isBranching && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        <GitBranch className="w-3 h-3" />
                        Decision point
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {step.owner && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User2 className="w-3 h-3" /> {step.owner}
                      </span>
                    )}
                    {step.durationMins && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {step.durationMins} min
                      </span>
                    )}
                  </div>

                  {/* Checklist items */}
                  {step.checklistItems.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {step.checklistItems.map((item) => {
                        const isDone = checkedIds.has(item.id);
                        const isPending = pendingId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleToggle(item.id)}
                            disabled={!run || run.status === "completed" || isPending}
                            className={`flex items-center gap-2 w-full text-left group ${
                              run ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            ) : (
                              <Circle className={`w-3.5 h-3.5 flex-shrink-0 ${
                                run ? "text-gray-300 group-hover:text-indigo-400" : "text-gray-300"
                              } transition-colors`} />
                            )}
                            <span className={`text-sm transition-colors ${
                              isDone ? "line-through text-gray-300" : "text-gray-600 dark:text-gray-400"
                            }`}>
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Branch choices — shown only when run is active */}
                  {isBranching && run && !chosenBranch && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                        Which situation applies?
                      </p>
                      <div className="space-y-2">
                        {step.branches!.map((branch, bi) => (
                          <button
                            key={bi}
                            onClick={() => handleBranchChoice(step, branch)}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm text-gray-700 dark:text-gray-300"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="font-medium">{branch.label}</span>
                            <span className="text-xs text-gray-400 ml-auto">{branch.condition}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show chosen branch */}
                  {isBranching && chosenBranch && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Path chosen: {chosenBranch}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}