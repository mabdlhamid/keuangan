"use client";

import { useEffect, useState } from "react";

/**
 * State yang disimpan di localStorage browser.
 * `ready` bernilai true setelah data dibaca dari penyimpanan (menghindari hydration mismatch).
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* abaikan data rusak */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh / diblokir */
    }
  }, [key, value, ready]);

  return [value, setValue, ready] as const;
}
