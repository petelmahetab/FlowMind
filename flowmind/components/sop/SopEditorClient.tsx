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
  Download,
} from "lucide-react";
import StepItem from "./StepItem";
import { useStepCompletion } from "@/hooks/useStepCompletion";
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
  const [exporting, setExporting] = useState(false);

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

  // ─── PDF Export ───
  function handleExport() {
    setExporting(true);

    const style = document.createElement("style");
    style.id = "flowmind-print-style";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #flowmind-pdf, #flowmind-pdf * { visibility: visible !important; }
        #flowmind-pdf {
          position: fixed !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important;
          background: white !important;
          z-index: 99999 !important;
          padding: 40px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        @page { margin: 20mm; size: A4; }
      }
    `;
    document.head.appendChild(style);

    const stepsHtml = steps
      .map(
        (step, i) => `
        <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="width:24px;height:24px;border-radius:50%;background:#EEF2FF;color:#4F46E5;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
            <strong style="font-size:14px;color:#111827;">${step.title}</strong>
          </div>
          ${step.owner || step.durationMins ? `
            <div style="display:flex;gap:12px;margin-bottom:8px;">
              ${step.owner ? `<span style="font-size:11px;color:#6b7280;background:#f9fafb;padding:2px 8px;border-radius:4px;">👤 ${step.owner}</span>` : ""}
              ${step.durationMins ? `<span style="font-size:11px;color:#6b7280;background:#f9fafb;padding:2px 8px;border-radius:4px;">⏱ ${step.durationMins} min</span>` : ""}
            </div>` : ""}
          ${step.description ? `<p style="font-size:13px;color:#4b5563;margin:0 0 10px;line-height:1.5;">${step.description}</p>` : ""}
          ${step.checklistItems?.length > 0 ? `
            <div style="margin-top:8px;">
              ${step.checklistItems.map((item) => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="width:14px;height:14px;border-radius:50%;border:1.5px solid #d1d5db;display:inline-block;flex-shrink:0;"></span>
                  <span style="font-size:12px;color:#374151;">${item.text}</span>
                </div>`).join("")}
            </div>` : ""}
        </div>`
      )
      .join("");

    const container = document.createElement("div");
    container.id = "flowmind-pdf";
    container.innerHTML = `
      <div>
        <div style="margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #4F46E5;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:12px;font-weight:700;color:#4F46E5;letter-spacing:0.05em;">FLOWMIND</span>
            <span style="font-size:11px;color:#9ca3af;">Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <h1 style="font-size:24px;font-weight:700;color:#111827;margin:12px 0 4px;">${sop.title}</h1>
          ${sop.description ? `<p style="font-size:13px;color:#6b7280;margin:0;">${sop.description}</p>` : ""}
          <div style="margin-top:10px;display:flex;gap:16px;">
            <span style="font-size:12px;color:#6b7280;">${steps.length} steps</span>
            <span style="font-size:12px;color:#6b7280;">Created ${new Date(sop.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div>
          <h2 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Process Steps</h2>
          ${stepsHtml}
        </div>
        <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:#9ca3af;">Exported from FlowMind</span>
          <span style="font-size:11px;color:#9ca3af;">${new Date().toLocaleDateString()}</span>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
      document.body.removeChild(container);
      setExporting(false);
    }, 300);
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

          <div className="flex items-center gap-2">
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

            {/* Export PDF */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              {exporting ? "Preparing..." : "Export PDF"}
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
    </div>
  );
}