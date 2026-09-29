"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Like useState, but the value is restored from browser storage after hydration
 * and saved on every change. Storage stays on the user's device; nothing is sent
 * to a server. Use `session` (default) for drafts that should disappear when the
 * tab closes and `local` for user preferences.
 *
 * SSR-safe: the first render always uses `initial` so server and client markup
 * match; the stored value is applied right after mount.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options: { storage?: "session" | "local"; serialize?: (v: T) => string; deserialize?: (s: string) => T } = {},
): [T, Dispatch<SetStateAction<T>>, { restored: boolean; clear: () => void }] {
  const { storage = "session", serialize = JSON.stringify, deserialize = JSON.parse as (s: string) => T } = options;
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const skipNextSave = useRef(true);

  const getStore = useCallback((): Storage | null => {
    try {
      return storage === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }, [storage]);

  useEffect(() => {
    const store = getStore();
    // Restoring persisted state after hydration is the one legitimate case for
    // setting state from an effect body, so the rule is disabled for this hook only.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = store?.getItem(key);
      if (raw !== null && raw !== undefined) setValue(deserialize(raw));
    } catch {
      /* corrupt or unavailable storage – keep initial */
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!restored) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      getStore()?.setItem(key, serialize(value));
    } catch {
      // Quota exceeded: drop the stale value so an older draft isn't restored later.
      try {
        getStore()?.removeItem(key);
      } catch {
        /* unavailable */
      }
    }
  }, [key, value, restored, serialize, getStore]);

  const clear = useCallback(() => {
    try {
      getStore()?.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [getStore, key, initial]);

  return [value, setValue, { restored, clear }];
}
