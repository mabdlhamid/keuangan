"use client";

import { useState } from "react";
import {
  ACCOUNT_KIND_EMOJI,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  emojiFor,
} from "@/lib/categories";
import { todayISO } from "@/lib/format";
import type { Account, Transaction, TxType } from "@/lib/types";

interface Props {
  editing: Transaction | null;
  initialType: TxType;
  accounts: Account[];
  defaultAccountId?: string;
  onSubmit: (data: Omit<Transaction, "id">, id?: string) => void;
  onDelete?: (id: string) => void;
}

export default function TransactionForm({
  editing,
  initialType,
  accounts,
  defaultAccountId,
  onSubmit,
  onDelete,
}: Props) {
  const [type, setType] = useState<TxType>(editing?.type ?? initialType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(
    editing?.category ?? (initialType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
  );
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [note, setNote] = useState(editing?.note ?? "");
  const [accountId, setAccountId] = useState<string | undefined>(() => {
    if (editing) return accounts.some((a) => a.id === editing.accountId) ? editing.accountId : undefined;
    if (defaultAccountId && accounts.some((a) => a.id === defaultAccountId)) return defaultAccountId;
    return accounts[0]?.id;
  });
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function changeType(next: TxType) {
    setType(next);
    setCategory((next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Isi jumlah lebih dari nol.");
      return;
    }
    if (accounts.length > 0 && !accountId) {
      setError("Pilih rekening untuk transaksi ini.");
      return;
    }
    if (!date) {
      setError("Pilih tanggal transaksi.");
      return;
    }
    onSubmit(
      {
        type,
        amount: value,
        category,
        date,
        note: note.trim(),
        ...(accountId ? { accountId } : {}),
      },
      editing?.id
    );
  }

  const display = amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : "";

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="seg" role="group" aria-label="Jenis transaksi">
        <button
          type="button"
          className={`${type === "expense" ? "active out" : ""}`}
          onClick={() => changeType("expense")}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          className={`${type === "income" ? "active in" : ""}`}
          onClick={() => changeType("income")}
        >
          Pemasukan
        </button>
      </div>

      <label className="amount-field">
        <span className="rp">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          autoFocus={!editing}
          value={display}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          aria-label="Jumlah"
        />
      </label>

      {accounts.length > 0 && (
        <div className="field-group">
          <span className="field-label">{type === "income" ? "Masuk ke rekening" : "Dibayar dari rekening"}</span>
          <div className="chips">
            {accounts.map((a) => (
              <button
                type="button"
                key={a.id}
                className={`chip ${accountId === a.id ? "on" : ""}`}
                onClick={() => setAccountId(a.id)}
              >
                <span aria-hidden>{ACCOUNT_KIND_EMOJI[a.kind]}</span> {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field-group">
        <span className="field-label">Kategori</span>
        <div className="chips">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={`chip ${category === c ? "on" : ""}`}
              onClick={() => setCategory(c)}
            >
              <span aria-hidden>{emojiFor(c)}</span> {c}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="field">
          <span className="field-label">Tanggal</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Catatan</span>
          <input
            type="text"
            placeholder="Opsional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn-main">
        {editing ? "Simpan perubahan" : type === "income" ? "Catat pemasukan" : "Catat pengeluaran"}
      </button>
      {editing && onDelete && (
        <button
          type="button"
          className="btn-ghost danger"
          onClick={() => {
            if (confirm("Hapus transaksi ini?")) onDelete(editing.id);
          }}
        >
          Hapus transaksi
        </button>
      )}
    </form>
  );
}