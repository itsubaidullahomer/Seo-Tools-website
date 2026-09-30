/**
 * The Processor used by the tool: parse (once), plan the output size, draw,
 * encode, and optionally write a DPI value into the file. Browser only.
 */
import { withDensity } from "./density";
import { parseSvg, readSvgText, type ParsedSvg } from "./parse";
import { renderSvg, type RenderOptions } from "./render";
import { GENERIC_ERROR, MAX_CODE_CHARS, UserFacingError, clampMessage, planOutput, type OutputPlan, type Sizing } from "./svg";

export interface ConvertOptions extends RenderOptions {
  sizing: Sizing;
  /** Pixel density to write into the file, or null to leave it out. */
  dpi: number | null;
}

/** What a processor needs to know about a row (a subset of the store's Row). */
export interface Job {
  file: File | null;
  code: string | null;
  parsed: ParsedSvg | null;
}

export interface JobResult {
  parsed: ParsedSvg;
  plan: OutputPlan;
  out: Blob;
  /** Format the output was encoded in (the row keeps it so names and buttons match the file). */
  outFormat: "png" | "jpg";
  /** The picture keeps transparent pixels (PNG without a background fill). */
  transparent: boolean;
  /** DPI value that was actually written into the file, or null. */
  dpiWritten: number | null;
  thumb: string | null;
  blank: boolean;
  /** Extra sentence about this conversion (size clamp, density not written), or null. */
  note: string | null;
}

/** A failure after the SVG was parsed: keeps the parsed result so the row can still show its warnings. */
export class JobFailure extends UserFacingError {
  readonly parsed: ParsedSvg;
  constructor(message: string, parsed: ParsedSvg) {
    super(message);
    this.parsed = parsed;
  }
}

export async function processJob(job: Job, options: ConvertOptions): Promise<JobResult> {
  let parsed = job.parsed;
  if (!parsed) {
    let text: string;
    if (job.code !== null) {
      if (job.code.length > MAX_CODE_CHARS) throw new UserFacingError("The pasted code is larger than 5 million characters. Upload it as a file instead.");
      text = job.code;
    } else if (job.file) {
      if (job.file.size === 0) throw new UserFacingError("This file is empty (0 bytes).");
      text = await readSvgText(job.file);
    } else {
      throw new UserFacingError("There is nothing to convert.");
    }
    parsed = parseSvg(text);
  }

  try {
    const plan = planOutput(parsed.size, options.sizing);
    const rendered = await renderSvg(parsed.template, plan, options);

    const notes: string[] = [];
    const clamp = clampMessage(plan);
    if (clamp) notes.push(clamp);

    let out = rendered.blob;
    let dpiWritten: number | null = null;
    if (options.dpi) {
      const result = await withDensity(out, options.format, options.dpi);
      out = result.blob;
      if (result.applied) dpiWritten = options.dpi;
      else notes.push(`The ${options.dpi} DPI value could not be written because this browser's ${options.format.toUpperCase()} encoder used an unexpected file layout. The pixels are unaffected.`);
    }
    return {
      parsed,
      plan,
      out,
      outFormat: options.format,
      transparent: options.format === "png" && !options.background,
      dpiWritten,
      thumb: rendered.thumb,
      blank: rendered.blank,
      note: notes.length ? notes.join(" ") : null,
    };
  } catch (e) {
    throw new JobFailure(e instanceof UserFacingError ? e.message : GENERIC_ERROR, parsed);
  }
}
