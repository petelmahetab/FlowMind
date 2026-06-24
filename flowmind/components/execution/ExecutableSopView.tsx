"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, User2 } from "lucide-react";
import StartExecutionCard from "./StartExecutionCard";
import ExecutionProgressBar from "./ExecutionProgressBar";

type ChecklistItem = { id: string; text: string };
type Step = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  durationMins: number | null;
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
      const res = await fetch(`/api/execution/${run.id}/tick`, {
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
        {steps.map((step, i) => (
          <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
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
                            <Circle
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                run
                                  ? "text-gray-300 group-hover:text-indigo-400"
                                  : "text-gray-300"
                              } transition-colors`}
                            />
                          )}
                          <span
                            className={`text-sm transition-colors ${
                              isDone ? "line-through text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {item.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}