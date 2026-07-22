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
  Users,
  FileBarChart,
  Brain,
  Crown,
  CalendarClock,
} from "lucide-react";
import StepItem from "./StepItem";
import { useExecutionRun } from "@/hooks/useExecutionRun";
import StartRunModal from "./StartRunModal";
import RunsAnalytics from "./RunsAnalytics";
import ExportButton from "./ExportButton";
import type { SopWithSteps } from "@/types";
import AuditReportModal from "./AuditReportModal";
import SopHealthAnalyzer from "./SopHealthAnalyzer";
import WebhookManager from "./WebhookManager";
import UpgradeModal from "./UpgradeModal";
import { usePlan } from "@/hooks/usePlan";
import ScheduleManager from "./ScheduleManager";
import NavPillButton from "./NavPillButton";

type Props = {
  initialSop: SopWithSteps;
};

export default function SopEditorClient({ initialSop }: Props) {
  const router = useRouter();
  const [sop, setSop] = useState(initialSop);
  const [steps, setSteps] = useState(initialSop.steps);
  const [copied, setCopied] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [showHealthAnalyzer, setShowHealthAnalyzer] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // 👇 Plan check
  const { plan, isLoading: planLoading } = usePlan();
  const isPro = plan === "pro";

  const totalChecklistItems = steps.reduce(
    (sum, step) => sum + step.checklistItems.length,
    0,
  );

  const {
    runId,
    completedItemIds,
    completedItems,
    totalItems,
    status,
    startRun,
    toggleItem,
    togglingId,
    progressPercent,
  } = useExecutionRun(sop.id, totalChecklistItems);

  const isAllComplete = status === "completed";
  const hasStartedRun = runId !== null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

  // 👇 Pro feature click handler
  function handleProFeature(action: () => void) {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }
    action();
  }

  const handleChecklistToggle = useCallback(
    (stepId: string, itemId: string) => {
      if (!hasStartedRun) return;
      toggleItem(itemId);
    },
    [hasStartedRun, toggleItem],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Title */}
          <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm flex-1 min-w-0 text-center px-2 hidden md:block">
            {sop.title}
          </h1>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto max-w-[60vw] sm:max-w-none scrollbar-hide">
            <NavPillButton
              icon={sop.isPublic ? Globe : Lock}
              label={sop.isPublic ? "Public" : "Private"}
              onClick={togglePublic}
              variant="neutral"
            />

            {sop.isPublic && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 whitespace-nowrap flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            )}

            <div className="flex-shrink-0">
              <ExportButton sop={{ ...sop, steps }} />
            </div>

            <NavPillButton
              icon={Users}
              label="Activity"
              onClick={() => setShowAnalytics((p) => !p)}
              variant="neutral"
            />

            <NavPillButton
              icon={FileBarChart}
              label="Audit"
              onClick={() => handleProFeature(() => setShowAuditReport(true))}
              variant={isPro ? "proActive" : "proLocked"}
            />

            <NavPillButton
              icon={CalendarClock}
              label="Schedule"
              onClick={() => handleProFeature(() => setShowScheduler(true))}
              variant={isPro ? "proActive" : "proLocked"}
            />

            <NavPillButton
              icon={Brain}
              label="AI Analyze"
              onClick={() =>
                handleProFeature(() => setShowHealthAnalyzer(true))
              }
              variant={isPro ? "signature" : "proLocked"}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        {/* SOP header card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-medium">
              SOP
            </span>
            {isPro && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Pro
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {sop.title}
          </h2>
          {sop.description && (
            <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {steps.length} steps · Created{" "}
            {new Date(sop.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>

        {/* Execution analytics panel */}
        {showAnalytics && <RunsAnalytics sopId={sop.id} />}

        {/* Start run prompt */}
        {!hasStartedRun && totalChecklistItems > 0 && (
          <StartRunModal onStart={startRun} />
        )}

        {/* Progress bar */}
        {hasStartedRun && (
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
                {completedItems} / {totalItems}
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
                SOP fully completed — great work!
              </p>
            )}
          </div>
        )}

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
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="transition-all duration-200 rounded-xl border border-transparent"
                >
                  <StepItem
                    step={step}
                    index={index}
                    onChecklistToggle={handleChecklistToggle}
                    completedItemIds={completedItemIds}
                    togglingId={togglingId}
                    disabled={!hasStartedRun}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Modals */}
      {showAuditReport && (
        <AuditReportModal
          sopId={sop.id}
          onClose={() => setShowAuditReport(false)}
        />
      )}
      {showHealthAnalyzer && (
        <SopHealthAnalyzer
          sopId={sop.id}
          onClose={() => setShowHealthAnalyzer(false)}
        />
      )}
      {showWebhooks && (
        <WebhookManager onClose={() => setShowWebhooks(false)} />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {showScheduler && (
        <ScheduleManager
          sopId={sop.id}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}
