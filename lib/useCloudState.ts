"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "./supabase";

/**
 * State yang tersimpan per akun di Supabase (tabel `user_data`, satu baris per `key`).
 *
 * - `userId` terisi  → baca/tulis ke Supabase. Jika di server masih kosong tetapi browser ini
 *   punya data lama dari versi sebelumnya (localStorage `kp:<key>`), data itu dipindahkan otomatis.
 * - `userId` null    → mode lokal tanpa login: baca/tulis localStorage seperti sebelumnya.
 *
 * Mengembalikan [value, setValue, ready, error]. Selama `ready` false, jangan tampilkan/ubah data
 * (mencegah data kosong menimpa data di server saat gagal memuat).
 */
export function useCloudState<T>(userId: string | null, key: string, initial: T) {
  const lsKey = `kp:${key}`;
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSave = useRef(true); // lewati penyimpanan untuk nilai yang baru saja dimuat

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    skipSave.current = true;

    const readLocal = (): T | undefined => {
      try {
        const raw = localStorage.getItem(lsKey);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch {
        return undefined;
      }
    };

    if (!userId) {
      const local = readLocal();
      if (local !== undefined) setValue(local);
      setReady(true);
      return;
    }

    (async () => {
      const { data, error: err } = await getSupabase()
        .from("user_data")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        return;
      }
      if (data) {
        setValue(data.value as T);
      } else {
        const local = readLocal();
        if (local !== undefined) {
          skipSave.current = false; // simpan data lama ke server
          setValue(local);
        }
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, key, lsKey]);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }

    if (!userId) {
      try {
        localStorage.setItem(lsKey, JSON.stringify(value));
      } catch {
        /* penyimpanan penuh / diblokir */
      }
      return;
    }

    const timer = setTimeout(async () => {
      const { error: err } = await getSupabase()
        .from("user_data")
        .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() });
      if (err) {
        window.dispatchEvent(new CustomEvent("kp:save-error", { detail: err.message }));
      } else {
        window.dispatchEvent(new Event("kp:saved"));
        try {
          localStorage.removeItem(lsKey); // data lama sudah aman di server
        } catch {
          /* abaikan */
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, ready, userId, key, lsKey]);

  return [value, setValue, ready, error] as const;
}