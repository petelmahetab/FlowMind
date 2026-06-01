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
import { ArrowLeft, Share2, Globe, Lock, Copy, Check } from "lucide-react";
import StepItem from "./StepItem";
import type { SopWithSteps } from "@/types";

export default function SopEditorClient({ initialSop }: { initialSop: SopWithSteps }) {
  const router = useRouter();
  const [sop, setSop] = useState(initialSop);
  const [steps, setSteps] = useState(initialSop.steps);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ─── Drag end: reorder steps locally (optimistic) ───
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    // Note: in a full production app you'd persist order to DB here via PATCH
  }

  // ─── Toggle public share link ───
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

  // ─── Copy share link ───
  async function copyShareLink() {
    const url = `${window.location.origin}/sop/${sop.shareSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Update checklist item done state ───
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
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>

          <h1 className="font-semibold text-gray-900 truncate text-sm flex-1 text-center">
            {sop.title}
          </h1>

          {/* Share button */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePublic}
              disabled={togglingPublic}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                sop.isPublic
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {sop.isPublic ? (
                <><Globe className="w-3 h-3" /> Public</>
              ) : (
                <><Lock className="w-3 h-3" /> Private</>
              )}
            </button>

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
          </div>
        </div>
      </div>

      {/* SOP header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
            SOP
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-2">{sop.title}</h2>
          {sop.description && (
            <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {steps.length} steps · Created {new Date(sop.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Share info banner */}
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
                <StepItem
                  key={step.id}
                  step={step}
                  index={index}
                  onChecklistToggle={handleChecklistToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
