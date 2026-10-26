"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, emojiFor } from "@/lib/categories";
import { formatIDR } from "@/lib/format";
import type { Budgets } from "@/lib/types";

interface Props {
  budgets: Budgets;
  spent: Record<string, number>;
  onChange: (category: string, amount: number) => void;
}

export default function BudgetPanel({ budgets, spent, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(cat: string) {
    setEditing(cat);
    setDraft(budgets[cat] ? String(budgets[cat]) : "");
  }

  function save(cat: string) {
    onChange(cat, Number(draft) || 0);
    setEditing(null);
  }

  return (
    <ul className="budget">
      {EXPENSE_CATEGORIES.map((cat) => {
        const limit = budgets[cat] ?? 0;
        const used = spent[cat] ?? 0;
        const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
        const cls = limit > 0 && used > limit ? "over" : pct >= 80 ? "warn" : "";

        return (
          <li className="budget-item" key={cat}>
            <div className="budget-head">
              <span className="budget-cat">
                <span aria-hidden>{emojiFor(cat)}</span> {cat}
              </span>
              <span className="budget-nums">
                {formatIDR(used)}
                {limit > 0 ? ` dari ${formatIDR(limit)}` : ""}
              </span>
            </div>

            {limit > 0 && (
              <div
                className="bar"
                role="progressbar"
                aria-label={`Anggaran ${cat}`}
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i className={cls} style={{ width: `${pct}%` }} />
              </div>
            )}

            {editing === cat ? (
              <div className="inline-edit">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="Batas per bulan"
                  value={draft ? new Intl.NumberFormat("id-ID").format(Number(draft)) : ""}
                  onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && save(cat)}
                />
                <button className="pill primary" onClick={() => save(cat)}>
                  Simpan
                </button>
                <button className="pill" onClick={() => setEditing(null)}>
                  Batal
                </button>
              </div>
            ) : (
              <div className="inline-edit">
                <button className="pill" onClick={() => startEdit(cat)}>
                  {limit > 0 ? "Ubah batas" : "Atur batas"}
                </button>
                {limit > 0 && used > limit && (
                  <span className="over-text">Lebih {formatIDR(used - limit)}</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
