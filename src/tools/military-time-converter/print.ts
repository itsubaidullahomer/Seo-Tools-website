/**
 * Builds a self-contained, black-on-white HTML document with the military time
 * chart, and prints it from a hidden iframe. Printing a separate document (rather
 * than hiding the rest of the page with CSS) avoids blank trailing pages and keeps
 * the printout identical in light and dark mode.
 */
import { hourRows, minuteGrid, pad2, type Step } from "./logic";
import type { Paper } from "./pdf";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PRINT_CSS = `
@page { size: __SIZE__; margin: __MARGIN__; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: white; color: black; }
body { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.3; }
h1 { font-size: 22pt; margin: 0 0 4pt; }
h2 { font-size: 16pt; margin: 0 0 4pt; }
p.sub { margin: 0 0 10pt; color: dimgray; font-size: 10pt; }
p.rule { margin: 0 0 10pt; font-size: 9.5pt; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid gray; padding: 3.2pt 8pt; text-align: left; }
th { background: gainsboro; font-size: 10pt; }
td.mil, td.cell { font-family: "Courier New", Courier, monospace; font-weight: bold; }
td.cell, th.cell { text-align: center; padding: 4pt 2pt; font-size: 9.5pt; }
tr.alt td { background: whitesmoke; }
tr.hl td { background: lightgray; }
.page { break-after: page; page-break-after: always; }
.page:last-of-type { break-after: auto; page-break-after: auto; }
footer { margin-top: 10pt; font-size: 8.5pt; color: dimgray; display: flex; justify-content: space-between; gap: 12pt; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

export function buildPrintHtml(paper: Paper, step: Step, source: string): string {
  const size = paper === "a4" ? "A4 portrait" : "letter portrait";
  const margin = paper === "a4" ? "14mm" : "0.55in";
  const css = PRINT_CSS.replace("__SIZE__", size).replace("__MARGIN__", margin);
  const foot = `<footer><span>${esc(source)}</span><span>Times are written HHMM. 0000 = midnight (start of day). 1200 = noon.</span></footer>`;

  const hourBody = hourRows()
    .map((r, i) => {
      const cls = r.hour === 0 || r.hour === 12 ? "hl" : i % 2 === 1 ? "alt" : "";
      const twelve = r.note ? `${r.twelve} (${r.note.toLowerCase()})` : r.twelve;
      return `<tr class="${cls}"><td class="mil">${r.military}</td><td>${esc(twelve)}</td><td>${esc(r.spoken)}</td></tr>`;
    })
    .join("");

  const grid = minuteGrid(step);
  const gridHead = `<tr><th>12-hour</th>${grid.columns.map((c) => `<th class="cell">:${pad2(c)}</th>`).join("")}</tr>`;
  const gridBody = grid.rows
    .map((r, i) => {
      const cls = r.hour === 0 || r.hour === 12 ? "hl" : i % 2 === 1 ? "alt" : "";
      return `<tr class="${cls}"><td><b>${esc(r.label)}</b></td>${r.cells.map((c) => `<td class="cell">${c}</td>`).join("")}</tr>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Military Time Chart</title><style>${css}</style></head><body>
<section class="page">
<h1>Military Time Chart</h1>
<p class="sub">The 24-hour clock from 0000 (midnight) to 2359. Find the hour, read across.</p>
<p class="rule">AM: hours 1-11 stay the same and 12 AM becomes 00. PM: add 12 to hours 1-11 and 12 PM stays 12. Going back: subtract 12 from hours 13-23. Minutes never change.</p>
<table><thead><tr><th>Military</th><th>12-hour</th><th>How to say it</th></tr></thead><tbody>${hourBody}</tbody></table>
${foot}
</section>
<section class="page">
<h2>Military Time Chart by Minute</h2>
<p class="sub">Each cell is the military time for that hour (row) and minute (column), in steps of ${step} minutes.</p>
<table><thead>${gridHead}</thead><tbody>${gridBody}</tbody></table>
${foot}
</section>
</body></html>`;
}

/** Print an HTML document from a hidden iframe. Browser-only: call from an event handler. */
export function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.title = "Printable military time chart";
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    setTimeout(() => iframe.remove(), 60_000);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}
