import type { Account, Budgets, Pocket, Transaction, Transfer } from "./types";

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

export function exportCSV(transactions: Transaction[], accounts: Account[] = []) {
  const names = new Map(accounts.map((a) => [a.id, a.name]));
  const header = ["Tanggal", "Jenis", "Kategori", "Rekening", "Jumlah", "Catatan"];
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      t.category,
      (t.accountId && names.get(t.accountId)) || "",
      t.amount,
      t.note,
    ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  // BOM agar Excel membaca UTF-8 dengan benar
  download("transaksi.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
}

export interface Backup {
  transactions: Transaction[];
  budgets: Budgets;
  pockets: Pocket[];
  accounts: Account[];
  transfers: Transfer[];
}

export function exportBackup(data: Backup) {
  download(
    "backup-keuangan.json",
    JSON.stringify({ version: 3, ...data }, null, 2),
    "application/json"
  );
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
        ...(typeof t.accountId === "string" ? { accountId: t.accountId } : {}),
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

    const accounts: Account[] = Array.isArray(data.accounts)
      ? data.accounts
          .filter((a: Account) => a && typeof a.id === "string" && typeof a.name === "string")
          .map((a: Account) => ({
            id: a.id,
            name: a.name,
            kind: a.kind === "ewallet" || a.kind === "cash" ? a.kind : "bank",
            color: String(a.color ?? "#12B5A6"),
            openingBalance: Number(a.openingBalance) || 0,
          }))
      : [];

    const transfers: Transfer[] = Array.isArray(data.transfers)
      ? data.transfers
          .filter(
            (t: Transfer) =>
              t &&
              typeof t.id === "string" &&
              typeof t.from === "string" &&
              typeof t.to === "string" &&
              typeof t.amount === "number"
          )
          .map((t: Transfer) => ({
            id: t.id,
            from: t.from,
            to: t.to,
            amount: t.amount,
            date: String(t.date ?? ""),
            note: String(t.note ?? ""),
          }))
      : [];

    return { transactions, budgets, pockets, accounts, transfers };
  } catch {
    return null;
  }
}