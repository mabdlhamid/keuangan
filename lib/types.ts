export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
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
