"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { SopWithSteps } from "@/types";

type Props = { sop: SopWithSteps };

const PAGE_WIDTH_MM = 210; // A4
const PAGE_HEIGHT_MM = 297; // A4
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_MM * 2;

export default function ExportButton({ sop }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);

    try {
      // Render header block and each step as SEPARATE canvases. Pagination then
      // works block-by-block (never mid-block), so a step card can never get cut
      // in half between page 1 and page 2 the way a single sliced screenshot does.
      const headerCanvas = await renderBlockToCanvas(buildHeaderHtml(sop));
      const stepCanvases = await Promise.all(
        sop.steps.map((step, i) => renderBlockToCanvas(buildStepHtml(step, i)))
      );

      const pdf = new jsPDF("p", "mm", "a4");
      let cursorYmm = MARGIN_MM;
      let isFirstBlockOnPage = true;

      const placeBlock = (canvas: HTMLCanvasElement) => {
        const blockWidthMm = CONTENT_WIDTH_MM;
        const blockHeightMm = (canvas.height * blockWidthMm) / canvas.width;

        // If this block won't fit in the remaining space on the current page,
        // start a fresh page instead of slicing the block.
        if (!isFirstBlockOnPage && cursorYmm + blockHeightMm > PAGE_HEIGHT_MM - MARGIN_MM) {
          pdf.addPage();
          cursorYmm = MARGIN_MM;
        }

        // Edge case: a single block taller than one full page. Fall back to
        // slicing ONLY this oversized block (rare, e.g. a step with a huge
        // checklist), rather than ever slicing across step boundaries.
        if (blockHeightMm > CONTENT_HEIGHT_MM) {
          sliceOversizedBlock(pdf, canvas, blockWidthMm, blockHeightMm);
          cursorYmm = MARGIN_MM;
          isFirstBlockOnPage = true;
          return;
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", MARGIN_MM, cursorYmm, blockWidthMm, blockHeightMm);
        cursorYmm += blockHeightMm + 6; // 6mm gap between blocks
        isFirstBlockOnPage = false;
      };

      placeBlock(headerCanvas);
      stepCanvases.forEach(placeBlock);

      const fileName = `${sop.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      <Download className="w-3 h-3" />
      {exporting ? "Generating..." : "Export PDF"}
    </button>
  );
}

/** Renders a chunk of HTML off-screen and returns its canvas. */
async function renderBlockToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "760px"; // matches CONTENT_WIDTH_MM at ~2x scale ratio
  container.style.background = "white";
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  container.innerHTML = html;
  document.body.appendChild(container);

  // Let fonts/layout settle before capture.
  await new Promise((resolve) => setTimeout(resolve, 50));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  document.body.removeChild(container);
  return canvas;
}

/** Only used for a single block that's taller than a full page on its own. */
function sliceOversizedBlock(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  blockWidthMm: number,
  blockHeightMm: number
) {
  const pageCount = Math.ceil(blockHeightMm / CONTENT_HEIGHT_MM);
  const imgData = canvas.toDataURL("image/png");

  for (let p = 0; p < pageCount; p++) {
    if (p > 0) pdf.addPage();
    const yOffsetMm = -p * CONTENT_HEIGHT_MM;
    pdf.addImage(imgData, "PNG", MARGIN_MM, MARGIN_MM + yOffsetMm, blockWidthMm, blockHeightMm);
  }
}

function buildHeaderHtml(sop: SopWithSteps): string {
  return `
    <div style="margin-bottom: 8px; padding-bottom: 20px; border-bottom: 2px solid #4F46E5;">
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
      <h2 style="font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 20px;">Process Steps</h2>
    </div>
  `;
}

function buildStepHtml(step: SopWithSteps["steps"][number], i: number): string {
  return `
    <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
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
              ${step.owner ? `<span style="font-size: 11px; color: #6b7280; background: #f9fafb; padding: 2px 8px; border-radius: 4px;">Owner: ${step.owner}</span>` : ""}
              ${step.durationMins ? `<span style="font-size: 11px; color: #6b7280; background: #f9fafb; padding: 2px 8px; border-radius: 4px;">${step.durationMins} min</span>` : ""}
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
  `;
}