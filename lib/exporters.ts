import type { Budgets, Pocket, Transaction } from "./types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCSV(transactions: Transaction[]) {
  const header = ["Tanggal", "Jenis", "Kategori", "Jumlah", "Catatan"];
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      t.category,
      t.amount,
      t.note,
    ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  // BOM agar Excel membaca UTF-8 dengan benar
  download("transaksi.csv", "﻿" + csv, "text/csv;charset=utf-8");
}

export function exportBackup(transactions: Transaction[], budgets: Budgets, pockets: Pocket[]) {
  download(
    "backup-keuangan.json",
    JSON.stringify({ version: 2, transactions, budgets, pockets }, null, 2),
    "application/json"
  );
}

export interface Backup {
  transactions: Transaction[];
  budgets: Budgets;
  pockets: Pocket[];
}

export function parseBackup(text: string): Backup | null {
  try {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.transactions)) return null;

    const transactions: Transaction[] = data.transactions
      .filter(
        (t: Transaction) =>
          t &&
          typeof t.id === "string" &&
          (t.type === "income" || t.type === "expense") &&
          typeof t.amount === "number" &&
          typeof t.date === "string"
      )
      .map((t: Transaction) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: String(t.category ?? "Lainnya"),
        date: t.date,
        note: String(t.note ?? ""),
      }));

    const budgets: Budgets =
      data.budgets && typeof data.budgets === "object" ? data.budgets : {};

    const pockets: Pocket[] = Array.isArray(data.pockets)
      ? data.pockets
          .filter((p: Pocket) => p && typeof p.id === "string" && typeof p.name === "string")
          .map((p: Pocket) => ({
            id: p.id,
            name: p.name,
            emoji: String(p.emoji ?? "🐷"),
            color: String(p.color ?? "#FF7A1A"),
            target: Number(p.target) || 0,
            balance: Number(p.balance) || 0,
          }))
      : [];

    return { transactions, budgets, pockets };
  } catch {
    return null;
  }
}
