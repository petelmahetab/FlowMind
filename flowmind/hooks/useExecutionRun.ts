import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

type RunState = {
  runId: string | null;
  completedItemIds: Set<string>;
  completedItems: number;
  totalItems: number;
  status: "in_progress" | "completed" | "overdue" | null;
};

type QueuedToggle = {
  checklistItemId: string;
  done: boolean;
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

  // 👇 Queue — har click yahan push hota hai, koi bhi silently drop nahi hota
  const queueRef = useRef<QueuedToggle[]>([]);
  const processingRef = useRef(false);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    runIdRef.current = state.runId;
  }, [state.runId]);

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

  // 👇 Ek single toggle ko backend pe bhejta hai, 409 (race conflict) pe retry karta hai
  const sendToggle = useCallback(
    async (job: QueuedToggle, attempt = 1): Promise<void> => {
      const currentRunId = runIdRef.current;
      if (!currentRunId) return;

      try {
        const res = await fetch(`/api/runs/${currentRunId}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(job),
        });

        // 409 = backend transaction conflict (race) — retry karo, max 3 baar
        if (res.status === 409 && attempt <= 3) {
          await new Promise((r) => setTimeout(r, 150 * attempt));
          return sendToggle(job, attempt + 1);
        }

        if (!res.ok) throw new Error();
        const updated = await res.json();

        setState((prev) => ({
          ...prev,
          status: updated.status,
          completedItems: updated.completedItems,
          totalItems: updated.totalItems,
        }));

        if (job.done) toast.success("Step complete! ✓");
        if (updated.status === "completed") {
          toast.success("🎉 SOP fully completed!");
          localStorage.removeItem(`flowmind_run_${sopId}`);
        }
      } catch {
        // Rollback sirf is item ke liye — optimistic update undo karo
        setState((prev) => {
          const next = new Set(prev.completedItemIds);
          if (job.done) next.delete(job.checklistItemId);
          else next.add(job.checklistItemId);
          return {
            ...prev,
            completedItemIds: next,
            completedItems: job.done
              ? prev.completedItems - 1
              : prev.completedItems + 1,
          };
        });
        toast.error(`Failed to save "${job.checklistItemId}". Try again.`);
      }
    },
    [sopId]
  );

  // 👇 Queue processor — ek waqt mein sirf ek request, lekin koi bhi
  // queued job drop nahi hota, sab guaranteed sequentially process honge
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const job = queueRef.current.shift()!;
      setTogglingId(job.checklistItemId);
      await sendToggle(job);
    }

    processingRef.current = false;
    setTogglingId(null);
  }, [sendToggle]);

  const toggleItem = useCallback(
    (checklistItemId: string) => {
      if (!state.runId) return;

      const isCompleted = state.completedItemIds.has(checklistItemId);

      // Optimistic update — turant UI mein dikhao
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

      // Queue mein daal do — chahe kitni bhi jaldi clicks aayein,
      // koi bhi drop nahi hoga, sab sequentially process honge
      queueRef.current.push({ checklistItemId, done: !isCompleted });
      processQueue();
    },
    [state.runId, state.completedItemIds, processQueue]
  );

  const progressPercent =
    state.totalItems > 0
      ? Math.round((state.completedItems / state.totalItems) * 100)
      : 0;

  return { ...state, startRun, toggleItem, togglingId, progressPercent };
}