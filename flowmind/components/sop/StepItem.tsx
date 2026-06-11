"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  User2,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { Step, ChecklistItem } from "@prisma/client";

type StepWithChecklist = Step & { checklistItems: ChecklistItem[] };

type Props = {
  step: StepWithChecklist;
  index: number;
  onChecklistToggle: (stepId: string, itemId: string, done: boolean) => void;
};

export default function StepItem({ step, index, onChecklistToggle }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(step.checklistItems.map((i) => [i.id, i.done]))
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleCheck(itemId: string) {
    const newVal = !checkedItems[itemId];
    setCheckedItems((prev) => ({ ...prev, [itemId]: newVal }));
    onChecklistToggle(step.id, itemId, newVal);
  }

  const doneCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = step.checklistItems.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* Step header */}
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Step number */}
        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{step.title}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {step.owner && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                <User2 className="w-3 h-3" />
                {step.owner}
              </span>
            )}
            {step.durationMins && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                {step.durationMins} min
              </span>
            )}
            {totalCount > 0 && (
              <span className="text-xs text-gray-400">
                {doneCount}/{totalCount} done
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {step.description && (
            <p className="text-sm text-gray-500 mb-3">{step.description}</p>
          )}

          {/* Checklist */}
          {step.checklistItems.length > 0 && (
            <div className="space-y-2">
              {step.checklistItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCheck(item.id)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  {checkedItems[item.id] ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                  )}
                  <span
                    className={`text-sm transition-colors ${
                      checkedItems[item.id]
                        ? "line-through text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
