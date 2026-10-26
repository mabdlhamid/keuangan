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
