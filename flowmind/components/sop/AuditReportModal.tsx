"use client";

import { useEffect, useState, useCallback } from "react";
import { X, FileBarChart, Download, Users, Clock, AlertTriangle, AlertOctagon } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type AuditData = {
  sop: { title: string; description: string | null; createdAt: string };
  summary: {
    totalRuns: number;
    completedRuns: number;
    inProgressRuns: number;
    overdueRuns: number;
    avgCompletionMins: number | null;
  };
  stepBreakdown: { text: string; stepTitle: string; tickedCount: number; completionRate: number }[];
  runs: {
    id: string;
    executorEmail: string;
    executorName: string | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
    completedItems: number;
    totalItems: number;
  }[];
};

type Props = {
  sopId: string;
  onClose: () => void;
};

const SKIP_THRESHOLD = 70;

export default function AuditReportModal({ sopId, onClose }: Props) {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // 👇 Ek hi jagah fetch logic — pehle yeh "Try again" button mein duplicate tha
  const loadReport = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/sop/${sopId}/audit-report`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error ${res.status}: ${text || "No response body"}`);
        }
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[AuditReportModal] fetch failed:", err);
        setError(err.message ?? "Failed to load report. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [sopId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Backend ab already completionRate ke hisaab se sort karke bhejta hai
  // (sabse zyada skipped step sabse upar) — yahan sirf filter karna hai
  const skippedSteps = data?.stepBreakdown.filter((s) => s.completionRate < SKIP_THRESHOLD) ?? [];

  async function handleExportPdf() {
    if (!data) return;
    setExporting(true);

    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px";
      container.style.background = "white";
      container.style.padding = "40px";
      container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

      container.innerHTML = `
        <div>
          <div style="margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #4F46E5;">
            <span style="font-size:12px;font-weight:700;color:#4F46E5;letter-spacing:0.05em;">FLOWMIND — COMPLIANCE AUDIT REPORT</span>
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin:10px 0 4px;">${data.sop.title}</h1>
            <p style="font-size:12px;color:#9ca3af;margin:0;">Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>

          <h2 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Summary</h2>
          <div style="display:flex;gap:12px;margin-bottom:24px;">
            <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
              <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;">Total runs</p>
              <p style="font-size:20px;font-weight:700;color:#111827;margin:0;">${data.summary.totalRuns}</p>
            </div>
            <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
              <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;">Completed</p>
              <p style="font-size:20px;font-weight:700;color:#16a34a;margin:0;">${data.summary.completedRuns}</p>
            </div>
            <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
              <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;">Overdue</p>
              <p style="font-size:20px;font-weight:700;color:${data.summary.overdueRuns > 0 ? "#dc2626" : "#111827"};margin:0;">${data.summary.overdueRuns}</p>
            </div>
            <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
              <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;">Avg. time</p>
              <p style="font-size:20px;font-weight:700;color:#111827;margin:0;">${data.summary.avgCompletionMins ?? "—"} min</p>
            </div>
          </div>

          ${
            skippedSteps.length > 0
              ? `<h2 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Compliance risk — frequently skipped steps</h2>
                <div style="margin-bottom:24px;">
                  ${skippedSteps
                    .map(
                      (s) => `
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#fef2f2;border-radius:6px;margin-bottom:6px;">
                      <span style="font-size:12px;color:#374151;">${s.stepTitle} — ${s.text}</span>
                      <span style="font-size:12px;font-weight:700;color:#dc2626;">${s.completionRate}%</span>
                    </div>`
                    )
                    .join("")}
                </div>`
              : ""
          }

          <h2 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Execution history</h2>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:8px;color:#6b7280;">Executor</th>
              <th style="text-align:left;padding:8px;color:#6b7280;">Status</th>
              <th style="text-align:left;padding:8px;color:#6b7280;">Progress</th>
              <th style="text-align:left;padding:8px;color:#6b7280;">Started</th>
            </tr>
            ${data.runs
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px;color:#111827;">${r.executorName ?? r.executorEmail}</td>
                <td style="padding:8px;color:${r.status === "overdue" ? "#dc2626" : "#111827"};text-transform:capitalize;">${r.status.replace("_", " ")}</td>
                <td style="padding:8px;color:#111827;">${r.completedItems}/${r.totalItems}</td>
                <td style="padding:8px;color:#9ca3af;">${new Date(r.startedAt).toLocaleDateString()}</td>
              </tr>`
              )
              .join("")}
          </table>

          <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
            Exported from FlowMind — for internal compliance review purposes
          </div>
        </div>
      `;

      document.body.appendChild(container);
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${data.sop.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-audit-report.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Audit report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-12">Loading report...</p>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-red-300 mx-auto mb-2" />
              <p className="text-sm text-red-500 font-medium">Failed to load report</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{error}</p>
              <button onClick={loadReport} className="mt-4 text-xs text-indigo-600 hover:underline">
                Try again
              </button>
            </div>
          ) : !data || data.summary.totalRuns === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No execution data yet</p>
              <p className="text-xs text-gray-400 mt-1">Report appears once someone starts following this SOP</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total runs</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.summary.totalRuns}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Completed</p>
                  <p className="text-xl font-bold text-green-600">{data.summary.completedRuns}</p>
                </div>
                {/* 👇 Naya — overdue runs pehle kahin nahi dikhte the, compliance ke liye critical hai */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> Overdue
                  </p>
                  <p className={`text-xl font-bold ${data.summary.overdueRuns > 0 ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}>
                    {data.summary.overdueRuns}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Avg time
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {data.summary.avgCompletionMins ?? "—"} min
                  </p>
                </div>
              </div>

              {data.summary.inProgressRuns > 0 && (
                <p className="text-xs text-gray-400 mb-4">
                  {data.summary.inProgressRuns} run{data.summary.inProgressRuns > 1 ? "s" : ""} currently in progress
                </p>
              )}

              {skippedSteps.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Frequently skipped steps — worst first
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {skippedSteps.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {s.stepTitle} — {s.text}
                        </span>
                        <span className="text-xs font-bold text-red-600 flex-shrink-0 ml-2">
                          {s.completionRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Execution history</p>
              <div className="space-y-1.5">
                {data.runs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {r.executorName ?? r.executorEmail}
                      </span>
                      {r.status === "overdue" && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded flex-shrink-0">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {r.completedItems}/{r.totalItems} · {new Date(r.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {data && data.summary.totalRuns > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generating..." : "Export as PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}