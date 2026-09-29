"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Select, Slider, Stat, StatGrid, Tabs, Toggle, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  AMBIGUOUS,
  MAX_COUNT,
  MAX_LENGTH,
  MAX_WORDS,
  MIN_LENGTH,
  MIN_WORDS,
  SYMBOLS,
  createSecureRng,
  formatCombinations,
  formatGuessTime,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  planPools,
  randomEntropyBits,
  strengthLabel,
  type StrengthLevel,
} from "./generator";
import { WORDS } from "./words";

type Mode = "random" | "passphrase";
type SeparatorChoice = "-" | " " | "." | "_" | "custom";

interface Settings {
  mode: Mode;
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  noAmbiguous: boolean;
  noRepeat: boolean;
  exclude: string;
  words: number;
  separator: SeparatorChoice;
  customSeparator: string;
  capitalize: boolean;
  addNumber: boolean;
  count: number;
}

const DEFAULTS: Settings = {
  mode: "random",
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  noAmbiguous: false,
  noRepeat: false,
  exclude: "",
  words: 6,
  separator: "-",
  customSeparator: "",
  capitalize: true,
  addNumber: true,
  count: 1,
};

const SEPARATORS: { value: SeparatorChoice; label: string }[] = [
  { value: "-", label: "Hyphen ( - )" },
  { value: " ", label: "Space" },
  { value: ".", label: "Period ( . )" },
  { value: "_", label: "Underscore ( _ )" },
  { value: "custom", label: "Custom…" },
];

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

/** Only settings are remembered (in this browser); generated passwords never are. */
function readSettings(raw: string): Settings {
  const s = JSON.parse(raw) as Partial<Settings>;
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    mode: s.mode === "passphrase" ? "passphrase" : "random",
    length: clampInt(s.length, MIN_LENGTH, MAX_LENGTH, DEFAULTS.length),
    upper: bool(s.upper, DEFAULTS.upper),
    lower: bool(s.lower, DEFAULTS.lower),
    digits: bool(s.digits, DEFAULTS.digits),
    symbols: bool(s.symbols, DEFAULTS.symbols),
    noAmbiguous: bool(s.noAmbiguous, DEFAULTS.noAmbiguous),
    noRepeat: bool(s.noRepeat, DEFAULTS.noRepeat),
    exclude: typeof s.exclude === "string" ? s.exclude.slice(0, 100) : "",
    words: clampInt(s.words, MIN_WORDS, MAX_WORDS, DEFAULTS.words),
    separator: SEPARATORS.some((o) => o.value === s.separator) ? (s.separator as SeparatorChoice) : DEFAULTS.separator,
    customSeparator: typeof s.customSeparator === "string" ? s.customSeparator.slice(0, 5) : "",
    capitalize: bool(s.capitalize, DEFAULTS.capitalize),
    addNumber: bool(s.addNumber, DEFAULTS.addNumber),
    count: clampInt(s.count, 1, MAX_COUNT, DEFAULTS.count),
  };
}

const LEVELS: StrengthLevel[] = ["Weak", "Fair", "Strong", "Very strong"];
const LEVEL_STYLE: Record<StrengthLevel, { bar: string; badge: "danger" | "warning" | "success" }> = {
  Weak: { bar: "bg-danger", badge: "danger" },
  Fair: { bar: "bg-warning", badge: "warning" },
  Strong: { bar: "bg-success", badge: "success" },
  "Very strong": { bar: "bg-success", badge: "success" },
};

// Passwords are generated only in the browser; on the server (and during hydration)
// this reports false so the markup matches and no password ever appears in HTML.
const subscribeNoop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

export default function PasswordGenerator() {
  const [settings, setSettings] = usePersistentState<Settings>("password-generator:settings", DEFAULTS, {
    storage: "local",
    deserialize: readSettings,
  });
  const [visible, setVisible] = useState(true);
  const [nonce, setNonce] = useState(0);
  const isClient = useIsClient();

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const s = settings;
  const separator = s.separator === "custom" ? s.customSeparator : s.separator;

  const plan = useMemo(
    () =>
      planPools({
        length: s.length,
        upper: s.upper,
        lower: s.lower,
        digits: s.digits,
        symbols: s.symbols,
        noAmbiguous: s.noAmbiguous,
        noRepeat: s.noRepeat,
        exclude: s.exclude,
      }),
    [s.length, s.upper, s.lower, s.digits, s.symbols, s.noAmbiguous, s.noRepeat, s.exclude],
  );

  const error = s.mode === "random" ? plan.error : undefined;

  const bits = useMemo(
    () =>
      s.mode === "random"
        ? randomEntropyBits(plan, s.length, s.noRepeat)
        : passphraseEntropyBits({ words: s.words, separator, capitalize: s.capitalize, addNumber: s.addNumber }),
    [s.mode, plan, s.length, s.noRepeat, s.words, separator, s.capitalize, s.addNumber],
  );

  const passwords = useMemo(() => {
    if (!isClient || error) return [];
    void nonce; // bumping `nonce` (Generate new) regenerates with the same settings
    const rng = createSecureRng();
    return Array.from({ length: s.count }, () =>
      s.mode === "random"
        ? generatePassword(plan, s.length, s.noRepeat, rng)
        : generatePassphrase({ words: s.words, separator, capitalize: s.capitalize, addNumber: s.addNumber }, rng),
    );
  }, [isClient, error, nonce, s.count, s.mode, plan, s.length, s.noRepeat, s.words, separator, s.capitalize, s.addNumber]);

  const level = strengthLabel(bits);
  const levelIndex = LEVELS.indexOf(level);
  const formula =
    s.mode === "random"
      ? `${plan.size} possible characters × ${s.length} positions: ${s.length} × log2(${plan.size}) ≈ ${(s.length * Math.log2(plan.size || 1)).toFixed(1)} bits${
          plan.pools.length > 1 || s.noRepeat
            ? `. The entropy shown is exact: it leaves out passwords that miss a selected type${s.noRepeat ? " or repeat a character" : ""}, which this tool never produces`
            : ""
        }`
      : `${s.words} words from a ${WORDS.length.toLocaleString("en-US")}-word list: ${s.words} × log2(${WORDS.length}) ≈ ${(s.words * Math.log2(WORDS.length)).toFixed(1)} bits${
          s.addNumber ? ` + log2(10 digits × ${s.words} positions) ≈ ${Math.log2(10 * s.words).toFixed(1)} bits for the number` : ""
        }`;

  const mask = (pw: string) => "•".repeat(pw.length);

  return (
    <ToolPanel>
      <Tabs<Mode>
        label="Password type"
        value={s.mode}
        onChange={(mode) => update({ mode })}
        options={[
          { value: "random", label: "Random password" },
          { value: "passphrase", label: "Passphrase" },
        ]}
        className="self-start"
      />

      <section aria-label="Generated passwords" className="flex flex-col gap-3">
        {error ? (
          <Alert variant="error" title="Can’t generate a password with these settings">
            {error}
          </Alert>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="password-list">
            {(passwords.length ? passwords : Array.from({ length: s.count }, () => "")).map((pw, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 py-2 pl-3 pr-2">
                {s.count > 1 && <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>}
                <code
                  data-testid="password"
                  data-value={pw}
                  aria-label={visible ? undefined : `Password ${i + 1} (hidden)`}
                  className={cn(
                    "min-w-0 flex-1 font-mono break-all text-fg",
                    s.count === 1 ? "text-lg leading-snug sm:text-xl" : "text-sm sm:text-base",
                    !pw && "text-muted",
                  )}
                >
                  {pw ? (visible ? pw : mask(pw)) : "Generating…"}
                </code>
                <CopyButton text={pw} label="Copy" size="sm" variant={s.count === 1 ? "primary" : "secondary"} disabled={!pw} aria-label={`Copy password ${i + 1}`} />
              </li>
            ))}
          </ul>
        )}

        <ToolActions>
          <Button onClick={() => setNonce((n) => n + 1)} disabled={!!error} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
            Generate new
          </Button>
          <Button
            variant="secondary"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={!visible}
            leftIcon={visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          >
            {visible ? "Hide" : "Show"}
          </Button>
          {s.count > 1 && <CopyButton text={passwords.join("\n")} label={`Copy all ${s.count}`} variant="outline" disabled={!passwords.length} />}
        </ToolActions>
      </section>

      {!error && (
        <section aria-label="Password strength" className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-fg">
              Strength: <Badge variant={LEVEL_STYLE[level].badge} data-testid="strength">{level}</Badge>
            </p>
            <p className="text-xs text-muted">Based on how the password was generated, not how it looks</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={levelIndex + 1} aria-valuetext={level}>
            {LEVELS.map((l, i) => (
              <span key={l} className={cn("h-2 rounded-full", i <= levelIndex ? LEVEL_STYLE[level].bar : "bg-surface-3")} />
            ))}
          </div>
          <StatGrid className="lg:grid-cols-3">
            <Stat label="Entropy" value={<span data-testid="bits">{(Math.floor(bits * 10) / 10).toFixed(1)} bits</span>} emphasis />
            <Stat label="Average time to guess" value={<span className="text-lg sm:text-xl">{formatGuessTime(bits)}</span>} hint="at 10 billion guesses per second" />
            <Stat label="Possible results" value={<span className="text-lg sm:text-xl">{formatCombinations(bits)}</span>} hint="every one equally likely" />
          </StatGrid>
          <p className="text-xs text-muted" data-testid="formula">
            {formula}.
          </p>
          {level === "Weak" && (
            <Alert variant="warning" title="Too easy to guess for an online account">
              {s.mode === "random" ? "Make it longer or turn on more character types." : "Add more words."} Aim for at least 64 bits, and 80+ for a password manager master password or email account.
            </Alert>
          )}
        </section>
      )}

      <ToolSection title="Settings" description="Changes apply instantly. Your settings are remembered in this browser; generated passwords are never saved.">
        {s.mode === "random" ? (
          <div className="flex flex-col gap-4">
            <Slider label="Length" value={s.length} min={MIN_LENGTH} max={MAX_LENGTH} onChange={(length) => update({ length })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle checked={s.upper} onChange={(upper) => update({ upper })} label="Uppercase (A–Z)" />
              <Toggle checked={s.lower} onChange={(lower) => update({ lower })} label="Lowercase (a–z)" />
              <Toggle checked={s.digits} onChange={(digits) => update({ digits })} label="Numbers (0–9)" />
              <Toggle checked={s.symbols} onChange={(symbols) => update({ symbols })} label="Symbols" description={SYMBOLS.split("").join(" ")} />
              <Toggle
                checked={s.noAmbiguous}
                onChange={(noAmbiguous) => update({ noAmbiguous })}
                label="Exclude ambiguous characters"
                description={`Leaves out ${AMBIGUOUS.split("").join(" ")} for passwords you must read or type`}
              />
              <Toggle checked={s.noRepeat} onChange={(noRepeat) => update({ noRepeat })} label="No repeated characters" description="Each character appears at most once" />
            </div>
            <Input
              label="Never use these characters"
              value={s.exclude}
              maxLength={100}
              onChange={(e) => update({ exclude: e.target.value })}
              placeholder="e.g. <>{}[]"
              hint="Type any characters a site rejects. Every selected type still appears at least once."
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
            />
            {plan.emptied.length > 0 && !plan.error && (
              <Alert variant="warning">All {plan.emptied.join(" and ")} are excluded, so that type is skipped.</Alert>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Slider label="Number of words" value={s.words} min={MIN_WORDS} max={MAX_WORDS} onChange={(words) => update({ words })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Separator"
                value={s.separator}
                onChange={(e) => update({ separator: e.target.value as SeparatorChoice })}
                options={SEPARATORS}
              />
              {s.separator === "custom" && (
                <Input
                  label="Custom separator"
                  value={s.customSeparator}
                  maxLength={5}
                  onChange={(e) => update({ customSeparator: e.target.value })}
                  placeholder="e.g. +  or  #"
                  hint="Up to 5 characters. Leave empty to join words directly."
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono"
                />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle checked={s.capitalize} onChange={(capitalize) => update({ capitalize })} label="Capitalize words" description="Satisfies “must contain an uppercase letter” rules" />
              <Toggle checked={s.addNumber} onChange={(addNumber) => update({ addNumber })} label="Add a number" description="Appends one random digit to a random word" />
            </div>
            {s.separator === "custom" && !s.customSeparator && (
              <Alert variant="info">Without a separator, two different word combinations can produce the same text, so the real strength is slightly below the estimate.</Alert>
            )}
          </div>
        )}
        <Slider label="How many to generate" value={s.count} min={1} max={MAX_COUNT} onChange={(count) => update({ count })} />
      </ToolSection>
    </ToolPanel>
  );
}
