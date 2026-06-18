"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  Globe,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  Circle,
  History,
  UserPlus,
} from "lucide-react";
import StepItem from "./StepItem";
import { useStepCompletion } from "@/hooks/useStepCompletion";
import VersionHistoryModal from "./VersionHistoryModal";
import AssignModal from "./AssignModal";
import ExportButton from "./ExportButton";
import type { SopWithSteps } from "@/types";

type Props = {
  initialSop: SopWithSteps;
  initialCompletedIds: string[];
};

export default function SopEditorClient({ initialSop, initialCompletedIds }: Props) {
  const router = useRouter();
  const [sop, setSop] = useState(initialSop);
  const [steps, setSteps] = useState(initialSop.steps);
  const [copied, setCopied] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const {
    completedStepIds,
    completedSteps,
    totalSteps,
    progressPercent,
    toggleStep,
    togglingId,
  } = useStepCompletion(sop.id, initialCompletedIds, initialSop.steps.length);

  const isAllComplete = completedSteps === totalSteps && totalSteps > 0;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function togglePublic() {
    setTogglingPublic(true);
    const newValue = !sop.isPublic;
    setSop((prev) => ({ ...prev, isPublic: newValue }));
    await fetch(`/api/sop/${sop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: newValue }),
    });
    setTogglingPublic(false);
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/sop/${sop.shareSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleChecklistToggle = useCallback(
    async (stepId: string, itemId: string, done: boolean) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? {
                ...step,
                checklistItems: step.checklistItems.map((item) =>
                  item.id === itemId ? { ...item, done } : item
                ),
              }
            : step
        )
      );
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>

          <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm flex-1 text-center">
            {sop.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Public/Private toggle */}
            <button
              onClick={togglePublic}
              disabled={togglingPublic}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                sop.isPublic
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              {sop.isPublic ? (
                <><Globe className="w-3 h-3" /> Public</>
              ) : (
                <><Lock className="w-3 h-3" /> Private</>
              )}
            </button>

            {/* Copy link */}
            {sop.isPublic && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                {copied ? (
                  <><Check className="w-3 h-3" /> Copied!</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy link</>
                )}
              </button>
            )}

            {/* 👇 Export PDF — naya component, jsPDF wala */}
            <ExportButton sop={{ ...sop, steps }} />

            {/* Version History */}
            <button
              onClick={() => setShowVersions(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <History className="w-3 h-3" />
              History
            </button>

            {/* Assign */}
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Assign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        {/* SOP header card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <span className="text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-medium">
            SOP
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {sop.title}
          </h2>
          {sop.description && (
            <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {steps.length} steps · Created {new Date(sop.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isAllComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isAllComplete ? "All steps complete!" : "Your progress"}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {completedSteps} / {totalSteps}
              <span className="text-gray-400 ml-1">({progressPercent}%)</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isAllComplete ? "bg-green-500" : "bg-indigo-600"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {isAllComplete && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              🎉 SOP fully completed — great work!
            </p>
          )}
        </div>

        {/* Public share banner */}
        {sop.isPublic && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 flex-1">
              This SOP is public. Anyone with the link can view it.
            </p>
            <button
              onClick={copyShareLink}
              className="text-xs text-green-700 font-medium underline"
            >
              Copy link
            </button>
          </div>
        )}
      </div>

      {/* Steps — drag and drop */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = completedStepIds.has(step.id);
                const isToggling = togglingId === step.id;

                return (
                  <div
                    key={step.id}
                    className={`transition-all duration-200 rounded-xl border ${
                      isCompleted
                        ? "border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20"
                        : "border-transparent"
                    }`}
                  >
                    {/* Completion toggle */}
                    <div className="flex items-start gap-3 px-3 pt-3">
                      <button
                        onClick={() => toggleStep(step.id)}
                        disabled={isToggling}
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
                        } ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {isCompleted && (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      <p
                        className={`text-sm font-medium pt-0.5 ${
                          isCompleted
                            ? "line-through text-gray-400 dark:text-gray-600"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Step {index + 1} — {step.title}
                      </p>
                    </div>

                    {/* StepItem */}
                    <StepItem
                      step={step}
                      index={index}
                      onChecklistToggle={handleChecklistToggle}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Modals */}
      {showVersions && (
        <VersionHistoryModal sopId={sop.id} onClose={() => setShowVersions(false)} />
      )}
      {showAssign && (
        <AssignModal sopId={sop.id} onClose={() => setShowAssign(false)} />
      )}
    </div>
  );
}