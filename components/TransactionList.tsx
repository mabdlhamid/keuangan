"use client";

import { colorFor, emojiFor } from "@/lib/categories";
import { formatDay, formatIDR } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface Props {
  items: Transaction[];
  onSelect: (t: Transaction) => void;
  grouped?: boolean;
  hide?: boolean;
  emptyText?: string;
}

function Row({ t, onSelect, hide }: { t: Transaction; onSelect: (t: Transaction) => void; hide?: boolean }) {
  const isIn = t.type === "income";
  const tint = isIn ? "#0E9F6E" : colorFor(t.category);
  return (
    <li>
      <button className="tx" onClick={() => onSelect(t)}>
        <span className="tx-icon" style={{ background: `${tint}22` }} aria-hidden>
          {emojiFor(t.category)}
        </span>
        <span className="tx-main">
          <span className="tx-title">{t.note || t.category}</span>
          <span className="tx-meta">{t.category}</span>
        </span>
        <span className={`tx-amt ${isIn ? "income" : ""}`}>
          {hide ? "Rp ••••" : `${isIn ? "+" : "−"}${formatIDR(t.amount)}`}
        </span>
      </button>
    </li>
  );
}

export default function TransactionList({ items, onSelect, grouped, hide, emptyText }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji" aria-hidden>🧾</div>
        <p>{emptyText ?? "Belum ada transaksi."}</p>
      </div>
    );
  }

  if (!grouped) {
    return (
      <ul className="tx-list card-flat">
        {items.map((t) => (
          <Row key={t.id} t={t} onSelect={onSelect} hide={hide} />
        ))}
      </ul>
    );
  }

  const groups: { date: string; rows: Transaction[] }[] = [];
  for (const t of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.rows.push(t);
    else groups.push({ date: t.date, rows: [t] });
  }

  return (
    <div className="tx-groups">
      {groups.map((g) => {
        const net = g.rows.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
        return (
          <section key={g.date}>
            <div className="group-head">
              <span>{formatDay(g.date)}</span>
              <span>{net >= 0 ? "+" : "−"}{formatIDR(Math.abs(net))}</span>
            </div>
            <ul className="tx-list card-flat">
              {g.rows.map((t) => (
                <Row key={t.id} t={t} onSelect={onSelect} hide={hide} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
