import { useState, useCallback } from "react";
import { toast } from "sonner";

type CompletionState = {
  completedStepIds: Set<string>;
  completedSteps: number;
  totalSteps: number;
};

export function useStepCompletion(
  sopId: string,
  initialCompletedIds: string[],
  totalSteps: number
) {
  const [state, setState] = useState<CompletionState>({
    completedStepIds: new Set(initialCompletedIds),
    completedSteps: initialCompletedIds.length,
    totalSteps,
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleStep = useCallback(
    async (stepId: string) => {
      if (togglingId) return; // prevent double click

      const isCompleted = state.completedStepIds.has(stepId);
      setTogglingId(stepId);

      // Optimistic update — UI turant respond kare
      setState((prev) => {
        const next = new Set(prev.completedStepIds);
        if (isCompleted) {
          next.delete(stepId);
        } else {
          next.add(stepId);
        }
        return {
          completedStepIds: next,
          completedSteps: isCompleted ? prev.completedSteps - 1 : prev.completedSteps + 1,
          totalSteps: prev.totalSteps,
        };
      });

      try {
        const res = await fetch(`/api/sop/${sopId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepId, completed: !isCompleted }),
        });
        if (!res.ok) throw new Error();

        if (!isCompleted) {
          toast.success("Step complete! ✓");
        }
      } catch {
        // Rollback on error
        setState((prev) => {
          const next = new Set(prev.completedStepIds);
          if (isCompleted) {
            next.add(stepId);
          } else {
            next.delete(stepId);
          }
          return {
            completedStepIds: next,
            completedSteps: isCompleted ? prev.completedSteps + 1 : prev.completedSteps - 1,
            totalSteps: prev.totalSteps,
          };
        });
        toast.error("Failed to update. Try again.");
      } finally {
        setTogglingId(null);
      }
    },
    [sopId, state.completedStepIds, togglingId]
  );

  const progressPercent = state.totalSteps > 0
    ? Math.round((state.completedSteps / state.totalSteps) * 100)
    : 0;

  return { ...state, toggleStep, togglingId, progressPercent };
}