"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { SopWithSteps } from "@/types";

type Props = { sop: SopWithSteps };

export default function ExportButton({ sop }: Props) {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);

    // Print-specific styles inject karo
    const style = document.createElement("style");
    style.id = "flowmind-print-style";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #flowmind-pdf, #flowmind-pdf * { visibility: visible !important; }
        #flowmind-pdf {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
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

    // PDF content banao
    const container = document.createElement("div");
    container.id = "flowmind-pdf";
    container.innerHTML = buildPdfHtml(sop);
    document.body.appendChild(container);

    setTimeout(() => {
      window.print();

      // Cleanup after print
      document.head.removeChild(style);
      document.body.removeChild(container);
      setExporting(false);
    }, 300);
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      <Download className="w-3 h-3" />
      {exporting ? "Preparing..." : "Export PDF"}
    </button>
  );
}

function buildPdfHtml(sop: SopWithSteps): string {
  const steps = sop.steps
    .map(
      (step, i) => `
      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; break-inside: avoid;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="
            width: 24px; height: 24px; border-radius: 50%;
            background: #EEF2FF; color: #4F46E5;
            font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          ">${i + 1}</span>
          <strong style="font-size: 14px; color: #111827;">${step.title}</strong>
        </div>

        ${
          step.owner || step.durationMins
            ? `<div style="display: flex; gap: 12px; margin-bottom: 8px;">
                ${step.owner ? `<span style="font-size: 11px; color: #6b7280; background: #f9fafb; padding: 2px 8px; border-radius: 4px;">👤 ${step.owner}</span>` : ""}
                ${step.durationMins ? `<span style="font-size: 11px; color: #6b7280; background: #f9fafb; padding: 2px 8px; border-radius: 4px;">⏱ ${step.durationMins} min</span>` : ""}
              </div>`
            : ""
        }

        ${step.description ? `<p style="font-size: 13px; color: #4b5563; margin: 0 0 10px; line-height: 1.5;">${step.description}</p>` : ""}

        ${
          step.checklistItems?.length > 0
            ? `<div style="margin-top: 8px;">
                ${step.checklistItems
                  .map(
                    (item) => `
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="
                      width: 14px; height: 14px; border-radius: 50%;
                      border: 1.5px solid #d1d5db;
                      display: inline-block; flex-shrink: 0;
                    "></span>
                    <span style="font-size: 12px; color: #374151;">${item.text}</span>
                  </div>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `
    <div>
      <!-- Header -->
      <div style="margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #4F46E5;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; font-weight: 700; color: #4F46E5; letter-spacing: 0.05em;">FLOWMIND</span>
          <span style="font-size: 11px; color: #9ca3af;">Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 12px 0 4px;">${sop.title}</h1>
        ${sop.description ? `<p style="font-size: 13px; color: #6b7280; margin: 0;">${sop.description}</p>` : ""}
        <div style="margin-top: 10px; display: flex; gap: 16px;">
          <span style="font-size: 12px; color: #6b7280;">${sop.steps.length} steps</span>
          <span style="font-size: 12px; color: #6b7280;">Created ${new Date(sop.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <!-- Steps -->
      <div>
        <h2 style="font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;">Process Steps</h2>
        ${steps}
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: #9ca3af;">Exported from FlowMind · flowmind.vercel.app</span>
        <span style="font-size: 11px; color: #9ca3af;">Page 1</span>
      </div>
    </div>
  `;
}