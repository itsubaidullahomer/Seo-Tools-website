/**
 * Scaffold a new tool folder from the template.
 *
 *   npm run new-tool -- --slug px-to-rem --name "PX to REM Converter" --category converters
 *
 * Then edit src/tools/<slug>/{meta.ts,content.md,Tool.tsx} and run `npm run dev`.
 */
import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const slug = get("--slug");
const name = get("--name");
const category = get("--category") ?? "utilities";

if (!slug || !name) {
  console.error('Usage: npm run new-tool -- --slug <slug> --name "<Tool Name>" [--category <category-slug>]');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("slug must be lowercase letters, numbers and hyphens, e.g. word-counter");
  process.exit(1);
}

const root = process.cwd();
const template = join(root, "src", "tools", "_template");
const target = join(root, "src", "tools", slug);
if (existsSync(target)) {
  console.error(`src/tools/${slug} already exists`);
  process.exit(1);
}

cpSync(template, target, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const componentName = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

for (const file of readdirSync(target)) {
  const p = join(target, file);
  const src = readFileSync(p, "utf8")
    .replaceAll("__SLUG__", slug)
    .replaceAll("__NAME__", name)
    .replaceAll("__CATEGORY__", category)
    .replaceAll("__DATE__", today)
    .replaceAll("ToolTemplate", componentName);
  writeFileSync(p, src);
}

console.log(`Created src/tools/${slug}/ – now edit meta.ts, content.md and Tool.tsx, then run: npm run gen`);
