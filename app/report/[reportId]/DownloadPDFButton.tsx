"use client";

import { useState } from "react";

interface DownloadPDFButtonProps {
  reportId: string;
  fileName?: string;
}

export default function DownloadPDFButton({
  reportId,
  fileName,
}: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    const reportEl = document.getElementById("pdf-report-content");
    if (!reportEl) {
      alert("Could not find report content to export.");
      setLoading(false);
      return;
    }

   
    const originalStyle = reportEl.style.cssText;

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      
      window.scrollTo(0, 0);

reportEl.style.cssText = `
  width: 860px !important;
  max-width: 860px !important;
  min-width: 860px !important;
  padding: 40px 48px !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  position: relative !important;
`;

      // Give the browser one frame to reflow at the new width
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 150));

      // ── Step 2: Capture at 2× pixel ratio for sharp text ──────────────
      const dataUrl = await toPng(reportEl, {
        pixelRatio: 2,
        backgroundColor: "#FAFAFA",
        cacheBust: true,
        width: 900,
        style: {
          width: "900px",
          maxWidth: "900px",
          padding: "32px",
          boxSizing: "border-box",
        },
      });

      // ── Step 3: Resolve natural image dimensions ───────────────────────
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image failed to load"));
      });

      // ── Step 4: Build PDF with matching page width ─────────────────────
      // A4 at 900 px width: height = 900 × (297 / 210) ≈ 1273 px
      const PAGE_W = 860;
const PAGE_H = Math.round(PAGE_W * (297 / 210)); // A4 ratio ≈ 1219px

const pdf = new jsPDF({
  orientation: "portrait",
  unit: "px",
  format: [PAGE_W, PAGE_H],
  hotfixes: ["px_scaling"],
});

const pdfWidth  = pdf.internal.pageSize.getWidth();
const pdfHeight = pdf.internal.pageSize.getHeight();

const ratio        = pdfWidth / img.naturalWidth;
const scaledHeight = img.naturalHeight * ratio;

// ── Smart page breaking ─────────────────────────────────────────
// Instead of cutting blindly every pdfHeight pixels,
// find the nearest "safe" y position (gap between sections)
// by scanning pixel rows for near-white horizontal lines.

const canvas = document.createElement("canvas");
const ctx    = canvas.getContext("2d")!;
canvas.width  = img.naturalWidth;
canvas.height = img.naturalHeight;
ctx.drawImage(img, 0, 0);

function isLightRow(y: number): boolean {
  // Sample 10 evenly-spaced pixels across the row
  const samples = 10;
  const step    = Math.floor(img.naturalWidth / samples);
  let lightCount = 0;
  for (let i = 0; i < samples; i++) {
    const pixel = ctx.getImageData(i * step, y, 1, 1).data;
    const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
    if (brightness > 230) lightCount++; // near-white
  }
  return lightCount >= samples * 0.8; // 80%+ pixels are light
}

function findSafeBreak(idealY: number): number {
  // Search ±80px around the ideal break point for a light row
  const searchRange = 80;
  for (let offset = 0; offset <= searchRange; offset++) {
    if (isLightRow(idealY - offset)) return idealY - offset;
    if (isLightRow(idealY + offset)) return idealY + offset;
  }
  return idealY; // fallback to ideal if no safe break found
}

// Build page break positions in image pixel coordinates
const pageHeightInPixels = pdfHeight / ratio;
const breakPoints: number[] = [];
let nextIdeal = pageHeightInPixels;

while (nextIdeal < img.naturalHeight) {
  const safeBreak = findSafeBreak(Math.floor(nextIdeal));
  breakPoints.push(safeBreak);
  nextIdeal = safeBreak + pageHeightInPixels;
}

// Add final end point
breakPoints.push(img.naturalHeight);

// Draw each page slice
let prevBreak = 0;
for (let p = 0; p < breakPoints.length; p++) {
  const sliceY      = prevBreak;
  const sliceH      = breakPoints[p] - prevBreak;
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width  = img.naturalWidth;
  sliceCanvas.height = sliceH;

  const sliceCtx = sliceCanvas.getContext("2d")!;
  sliceCtx.drawImage(
    img,
    0, sliceY,                   // source x, y
    img.naturalWidth, sliceH,    // source w, h
    0, 0,                        // dest x, y
    img.naturalWidth, sliceH     // dest w, h
  );

  const sliceDataUrl   = sliceCanvas.toDataURL("image/png");
  const sliceScaledH   = sliceH * ratio;

  if (p > 0) pdf.addPage();
  pdf.addImage(sliceDataUrl, "PNG", 0, 0, pdfWidth, sliceScaledH);

  prevBreak = breakPoints[p];
}

pdf.save(fileName ?? `credex-audit-${reportId}.pdf`);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // ── Always restore original styles ────────────────────────────────
      reportEl.style.cssText = originalStyle;
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg
            className="w-3.5 h-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Generating PDF…
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v13M5 13l7 7 7-7" />
            <path d="M3 21h18" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}