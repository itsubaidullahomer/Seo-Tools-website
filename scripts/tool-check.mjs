/**
 * Smoke-check a tool page in a real browser.
 *
 *   node scripts/tool-check.mjs <slug> [--base http://localhost:3000] [--all]
 *
 * Loads /tools/<slug> on desktop and mobile, fails on console errors, page
 * errors or an error-boundary message, and writes screenshots to
 * screenshots/tools/<slug>-{desktop,mobile}.png. With --all it checks every
 * tool folder in src/tools and prints a summary.
 */
import { chromium } from "playwright";
import { readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : "http://localhost:3000";
const all = args.includes("--all");
const slugArg = args.find((a) => !a.startsWith("--") && a !== base);

const toolsDir = join(process.cwd(), "src", "tools");
const slugs = all
  ? readdirSync(toolsDir).filter((n) => !n.startsWith("_") && statSync(join(toolsDir, n)).isDirectory() && existsSync(join(toolsDir, n, "Tool.tsx")))
  : [slugArg];
if (!slugs[0]) {
  console.error("usage: node scripts/tool-check.mjs <slug> [--base url] | --all");
  process.exit(1);
}

mkdirSync(join(process.cwd(), "screenshots", "tools"), { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

// Dev-only noise: React DevTools hint, favicon, and Turbopack chunk-preload 404s for lazily imported libraries.
const IGNORED = [/Download the React DevTools/, /favicon/, /Failed to load resource.*404/];

let failures = 0;
for (const slug of slugs) {
  const problems = [];
  for (const [width, label] of [
    [1280, "desktop"],
    [390, "mobile"],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error" && !IGNORED.some((re) => re && re.test(m.text()))) problems.push(`[${label}] console: ${m.text().slice(0, 300)}`);
    });
    page.on("pageerror", (e) => problems.push(`[${label}] pageerror: ${String(e).slice(0, 300)}`));
    const res = await page.goto(`${base}/tools/${slug}`, { waitUntil: "networkidle", timeout: 90000 }).catch((e) => {
      problems.push(`[${label}] navigation failed: ${e.message}`);
      return null;
    });
    if (res && res.status() !== 200) problems.push(`[${label}] HTTP ${res.status()}`);
    await page.waitForTimeout(500);
    const body = await page.textContent("body").catch(() => "");
    if (/This tool hit an unexpected error|This tool is not available yet/.test(body ?? "")) problems.push(`[${label}] tool failed to render`);
    const h1 = await page.textContent("h1").catch(() => "");
    if (!h1?.trim()) problems.push(`[${label}] missing H1`);
    await page.screenshot({ path: join("screenshots", "tools", `${slug}-${label}.png`), fullPage: label === "mobile" ? false : true });
    await ctx.close();
  }
  if (problems.length) {
    failures++;
    console.log(`✖ ${slug}\n  ${problems.join("\n  ")}`);
  } else {
    console.log(`✓ ${slug}`);
  }
}
await browser.close();
console.log(`\n${slugs.length - failures}/${slugs.length} tool pages OK`);
process.exit(failures ? 1 : 0);
