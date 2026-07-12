"use client";

import { useState } from "react";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";

type HealthData = {
  totalRuns: number;
  analysis: {
    overallHealth: "good" | "needs_attention" | "critical";
    healthScore: number;
    bottlenecks: {
      stepTitle: string;
      item: string;
      completionRate: number;
      issue: string;
      suggestion: string;
    }[];
    strengths: string[];
    topRecommendation: string;
  };
};

type Props = {
  sopId: string;
  onClose: () => void;
};

export default function SopHealthAnalyzer({ sopId, onClose }: Props) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sop/${sopId}/analyze`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Analysis failed");
        return;
      }
      setData(json);
    } catch {
      setError("Failed to connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const healthColor = {
    good: "text-green-600 bg-green-50 border-green-200",
    needs_attention: "text-amber-600 bg-amber-50 border-amber-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };

  const healthLabel = {
    good: "Healthy",
    needs_attention: "Needs Attention",
    critical: "Critical Issues",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              AI SOP Health Analyzer
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {!data && !loading && (
            <div className="text-center py-10">
              <Brain className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Analyze your SOP performance
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                AI will scan all execution data and identify bottlenecks, skipped steps, and suggest improvements.
              </p>
              {error && (
                <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <button
                onClick={runAnalysis}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Run Analysis
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-500">Analyzing execution data...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>
          )}

          {data && (
            <div className="space-y-5">
              {/* Health Score */}
              <div className={`rounded-xl border p-4 ${healthColor[data.analysis.overallHealth]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">Overall Health</p>
                    <p className="text-2xl font-bold mt-1">{healthLabel[data.analysis.overallHealth]}</p>
                    <p className="text-xs opacity-70 mt-1">Based on {data.totalRuns} execution{data.totalRuns !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{data.analysis.healthScore}</p>
                    <p className="text-xs opacity-70">/100</p>
                  </div>
                </div>
              </div>

              {/* Top Recommendation */}
              {data.analysis.topRecommendation && (
                <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Top Recommendation</p>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">{data.analysis.topRecommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottlenecks */}
              {data.analysis.bottlenecks?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Problem Areas ({data.analysis.bottlenecks.length})
                    </p>
                  </div>
                  <div className="space-y-3">
                    {data.analysis.bottlenecks.map((b, i) => (
                      <div key={i} className="border border-red-100 dark:border-red-900 rounded-xl p-4 bg-red-50/50 dark:bg-red-950/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{b.stepTitle}</p>
                          <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded-full">
                            {b.completionRate}% completion
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Item: {b.item}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">⚠ {b.issue}</p>
                        <p className="text-xs text-green-700 dark:text-green-400">💡 {b.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {data.analysis.strengths?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What&apos;s Working Well</p>
                  </div>
                  <div className="space-y-2">
                    {data.analysis.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-analyze button */}
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}