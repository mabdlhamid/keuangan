export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  accountId?: string; // rekening / e-wallet tempat transaksi terjadi
}

export type Budgets = Record<string, number>;

/** Kantong: tempat menyimpan uang untuk tujuan tertentu. */
export interface Pocket {
  id: string;
  name: string;
  emoji: string;
  color: string;
  target: number; // 0 = tanpa target
  balance: number;
}

export type AccountKind = "bank" | "ewallet" | "cash";

/** Rekening bank, e-wallet, atau uang tunai. */
export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  color: string;
  openingBalance: number; // saldo awal saat mulai dicatat
}

/** Pindah saldo antar rekening (bukan pemasukan / pengeluaran). */
export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
}