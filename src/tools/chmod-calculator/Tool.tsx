"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, Checkbox, CopyButton, Input, Tabs, ToolActions, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CLASSES,
  COMMON_MODES,
  MODE_MASK,
  PERMS,
  PRESETS,
  SPECIAL_BITS,
  STICKY,
  SETUID,
  analyzeMode,
  applyChmodMode,
  autoDirMode,
  autoFileMode,
  classBits,
  describeClass,
  expressionUsesUmask,
  formatOctal,
  isWorldWritable,
  lsString,
  newDirMode,
  newFileMode,
  parseOctal,
  parseSymbolic,
  parseUmask,
  quotePath,
  quoteWord,
  recursiveCommands,
  singleCommands,
  toSymbolic,
  umaskFor,
  withClassBit,
  withFlag,
  type ClassKey,
  type CommandLine,
  type FileKind,
  type Preset,
} from "./logic";

interface State {
  mode: number;
  kind: FileKind;
  path: string;
  sudo: boolean;
  /** Octal text typed for the recursive directory mode, or null to use the automatic value. */
  dirOverride: string | null;
  fileOverride: string | null;
  presetId: string;
  startMode: string;
  expr: string;
  exprUmask: string;
  umask: string;
}

const DEFAULTS: State = {
  mode: 0o755,
  kind: "file",
  path: "filename",
  sudo: false,
  dirOverride: null,
  fileOverride: null,
  presetId: "",
  startMode: "644",
  expr: "+x",
  exprUmask: "022",
  umask: "022",
};

/**
 * Stored state comes from session storage and may be missing, outdated or edited
 * by hand. Rebuild it field by field so a bad value can never crash the tool.
 */
function normalize(raw: unknown): State {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (v: unknown, fallback: string, max = 500) => (typeof v === "string" ? v.slice(0, max) : fallback);
  const optStr = (v: unknown) => (typeof v === "string" ? v.slice(0, 12) : null);
  const mode = typeof src.mode === "number" && Number.isInteger(src.mode) && src.mode >= 0 && src.mode <= MODE_MASK ? src.mode : DEFAULTS.mode;
  return {
    mode,
    kind: src.kind === "dir" ? "dir" : "file",
    path: str(src.path, DEFAULTS.path),
    sudo: src.sudo === true,
    dirOverride: optStr(src.dirOverride),
    fileOverride: optStr(src.fileOverride),
    presetId: str(src.presetId, "", 40),
    startMode: str(src.startMode, DEFAULTS.startMode, 12),
    expr: str(src.expr, DEFAULTS.expr, 200),
    exprUmask: str(src.exprUmask, DEFAULTS.exprUmask, 12),
    umask: str(src.umask, DEFAULTS.umask, 12),
  };
}

const KIND_OPTIONS = [
  { value: "file" as const, label: "File" },
  { value: "dir" as const, label: "Directory" },
];

const EXPRESSION_EXAMPLES = ["+x", "u+x", "g+w", "o-rwx", "a-w", "go-w", "u=rw,go=r", "a+X"];
const UMASK_EXAMPLES = ["022", "002", "027", "077"];

function CodeBox({ label, text, hero }: { label: ReactNode; text: string; hero?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-surface-2", hero ? "border-primary/40" : "border-border-strong")}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5">
        <span className="label-mono">{label}</span>
        <CopyButton text={text} size="sm" variant="ghost" />
      </div>
      <code
        className={cn("block whitespace-pre-wrap break-all px-3 py-2.5 font-mono text-fg", hero ? "text-base font-semibold text-primary sm:text-lg" : "text-[13px]")}
        data-testid={hero ? "hero-command" : undefined}
      >
        {text}
      </code>
    </div>
  );
}

function CommandRow({ line }: { line: CommandLine }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-2" data-testid={`cmd-${line.id}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5">
        <span className="label-mono">{line.label}</span>
        <CopyButton text={line.command} size="sm" variant="ghost" />
      </div>
      <code className="block whitespace-pre-wrap break-all px-3 py-2 font-mono text-[13px] text-fg" data-testid={`cmd-${line.id}-text`}>
        {line.command}
      </code>
      {line.note && <p className="border-t border-border px-3 py-1.5 text-xs text-muted">{line.note}</p>}
    </div>
  );
}

function Card({ id, title, description, action, children }: { id: string; title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-base font-semibold text-fg">
            {title}
          </h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const alertVariant = { danger: "error", warning: "warning", info: "info" } as const;

export default function ChmodCalculator() {
  const [stored, setStored] = usePersistentState<State>("chmod-calculator:v1", DEFAULTS);
  const s = useMemo(() => normalize(stored), [stored]);
  const mutate = (fn: (cur: State) => Partial<State>) => setStored((prev) => {
    const cur = normalize(prev);
    return { ...cur, ...fn(cur) };
  });

  // Text being typed into the octal and symbolic boxes. It stays as typed until the box loses focus.
  const [octalDraft, setOctalDraft] = useState<string | null>(null);
  const [symDraft, setSymDraft] = useState<string | null>(null);
  const clearDrafts = () => {
    setOctalDraft(null);
    setSymDraft(null);
  };

  const octal = formatOctal(s.mode);
  const symbolic = toSymbolic(s.mode);
  const octalParsed = octalDraft !== null ? parseOctal(octalDraft) : null;
  const symParsed = symDraft !== null ? parseSymbolic(symDraft) : null;

  const findings = useMemo(() => analyzeMode(s.mode, s.kind), [s.mode, s.kind]);
  const single = useMemo(() => singleCommands(s.mode, s.path, s.sudo, s.kind), [s.mode, s.path, s.sudo, s.kind]);

  // Recursive modes: automatic unless the person typed their own.
  const autoDir = autoDirMode(s.mode);
  const autoFile = autoFileMode(s.mode);
  const dirParsed = s.dirOverride !== null ? parseOctal(s.dirOverride) : null;
  const fileParsed = s.fileOverride !== null ? parseOctal(s.fileOverride) : null;
  const dirMode = dirParsed?.ok ? dirParsed.value : autoDir;
  const fileMode = fileParsed?.ok ? fileParsed.value : autoFile;
  const recursive = useMemo(() => recursiveCommands(dirMode, fileMode, s.path, s.sudo, s.mode), [dirMode, fileMode, s.path, s.sudo, s.mode]);

  const activePreset: Preset | undefined = PRESETS.find((p) => p.id === s.presetId && p.mode === s.mode);

  // Symbolic change ("chmod +x") panel.
  const startParsed = parseOctal(s.startMode);
  const exprUmaskParsed = parseUmask(s.exprUmask);
  const exprResult =
    startParsed.ok && exprUmaskParsed.ok && s.expr.trim() ? applyChmodMode(startParsed.value, s.kind === "dir", exprUmaskParsed.value, s.expr) : null;
  const exprCommand = `${s.sudo ? "sudo " : ""}chmod ${quoteWord(s.expr.trim())} ${quotePath(s.path)}`;

  // umask panel.
  const umaskParsed = parseUmask(s.umask);

  const setKind = (kind: FileKind) => mutate(() => ({ kind }));
  const togglePerm = (c: ClassKey, value: number, on: boolean) => {
    clearDrafts();
    mutate((cur) => ({ mode: withClassBit(cur.mode, c, value, on) }));
  };
  const toggleFlag = (flag: number, on: boolean) => {
    clearDrafts();
    mutate((cur) => ({ mode: withFlag(cur.mode, flag, on) }));
  };
  const loadMode = (mode: number) => {
    clearDrafts();
    mutate(() => ({ mode, presetId: "" }));
  };
  const applyPreset = (p: Preset) => {
    clearDrafts();
    mutate(() => ({ mode: p.mode, kind: p.kind, path: p.path, presetId: p.id, dirOverride: null, fileOverride: null }));
  };
  const reset = () => {
    clearDrafts();
    setStored(DEFAULTS);
  };

  return (
    <ToolPanel>
      {/* Presets */}
      <div className="flex flex-col gap-2">
        <span className="label-mono">Start from a common setup</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
          {PRESETS.map((p) => (
            <Button key={p.id} size="sm" variant={activePreset?.id === p.id ? "primary" : "secondary"} aria-pressed={activePreset?.id === p.id} onClick={() => applyPreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>
        {activePreset && (
          <p className="text-xs text-fg-secondary" data-testid="preset-note">
            <span className="font-medium text-fg">
              {activePreset.label} ({formatOctal(activePreset.mode)}):
            </span>{" "}
            {activePreset.note}
          </p>
        )}
      </div>

      {/* Calculator */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          id="chmod-permissions"
          title="Permissions"
          description="Tick what each class may do."
          action={<Tabs label="Item type" size="sm" value={s.kind} onChange={setKind} options={KIND_OPTIONS} />}
        >
          <table className="w-full text-sm">
            <caption className="sr-only">Read, write and execute permissions for owner, group and others</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="pb-1 text-left font-normal">
                  <span className="label-mono">Who</span>
                </th>
                {PERMS.map((p) => (
                  <th key={p.key} scope="col" className="pb-1 text-center font-normal">
                    <span className="block text-[13px] font-medium text-fg">{p.label}</span>
                    <span className="block font-mono text-[11px]">
                      {p.letter} = {p.value}
                    </span>
                  </th>
                ))}
                <th scope="col" className="pb-1 text-center font-normal">
                  <span className="label-mono">Digit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => {
                const bits = classBits(s.mode, c.key);
                return (
                  <tr key={c.key} className="border-t border-border">
                    <th scope="row" className="py-1 pr-2 text-left font-medium text-fg">
                      {c.label}
                      <span className="block text-xs font-normal text-muted">{c.sub}</span>
                    </th>
                    {PERMS.map((p) => (
                      <td key={p.key} className="text-center">
                        <Checkbox
                          checked={(bits & p.value) !== 0}
                          onChange={(on) => togglePerm(c.key, p.value, on)}
                          label={<span className="sr-only">{`${c.label} ${p.label.toLowerCase()}`}</span>}
                          className="p-2.5"
                        />
                      </td>
                    ))}
                    <td className="text-center font-mono text-2xl font-semibold tabular-nums text-primary" data-testid={`digit-${c.key}`}>
                      {bits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div role="group" aria-labelledby="chmod-special" className="flex flex-col gap-2 border-t border-border pt-3">
            <span id="chmod-special" className="label-mono">
              Special bits
            </span>
            <div className="grid gap-2 sm:grid-cols-3">
              {SPECIAL_BITS.map((b) => (
                <div key={b.key} className="flex flex-col gap-0.5">
                  <Checkbox
                    checked={(s.mode & b.flag) !== 0}
                    onChange={(on) => toggleFlag(b.flag, on)}
                    label={
                      <span>
                        {b.label} <span className="font-mono text-xs text-muted">{b.octal}</span>
                      </span>
                    }
                  />
                  <span className="text-xs text-muted">{b.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card id="chmod-result" title="Result" description="Edit the octal or symbolic box and the checkboxes follow.">
          <CodeBox hero label="Command" text={single[0].command} />

          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <Input
              label="Octal"
              value={octalDraft ?? octal}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              inputSize="lg"
              className="font-mono text-lg"
              hint={octalParsed ? (!octalParsed.ok && octalParsed.incomplete ? octalParsed.error : undefined) : "e.g. 755, 0644, 4755"}
              error={octalParsed && !octalParsed.ok && !octalParsed.incomplete ? octalParsed.error : undefined}
              onChange={(e) => {
                const v = e.target.value;
                setOctalDraft(v);
                setSymDraft(null);
                const r = parseOctal(v);
                if (r.ok) mutate(() => ({ mode: r.value, presetId: "" }));
              }}
              onBlur={() => setOctalDraft(null)}
              containerClassName="min-w-0"
            />
            <Input
              label="Symbolic"
              value={symDraft ?? symbolic}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputSize="lg"
              className="font-mono text-lg"
              hint={symParsed && !symParsed.ok && symParsed.incomplete ? symParsed.error : symParsed ? undefined : "e.g. rwxr-xr-x"}
              error={symParsed && !symParsed.ok && !symParsed.incomplete ? symParsed.error : undefined}
              onChange={(e) => {
                const v = e.target.value;
                setSymDraft(v);
                setOctalDraft(null);
                const r = parseSymbolic(v);
                if (r.ok) mutate(() => ({ mode: r.value.mode, presetId: "", ...(r.value.kind ? { kind: r.value.kind } : {}) }));
              }}
              onBlur={() => setSymDraft(null)}
              containerClassName="min-w-0"
            />
          </div>

          <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
            <span className="label-mono">As shown by ls -l</span>
            <p className="mt-0.5 break-all font-mono text-sm text-fg" data-testid="ls-line">
              <span className="text-primary">{lsString(s.mode, s.kind)}</span> {s.path.trim() || "filename"}
            </p>
          </div>

          <ul className="flex flex-col gap-1.5" aria-label="What each class can do">
            {CLASSES.map((c) => {
              const bits = classBits(s.mode, c.key);
              return (
                <li key={c.key} className="flex items-baseline gap-2 text-sm">
                  <span className="w-11 shrink-0 font-mono text-xs text-muted">{symbolic.slice(CLASSES.indexOf(c) * 3, CLASSES.indexOf(c) * 3 + 3)}</span>
                  <span className="text-fg-secondary" data-testid={`describe-${c.key}`}>
                    {describeClass(c.label, bits, s.kind)}
                  </span>
                </li>
              );
            })}
          </ul>

          {findings.length > 0 && (
            <div className="flex flex-col gap-2" data-testid="findings">
              {findings.map((f) => (
                <Alert key={f.title} variant={alertVariant[f.level]} title={f.title}>
                  {f.text}
                </Alert>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Commands */}
      <ToolSection title="Copy-ready commands" description="These update with the mode above. Change the path to match your own file or folder.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="File or directory path"
            value={s.path}
            maxLength={500}
            autoComplete="off"
            spellCheck={false}
            hint="Spaces are quoted for you. A leading ~/ and * or ? wildcards are kept as typed."
            onChange={(e) => mutate(() => ({ path: e.target.value }))}
            containerClassName="min-w-0"
          />
          <div className="flex items-start sm:pt-6">
            <Toggle checked={s.sudo} onChange={(sudo) => mutate(() => ({ sudo }))} label="Prefix commands with sudo" description="For files you do not own." />
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {single.map((line) => (
            <CommandRow key={line.id} line={line} />
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-semibold text-fg">Whole folder tree: different modes for directories and files</h3>
            <p className="mt-0.5 text-xs text-muted">
              A plain chmod -R gives files and directories the same mode. Directories need execute to be entered; most files should not have it. The values start from your
              mode above and can be edited.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Input
                label="Directories"
                value={s.dirOverride ?? formatOctal(autoDir)}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                labelAddon={s.dirOverride === null ? "auto" : undefined}
                error={dirParsed && !dirParsed.ok ? `${dirParsed.error} Using ${formatOctal(autoDir)} until this is valid.` : undefined}
                hint={s.dirOverride === null ? "Your mode plus execute wherever read is set." : undefined}
                onChange={(e) => mutate(() => ({ dirOverride: e.target.value }))}
              />
              {s.dirOverride !== null && (
                <Button size="sm" variant="ghost" className="self-start" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={() => mutate(() => ({ dirOverride: null }))}>
                  Reset to auto
                </Button>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Input
                label="Files"
                value={s.fileOverride ?? formatOctal(autoFile)}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                labelAddon={s.fileOverride === null ? "auto" : undefined}
                error={fileParsed && !fileParsed.ok ? `${fileParsed.error} Using ${formatOctal(autoFile)} until this is valid.` : undefined}
                hint={s.fileOverride === null ? "Your mode with every execute bit removed." : undefined}
                onChange={(e) => mutate(() => ({ fileOverride: e.target.value }))}
              />
              {s.fileOverride !== null && (
                <Button size="sm" variant="ghost" className="self-start" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={() => mutate(() => ({ fileOverride: null }))}>
                  Reset to auto
                </Button>
              )}
            </div>
          </div>
          {isWorldWritable(dirMode) || isWorldWritable(fileMode) ? (
            <Alert variant="error" title="World-writable modes in a recursive command">
              Applying a mode that others can write to across a whole tree, such as 777 or 666, exposes every file in it. Use 755 and 644, or a shared group with 775 and 664.
            </Alert>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            {recursive.map((line) => (
              <CommandRow key={line.id} line={line} />
            ))}
          </div>
        </div>
      </ToolSection>

      {/* Common modes */}
      <ToolSection title="Common permission modes" description="Select a row to load it into the calculator.">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Common chmod modes with their symbolic form and typical use</caption>
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-2 py-2 font-medium sm:px-3">
                  Octal
                </th>
                <th scope="col" className="hidden px-2 py-2 font-medium sm:table-cell sm:px-3">
                  Symbolic
                </th>
                <th scope="col" className="px-2 py-2 font-medium sm:px-3">
                  Typical use
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMMON_MODES.map((row) => {
                const active = row.mode === s.mode;
                const risky = isWorldWritable(row.mode) && !(row.mode & STICKY);
                return (
                  <tr key={row.mode} className={cn(active && "bg-primary-soft")}>
                    <td className="px-2 py-1.5 sm:px-3">
                      <Button
                        size="sm"
                        variant={active ? "primary" : "secondary"}
                        className="font-mono"
                        aria-label={`Load mode ${formatOctal(row.mode)}`}
                        aria-pressed={active}
                        onClick={() => loadMode(row.mode)}
                      >
                        {formatOctal(row.mode)}
                      </Button>
                      <span className="mt-1 block whitespace-nowrap font-mono text-[11px] text-fg sm:hidden">{toSymbolic(row.mode)}</span>
                    </td>
                    <td className="hidden whitespace-nowrap px-2 py-1.5 font-mono text-xs text-fg sm:table-cell sm:px-3 sm:text-[13px]">{toSymbolic(row.mode)}</td>
                    <td className="px-2 py-1.5 text-fg-secondary sm:px-3">
                      {row.use}{" "}
                      {risky && <Badge variant="danger">world-writable</Badge>}
                      {row.mode & SETUID ? <Badge variant="warning">setuid</Badge> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ToolSection>

      {/* Symbolic change and umask */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card id="chmod-symbolic-change" title="Try a symbolic change" description="See what chmod +x, g+w or u=rw,go=r does to a mode before you run it.">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Current mode"
              value={s.startMode}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              error={!startParsed.ok && !startParsed.incomplete ? startParsed.error : undefined}
              onChange={(e) => mutate(() => ({ startMode: e.target.value }))}
              containerClassName="min-w-0"
            />
            <Input
              label="Your umask"
              value={s.exprUmask}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              error={!exprUmaskParsed.ok && !exprUmaskParsed.incomplete ? exprUmaskParsed.error : undefined}
              onChange={(e) => mutate(() => ({ exprUmask: e.target.value }))}
              containerClassName="min-w-0"
            />
          </div>
          <Input
            label="chmod mode"
            value={s.expr}
            maxLength={200}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="font-mono"
            hint="Symbolic (u+x, g-w,o-rwx, a=rX) or octal (640). Applied as a chmod on the item type chosen above."
            onChange={(e) => mutate(() => ({ expr: e.target.value }))}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example modes">
            {EXPRESSION_EXAMPLES.map((ex) => (
              <Button key={ex} size="sm" variant={s.expr === ex ? "primary" : "secondary"} className="font-mono" onClick={() => mutate(() => ({ expr: ex }))}>
                {ex}
              </Button>
            ))}
          </div>
          {exprResult === null ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-3 text-sm text-muted" aria-live="polite">
              {!startParsed.ok || !exprUmaskParsed.ok ? "Fix the highlighted field to see the result." : "Enter a mode such as +x to see the result."}
            </div>
          ) : !exprResult.ok ? (
            <Alert variant="warning" title="Not a valid chmod mode">
              {exprResult.error}
            </Alert>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3 py-3" aria-live="polite">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <output className="font-mono text-2xl font-semibold tabular-nums text-primary" data-testid="expr-result">
                  {formatOctal(exprResult.value)}
                </output>
                <span className="font-mono text-sm text-fg-secondary" data-testid="expr-result-symbolic">
                  {toSymbolic(exprResult.value)}
                </span>
              </div>
              <p className="text-sm text-fg-secondary">
                {startParsed.ok && (
                  <>
                    <span className="font-mono">chmod {s.expr.trim()}</span> takes a {s.kind === "dir" ? "directory" : "file"} from{" "}
                    <span className="font-mono">{formatOctal(startParsed.value)}</span> to <span className="font-mono">{formatOctal(exprResult.value)}</span>.
                  </>
                )}
              </p>
              {exprUmaskParsed.ok && expressionUsesUmask(s.expr) && (
                <p className="text-xs text-muted">
                  No u, g, o or a was given, so chmod leaves the bits in your umask ({formatOctal(exprUmaskParsed.value)}) untouched. Write a+x, a=rw or similar to ignore the umask.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <CopyButton text={exprCommand} label="Copy command" size="sm" variant="secondary" />
                <Button size="sm" variant="secondary" onClick={() => loadMode(exprResult.value)}>
                  Show in calculator
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card id="chmod-umask" title="umask calculator" description="The umask decides the mode of every new file and directory.">
          <Input
            label="umask"
            value={s.umask}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            error={!umaskParsed.ok && !umaskParsed.incomplete ? umaskParsed.error : undefined}
            onChange={(e) => mutate(() => ({ umask: e.target.value }))}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example umasks">
            {UMASK_EXAMPLES.map((ex) => (
              <Button key={ex} size="sm" variant={s.umask === ex ? "primary" : "secondary"} className="font-mono" onClick={() => mutate(() => ({ umask: ex }))}>
                {ex}
              </Button>
            ))}
          </div>
          {umaskParsed.ok ? (
            <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
              <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span className="label-mono">New files</span>
                <p className="font-mono text-lg font-semibold text-primary" data-testid="umask-file">
                  {formatOctal(newFileMode(umaskParsed.value))}
                </p>
                <p className="font-mono text-xs text-muted">{lsString(newFileMode(umaskParsed.value), "file")}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span className="label-mono">New directories</span>
                <p className="font-mono text-lg font-semibold text-primary" data-testid="umask-dir">
                  {formatOctal(newDirMode(umaskParsed.value))}
                </p>
                <p className="font-mono text-xs text-muted">{lsString(newDirMode(umaskParsed.value), "dir")}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-3 text-sm text-muted">Enter a umask such as 022 to see the modes it produces.</div>
          )}
          <p className="text-xs text-fg-secondary" data-testid="umask-reverse">
            Closest umask for the mode above: <span className="font-mono">{formatOctal(umaskFor(s.mode))}</span>, which makes new files{" "}
            <span className="font-mono">{formatOctal(newFileMode(umaskFor(s.mode)))}</span> and new directories{" "}
            <span className="font-mono">{formatOctal(newDirMode(umaskFor(s.mode)))}</span>.
          </p>
          <CodeBox label="Set it in a shell" text={`umask ${formatOctal(umaskFor(s.mode))}`} />
        </Card>
      </div>

      <ToolActions>
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
          Reset calculator
        </Button>
      </ToolActions>

      <p className="text-xs text-muted">
        Modes follow GNU chmod on Linux. Filesystems without Unix permissions (FAT, exFAT, most NTFS mounts) ignore chmod, and ACLs or SELinux policy can still block access that the mode allows.
        Everything is calculated in your browser; the path and modes you enter are not uploaded.
      </p>
    </ToolPanel>
  );
}
