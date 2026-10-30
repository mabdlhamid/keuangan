import type { Account, Transaction, Transfer } from "./types";

export interface Balances {
  /** Saldo tiap rekening: saldo awal + pemasukan − pengeluaran ± pindah saldo. */
  byId: Record<string, number>;
  /** Selisih transaksi yang belum punya rekening (data lama). Hanya informasi. */
  unassigned: number;
  unassignedCount: number;
  /**
   * Total uang saat ini.
   * - Sudah ada rekening: jumlah saldo semua rekening. Transaksi lama yang belum punya rekening
   *   TIDAK ikut dihitung, karena saldo yang diisi saat membuat rekening sudah memuat riwayat itu.
   * - Belum ada rekening: selisih seluruh pemasukan dan pengeluaran (seperti versi sebelumnya).
   */
  total: number;
}

export function computeBalances(
  accounts: Account[],
  transactions: Transaction[],
  transfers: Transfer[]
): Balances {
  const byId: Record<string, number> = {};
  for (const a of accounts) byId[a.id] = a.openingBalance;

  let net = 0;
  let unassigned = 0;
  let unassignedCount = 0;

  for (const t of transactions) {
    const delta = t.type === "income" ? t.amount : -t.amount;
    net += delta;
    if (t.accountId && t.accountId in byId) {
      byId[t.accountId] += delta;
    } else {
      unassigned += delta;
      unassignedCount += 1;
    }
  }

  for (const tr of transfers) {
    if (tr.from in byId) byId[tr.from] -= tr.amount;
    if (tr.to in byId) byId[tr.to] += tr.amount;
  }

  const total =
    accounts.length > 0 ? Object.values(byId).reduce((s, v) => s + v, 0) : net;
  return { byId, unassigned, unassignedCount, total };
}