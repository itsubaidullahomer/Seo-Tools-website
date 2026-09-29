/**
 * A tiny, dependency-free PDF writer used for the printable military time
 * chart. It only needs straight lines, filled rectangles and text in the
 * built-in Helvetica and Courier fonts, so the whole file format fits in a
 * few dozen lines. Text is limited to printable ASCII.
 */
import { hourRows, minuteGrid, pad2, type Step } from "./logic";

export type Paper = "letter" | "a4";

export const PAPERS: Record<Paper, { label: string; width: number; height: number }> = {
  letter: { label: "US Letter", width: 612, height: 792 },
  a4: { label: "A4", width: 595.28, height: 841.89 },
};

export function isPaper(v: unknown): v is Paper {
  return v === "letter" || v === "a4";
}

// Helvetica advance widths (1/1000 em) for ASCII 32-126. Used only to centre text.
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584,
  556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278,
  469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260,
  334, 584,
];

type FontKey = "F1" | "F2" | "F3";

function ascii(s: string): string {
  return s.replace(/[^\x20-\x7e]/g, "?");
}

function escapeText(s: string): string {
  return ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textWidth(s: string, size: number, font: FontKey): number {
  let total = 0;
  for (const ch of ascii(s)) {
    if (font === "F3") total += 600;
    else total += (HELVETICA[ch.charCodeAt(0) - 32] ?? 556) * (font === "F2" ? 1.06 : 1);
  }
  return (total * size) / 1000;
}

const num = (n: number): string => (Math.round(n * 100) / 100).toString();

class PageBuilder {
  private ops: string[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** `top` is measured from the top edge of the page, like CSS. */
  text(x: number, top: number, s: string, size: number, opts: { font?: FontKey; align?: "left" | "center" | "right"; gray?: number } = {}): void {
    const font = opts.font ?? "F1";
    const w = textWidth(s, size, font);
    const px = opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x;
    const gray = opts.gray ?? 0;
    this.ops.push(`BT ${num(gray)} g /${font} ${num(size)} Tf ${num(px)} ${num(this.height - top)} Td (${escapeText(s)}) Tj ET`);
  }

  rect(x: number, top: number, w: number, h: number, fillGray: number): void {
    this.ops.push(`${num(fillGray)} g ${num(x)} ${num(this.height - top - h)} ${num(w)} ${num(h)} re f 0 g`);
  }

  line(x1: number, top1: number, x2: number, top2: number, width = 0.5, gray = 0.55): void {
    this.ops.push(`${num(gray)} G ${num(width)} w ${num(x1)} ${num(this.height - top1)} m ${num(x2)} ${num(this.height - top2)} l S 0 G`);
  }

  get content(): string {
    return this.ops.join("\n");
  }
}

const MARGIN = 48;

function header(p: PageBuilder, title: string, subtitle: string): number {
  p.text(MARGIN, 66, title, 22, { font: "F2" });
  p.text(MARGIN, 86, subtitle, 10, { gray: 0.35 });
  p.line(MARGIN, 96, p.width - MARGIN, 96, 1, 0.2);
  return 96;
}

function footer(p: PageBuilder, left: string): void {
  const top = p.height - 36;
  p.line(MARGIN, top - 12, p.width - MARGIN, top - 12, 0.5, 0.7);
  p.text(MARGIN, top, left, 8, { gray: 0.4 });
  p.text(p.width - MARGIN, top, "Times are written HHMM. 0000 = midnight (start of day). 1200 = noon.", 8, { align: "right", gray: 0.4 });
}

function hoursPage(p: PageBuilder, source: string): void {
  const rows = hourRows();
  let top = header(p, "Military Time Chart", "The 24-hour clock from 0000 (midnight) to 2359. Find the hour, read across.");
  top += 16;
  p.text(MARGIN, top + 8, "AM: hours 1-11 stay the same and 12 AM becomes 00.   PM: add 12 to hours 1-11 and 12 PM stays 12.", 9, { gray: 0.25 });
  p.text(MARGIN, top + 22, "Going back: subtract 12 from hours 13-23. Minutes never change.", 9, { gray: 0.25 });
  top += 36;

  const tableW = p.width - MARGIN * 2;
  const cols = [tableW * 0.24, tableW * 0.3, tableW * 0.46];
  const headH = 24;
  const rowH = 21;
  p.rect(MARGIN, top, tableW, headH, 0.86);
  const heads = ["Military", "12-hour", "How to say it"];
  let x = MARGIN;
  heads.forEach((h, i) => {
    p.text(x + 10, top + 16, h, 10, { font: "F2" });
    x += cols[i];
  });
  let y = top + headH;
  rows.forEach((r, i) => {
    const special = r.hour === 0 || r.hour === 12;
    if (special) p.rect(MARGIN, y, tableW, rowH, 0.9);
    else if (i % 2 === 1) p.rect(MARGIN, y, tableW, rowH, 0.965);
    p.text(MARGIN + 10, y + 15, r.military, 12, { font: "F3" });
    p.text(MARGIN + cols[0] + 10, y + 15, r.note ? `${r.twelve}  (${r.note.toLowerCase()})` : r.twelve, 10.5);
    p.text(MARGIN + cols[0] + cols[1] + 10, y + 15, r.spoken, 10.5);
    y += rowH;
  });
  p.line(MARGIN, top, MARGIN + tableW, top, 1, 0.2);
  p.line(MARGIN, top + headH, MARGIN + tableW, top + headH, 1, 0.2);
  p.line(MARGIN, y, MARGIN + tableW, y, 1, 0.2);
  footer(p, source);
}

function minutesPage(p: PageBuilder, step: Step, source: string): void {
  const grid = minuteGrid(step);
  let top = header(p, "Military Time Chart by Minute", `Each cell is the military time for that hour (row) and minute (column), in steps of ${step} minutes.`);
  top += 20;
  const tableW = p.width - MARGIN * 2;
  const labelW = 62;
  const cellW = (tableW - labelW) / grid.columns.length;
  const headH = 22;
  const rowH = 22;
  p.rect(MARGIN, top, tableW, headH, 0.86);
  p.text(MARGIN + 8, top + 15, "12-hour", 9, { font: "F2" });
  grid.columns.forEach((c, i) => {
    p.text(MARGIN + labelW + cellW * i + cellW / 2, top + 15, `:${pad2(c)}`, 9, { font: "F2", align: "center" });
  });
  let y = top + headH;
  grid.rows.forEach((r, i) => {
    const special = r.hour === 0 || r.hour === 12;
    if (special) p.rect(MARGIN, y, tableW, rowH, 0.9);
    else if (i % 2 === 1) p.rect(MARGIN, y, tableW, rowH, 0.965);
    p.text(MARGIN + 8, y + 15, r.label, 9.5, { font: "F2" });
    r.cells.forEach((cell, ci) => {
      p.text(MARGIN + labelW + cellW * ci + cellW / 2, y + 15, cell, 9.5, { font: "F3", align: "center" });
    });
    y += rowH;
  });
  p.line(MARGIN, top, MARGIN + tableW, top, 1, 0.2);
  p.line(MARGIN, top + headH, MARGIN + tableW, top + headH, 1, 0.2);
  p.line(MARGIN, y, MARGIN + tableW, y, 1, 0.2);
  p.line(MARGIN + labelW, top, MARGIN + labelW, y, 0.5, 0.6);
  footer(p, source);
}

/** Build the two-page printable chart (hours, then minutes) as a PDF file body. */
export function buildChartPdf(paper: Paper, step: Step, source = "Made in your browser"): string {
  const size = PAPERS[paper];
  const pageBuilders = [new PageBuilder(size.width, size.height), new PageBuilder(size.width, size.height)];
  hoursPage(pageBuilders[0], source);
  minutesPage(pageBuilders[1], step, source);

  // Objects: 1 catalog, 2 pages, 3-5 fonts, 6 info, then a page + content stream per page.
  const objects: string[] = [];
  const firstPage = 7;
  const kids = pageBuilders.map((_, i) => `${firstPage + i * 2} 0 R`).join(" ");
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pageBuilders.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Title (Military Time Chart) /Subject (24-hour clock reference chart) /Producer (Browser) >>");
  pageBuilders.forEach((p, i) => {
    const contentId = firstPage + i * 2 + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(p.width)} ${num(p.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const body = p.content;
    objects.push(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
  });

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return out;
}
