"use client";

import { useState, useEffect } from "react";
import {
  X, Brain, TrendingDown, Users, AlertTriangle,
  CheckCircle2, Clock, Loader2, RefreshCw, Zap,
  BarChart3, Target
} from "lucide-react";

type SopMetric = {
  id: string;
  title: string;
  totalRuns: number;
  completedRuns: number;
  failureRate: number;
  avgCompletionMins: number | null;
  topSkippedItems: { text: string; stepTitle: string; skipRate: number }[];
};

type ExecutorInsight = {
  email: string;
  totalRuns: number;
  completionRate: number;
  skipRate: number;
  topSkippedProcesses: string[];
};

type AIInsights = {
  executiveSummary: string;
  criticalAlerts: string[];
  topRisk: string;
  quickWins: string[];
  processHealthScore: number;
};

type IntelligenceData = {
  overview: {
    totalSops: number;
    totalRuns: number;
    overallCompletionRate: number;
    totalExecutors: number;
  };
  sopMetrics: SopMetric[];
  executorInsights: ExecutorInsight[];
  aiInsights: AIInsights | null;
};

type Props = { onClose: () => void };

export default function ProcessIntelligenceDashboard({ onClose }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sops" | "people" | "ai">("overview");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/intelligence");
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to load"); return; }
      setData(json);
    } catch {
      setError("Failed to connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const healthColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const healthBg = (score: number) => {
    if (score >= 75) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const failureColor = (rate: number) => {
    if (rate >= 70) return "bg-red-500";
    if (rate >= 40) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                AI Process Intelligence
              </h2>
              <p className="text-xs text-gray-400">Cross-SOP analytics + AI insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 flex-shrink-0">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "sops", label: "By Process", icon: TrendingDown },
            { id: "people", label: "By People", icon: Users },
            { id: "ai", label: "AI Insights", icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 text-sm px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-500">Analyzing all your processes...</p>
              <p className="text-xs text-gray-400 mt-1">AI is processing execution data</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={fetchData} className="mt-3 text-sm text-indigo-600 underline">Retry</button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* AI Health Score Banner */}
                  {data.aiInsights && (
                    <div className={`rounded-xl border p-4 ${healthBg(data.aiInsights.processHealthScore)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          <p className="text-sm font-medium">Overall Process Health</p>
                        </div>
                        <p className={`text-3xl font-bold ${healthColor(data.aiInsights.processHealthScore)}`}>
                          {data.aiInsights.processHealthScore}
                          <span className="text-sm font-normal opacity-60">/100</span>
                        </p>
                      </div>
                      <p className="text-sm opacity-80">{data.aiInsights.executiveSummary}</p>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "SOPs Tracked", value: data.overview.totalSops, icon: Target, color: "text-indigo-600" },
                      { label: "Total Runs", value: data.overview.totalRuns, icon: BarChart3, color: "text-blue-600" },
                      { label: "Completion Rate", value: `${data.overview.overallCompletionRate}%`, icon: CheckCircle2, color: "text-green-600" },
                      { label: "Executors", value: data.overview.totalExecutors, icon: Users, color: "text-purple-600" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top failing processes */}
                  {data.sopMetrics.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Processes by Failure Rate
                      </p>
                      <div className="space-y-2">
                        {data.sopMetrics.slice(0, 5).map((sop) => (
                          <div key={sop.id} className="flex items-center gap-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 w-40 truncate flex-shrink-0">
                              {sop.title}
                            </p>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${failureColor(sop.failureRate)}`}
                                style={{ width: `${sop.failureRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-500 w-10 text-right flex-shrink-0">
                              {sop.failureRate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.overview.totalRuns === 0 && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No execution data yet</p>
                      <p className="text-xs text-gray-400 mt-1">Run your SOPs to see process intelligence</p>
                    </div>
                  )}
                </div>
              )}

              {/* BY PROCESS TAB */}
              {activeTab === "sops" && (
                <div className="space-y-4">
                  {data.sopMetrics.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-sm text-gray-400">No SOP execution data yet</p>
                    </div>
                  ) : (
                    data.sopMetrics.map((sop) => (
                      <div key={sop.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sop.title}</h3>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {sop.avgCompletionMins && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {sop.avgCompletionMins}m avg
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              sop.failureRate >= 70 ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" :
                              sop.failureRate >= 40 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" :
                              "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                            }`}>
                              {sop.failureRate}% fail
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                          <span>{sop.totalRuns} runs</span>
                          <span>{sop.completedRuns} completed</span>
                          <span>{sop.totalRuns - sop.completedRuns} incomplete</span>
                        </div>

                        {sop.topSkippedItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Most skipped steps:</p>
                            <div className="space-y-1.5">
                              {sop.topSkippedItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-1.5">
                                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">
                                    {item.stepTitle} — {item.text}
                                  </span>
                                  <span className="text-xs font-bold text-red-500 flex-shrink-0">{item.skipRate}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* BY PEOPLE TAB */}
              {activeTab === "people" && (
                <div className="space-y-3">
                  {data.executorInsights.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No executor data yet</p>
                    </div>
                  ) : (
                    data.executorInsights.map((executor) => (
                      <div key={executor.email} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {executor.email}
                            </p>
                            <p className="text-xs text-gray-400">{executor.totalRuns} runs</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Completion</p>
                              <p className={`text-sm font-bold ${executor.completionRate >= 70 ? "text-green-600" : executor.completionRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                {executor.completionRate}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Skip rate</p>
                              <p className={`text-sm font-bold ${executor.skipRate <= 20 ? "text-green-600" : executor.skipRate <= 50 ? "text-amber-600" : "text-red-600"}`}>
                                {executor.skipRate}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {executor.topSkippedProcesses.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {executor.topSkippedProcesses.map((p, i) => (
                              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AI INSIGHTS TAB */}
              {activeTab === "ai" && (
                <div className="space-y-4">
                  {!data.aiInsights ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Not enough data for AI insights yet</p>
                      <p className="text-xs text-gray-400 mt-1">Run your SOPs to generate insights</p>
                    </div>
                  ) : (
                    <>
                      {/* Top Risk */}
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wide">Top Risk</p>
                            <p className="text-sm text-red-800 dark:text-red-200">{data.aiInsights.topRisk}</p>
                          </div>
                        </div>
                      </div>

                      {/* Critical Alerts */}
                      {data.aiInsights.criticalAlerts.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Critical Alerts
                          </p>
                          <div className="space-y-2">
                            {data.aiInsights.criticalAlerts.map((alert, i) => (
                              <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                                <span className="text-amber-500 font-bold text-xs flex-shrink-0">!</span>
                                <p className="text-sm text-amber-800 dark:text-amber-200">{alert}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Wins */}
                      {data.aiInsights.quickWins.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-green-500" />
                            Quick Wins This Week
                          </p>
                          <div className="space-y-2">
                            {data.aiInsights.quickWins.map((win, i) => (
                              <div key={i} className="flex items-start gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-800 dark:text-green-200">{win}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}