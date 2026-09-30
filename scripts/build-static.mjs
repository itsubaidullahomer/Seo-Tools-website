/**
 * Build the site as a plain static folder (./out) for any static host.
 *
 *   npm run build:static
 *
 * Runs the normal build (registry → validation → next build) with STATIC_EXPORT=1,
 * then copies static-host/_headers into the output.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync } from "node:fs";

const res = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
  shell: process.platform === "win32",
});
if (res.status !== 0) process.exit(res.status ?? 1);

copyFileSync("static-host/_headers", "out/_headers");
console.log("\nStatic site ready in ./out (upload it, or point Cloudflare Pages / Netlify at it).");
