import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pages = [
  ["home", "/"], ["tool", "/tools/word-counter"], ["category", "/category/text"], ["all-tools", "/tools"], ["privacy", "/privacy-policy"], ["json", "/tools/json-formatter"]
];
for (const [w, name] of [[1280, "desktop"], [390, "mobile"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  for (const [label, path] of pages) {
    await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
    if (label === "tool") { await page.fill("textarea", "The quick brown fox jumps over the lazy dog. It was a well-known trick."); await page.waitForTimeout(300); }
    await page.screenshot({ path: `screenshots/${label}-${name}.png`, fullPage: label !== "tool" || name === "desktop" });
  }
  console.log(name, "console errors:", errors.length ? errors : "none");
  await ctx.close();
}
await browser.close();
