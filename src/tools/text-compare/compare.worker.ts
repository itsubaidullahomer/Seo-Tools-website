/**
 * Runs comparisons off the main thread so large texts never freeze the page. The page can
 * cancel a comparison at any time by terminating this worker.
 */
import { compareTexts, makePatch, type CompareOptions } from "./logic";

export type WorkerRequest =
  | { id: number; type: "compare"; left: string; right: string; options: CompareOptions }
  | { id: number; type: "patch"; left: string; right: string; leftName: string; rightName: string };

/** A request without its id (the page adds the id when sending). */
export type WorkerJob = WorkerRequest extends infer R ? (R extends unknown ? Omit<R, "id"> : never) : never;

const scope = globalThis as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: unknown): void;
};

scope.onmessage = (e) => {
  const req = e.data;
  try {
    if (req.type === "compare") scope.postMessage({ id: req.id, result: compareTexts(req.left, req.right, req.options) });
    else scope.postMessage({ id: req.id, patch: makePatch(req.left, req.right, req.leftName, req.rightName) });
  } catch (err) {
    scope.postMessage({ id: req.id, error: err instanceof Error ? err.message : String(err) });
  }
};
