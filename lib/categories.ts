import type { AccountKind } from "./types";
export const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

export const INCOME_CATEGORIES = ["Gaji", "Bonus", "Usaha", "Investasi", "Lainnya"];

export const CATEGORY_COLORS: Record<string, string> = {
  Makanan: "#FF7A1A",
  Transportasi: "#3B82F6",
  Belanja: "#F0527E",
  Tagihan: "#E0A800",
  Hiburan: "#8B5CF6",
  Kesehatan: "#E5484D",
  Pendidikan: "#12B5A6",
  Lainnya: "#8A8A83",
};

const CATEGORY_EMOJI: Record<string, string> = {
  Makanan: "🍜",
  Transportasi: "🚌",
  Belanja: "🛍️",
  Tagihan: "🧾",
  Hiburan: "🎬",
  Kesehatan: "💊",
  Pendidikan: "📚",
  Gaji: "💼",
  Bonus: "🎁",
  Usaha: "🏪",
  Investasi: "📈",
  Lainnya: "✨",
};

export function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#8A8A83";
}

export function emojiFor(category: string): string {
  return CATEGORY_EMOJI[category] ?? "✨";
}

export const POCKET_COLORS = ["#FF7A1A", "#12B5A6", "#3B82F6", "#F0527E", "#8B5CF6", "#2FB36B"];

export const POCKET_EMOJIS = ["🏖️", "🏠", "🚗", "📱", "🎓", "💍", "🛟", "🎮", "✈️", "🐷", "🎁", "🏥"];
/* ---------- Rekening & e-wallet ---------- */

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  bank: "Bank",
  ewallet: "E-wallet",
  cash: "Tunai",
};

export const ACCOUNT_KIND_EMOJI: Record<AccountKind, string> = {
  bank: "🏦",
  ewallet: "📱",
  cash: "💵",
};

export const ACCOUNT_COLORS = POCKET_COLORS;

/** Pilihan cepat saat membuat rekening. Nama dan warna tetap bisa diubah. */
export const ACCOUNT_PRESETS: { name: string; kind: AccountKind; color: string }[] = [
  { name: "BSI", kind: "bank", color: "#12B5A6" },
  { name: "SeaBank", kind: "bank", color: "#FF7A1A" },
  { name: "BCA", kind: "bank", color: "#3B82F6" },
  { name: "BRI", kind: "bank", color: "#8B5CF6" },
  { name: "Mandiri", kind: "bank", color: "#E0A800" },
  { name: "BNI", kind: "bank", color: "#F0527E" },
  { name: "Jago", kind: "bank", color: "#FF7A1A" },
  { name: "DANA", kind: "ewallet", color: "#3B82F6" },
  { name: "OVO", kind: "ewallet", color: "#8B5CF6" },
  { name: "GoPay", kind: "ewallet", color: "#12B5A6" },
  { name: "ShopeePay", kind: "ewallet", color: "#FF7A1A" },
  { name: "Tunai", kind: "cash", color: "#2FB36B" },
];