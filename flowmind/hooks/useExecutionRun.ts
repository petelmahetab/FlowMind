import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

type RunState = {
  runId: string | null;
  completedItemIds: Set<string>;
  completedItems: number;
  totalItems: number;
  status: "in_progress" | "completed" | "overdue" | null;
};

export function useExecutionRun(sopId: string, totalItems: number) {
  const [state, setState] = useState<RunState>({
    runId: null,
    completedItemIds: new Set(),
    completedItems: 0,
    totalItems,
    status: null,
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Restore saved run from localStorage on mount
  useEffect(() => {
    const savedRunId = localStorage.getItem(`flowmind_run_${sopId}`);
    if (savedRunId) {
      setState((prev) => {
        if (prev.runId === savedRunId) return prev;
        return { ...prev, runId: savedRunId };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRun = useCallback(
    async (executorEmail: string, executorName?: string) => {
      const res = await fetch(`/api/sop/${sopId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executorEmail, executorName }),
      });
      const run = await res.json();
      if (!res.ok) throw new Error(run.error ?? "Failed to start run");

      setState((prev) => ({
        ...prev,
        runId: run.id,
        status: run.status,
        totalItems: run.totalItems,
        completedItems: run.completedItems ?? 0,
      }));
      localStorage.setItem(`flowmind_run_${sopId}`, run.id);
      return run;
    },
    [sopId]
  );

  const toggleItem = useCallback(
    async (checklistItemId: string) => {
      if (!state.runId || togglingId) return;

      const isCompleted = state.completedItemIds.has(checklistItemId);
      setTogglingId(checklistItemId);

      // Optimistic update
      setState((prev) => {
        const next = new Set(prev.completedItemIds);
        if (isCompleted) next.delete(checklistItemId);
        else next.add(checklistItemId);
        return {
          ...prev,
          completedItemIds: next,
          completedItems: isCompleted
            ? prev.completedItems - 1
            : prev.completedItems + 1,
        };
      });

      try {
        const res = await fetch(`/api/runs/${state.runId}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklistItemId, done: !isCompleted }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();

        setState((prev) => ({
          ...prev,
          status: updated.status,
          completedItems: updated.completedItems,
          totalItems: updated.totalItems,
        }));

        if (!isCompleted) toast.success("Step complete! ✓");
        if (updated.status === "completed") {
          toast.success("🎉 SOP fully completed!");
          localStorage.removeItem(`flowmind_run_${sopId}`);
        }
      } catch {
        // Rollback on error
        setState((prev) => {
          const next = new Set(prev.completedItemIds);
          if (isCompleted) next.add(checklistItemId);
          else next.delete(checklistItemId);
          return {
            ...prev,
            completedItemIds: next,
            completedItems: isCompleted
              ? prev.completedItems + 1
              : prev.completedItems - 1,
          };
        });
        toast.error("Failed to update. Try again.");
      } finally {
        setTogglingId(null);
      }
    },
    [state.runId, state.completedItemIds, togglingId, sopId]
  );

  const progressPercent =
    state.totalItems > 0
      ? Math.round((state.completedItems / state.totalItems) * 100)
      : 0;

  return { ...state, startRun, toggleItem, togglingId, progressPercent };
}