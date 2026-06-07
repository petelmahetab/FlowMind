import { CheckCircle2, Circle } from "lucide-react";

type Props = {
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
};

export default function ProgressBar({ completedSteps, totalSteps, progressPercent }: Props) {
  const isComplete = completedSteps === totalSteps && totalSteps > 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-gray-300" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isComplete ? "All steps complete!" : "Your progress"}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {completedSteps} / {totalSteps} steps
          <span className="text-gray-400 ml-1">({progressPercent}%)</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            isComplete ? "bg-green-500" : "bg-indigo-600"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isComplete && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          🎉 SOP fully completed — great work!
        </p>
      )}
    </div>
  );
}