"use client";

import { useState } from "react";
import {
  ACCOUNT_COLORS,
  ACCOUNT_KIND_EMOJI,
  ACCOUNT_KIND_LABEL,
  ACCOUNT_PRESETS,
} from "@/lib/categories";
import { formatDay, formatIDR, todayISO } from "@/lib/format";
import type { Account, AccountKind, Transfer } from "@/lib/types";

const nf = new Intl.NumberFormat("id-ID");

/* ---------- Baris rekening (dipakai di beranda dan tab Dompet) ---------- */

export function AccountRow({
  account,
  balance,
  hide,
  onClick,
}: {
  account: Account;
  balance: number;
  hide?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button className="tx" onClick={onClick}>
        <span className="tx-icon" style={{ background: `${account.color}26` }} aria-hidden>
          {ACCOUNT_KIND_EMOJI[account.kind]}
        </span>
        <span className="tx-main">
          <span className="tx-title">{account.name}</span>
          <span className="tx-meta">{ACCOUNT_KIND_LABEL[account.kind]}</span>
        </span>
        <span className={`tx-amt ${balance < 0 ? "expense" : ""}`}>
          {hide ? "Rp ••••" : formatIDR(balance)}
        </span>
      </button>
    </li>
  );
}

/** Transaksi lama yang belum punya rekening. Tidak ikut dihitung ke saldo. */
export function UnassignedRow({ count }: { count: number }) {
  return (
    <li>
      <div className="tx" style={{ cursor: "default" }}>
        <span className="tx-icon" style={{ background: "var(--surface-2)" }} aria-hidden>
          ❔
        </span>
        <span className="tx-main">
          <span className="tx-title">Belum ada rekening</span>
          <span className="tx-meta">
            {count} transaksi lama. Buka transaksinya dan pilih rekening agar ikut dihitung.
          </span>
        </span>
        <span className="tx-amt" style={{ color: "var(--muted)", fontWeight: 600, fontSize: 12.5 }}>
          Tidak dihitung
        </span>
      </div>
    </li>
  );
}

/* ---------- Form buat / ubah rekening ---------- */

export function AccountForm({
  editing,
  currentBalance,
  onSubmit,
  onDelete,
}: {
  editing: Account | null;
  currentBalance: number;
  onSubmit: (
    data: { name: string; kind: AccountKind; color: string; balance: number },
    id?: string
  ) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [kind, setKind] = useState<AccountKind>(editing?.kind ?? "bank");
  const [color, setColor] = useState(editing?.color ?? ACCOUNT_COLORS[0]);
  const [balance, setBalance] = useState(editing ? String(currentBalance) : "");
  const [error, setError] = useState("");

  const n = Number(balance);
  const display = balance === "-" ? "-" : balance && !Number.isNaN(n) ? (n < 0 ? "-" : "") + nf.format(Math.abs(n)) : "";

  function onBalanceChange(raw: string) {
    const neg = raw.trim().startsWith("-");
    const digits = raw.replace(/\D/g, "");
    setBalance(digits ? (neg ? "-" : "") + digits : neg ? "-" : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Beri nama rekening, misalnya BSI atau DANA.");
      return;
    }
    onSubmit({ name: name.trim(), kind, color, balance: Number(balance) || 0 }, editing?.id);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {!editing && (
        <div className="field-group">
          <span className="field-label">Pilih cepat</span>
          <div className="chips">
            {ACCOUNT_PRESETS.map((p) => (
              <button
                type="button"
                key={p.name}
                className={`chip ${name === p.name ? "on" : ""}`}
                onClick={() => {
                  setName(p.name);
                  setKind(p.kind);
                  setColor(p.color);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="field">
        <span className="field-label">Nama rekening</span>
        <input
          type="text"
          autoFocus={!editing}
          placeholder="Contoh: BSI Tabungan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={28}
        />
      </label>

      <div className="field-group">
        <span className="field-label">Jenis</span>
        <div className="chips">
          {(Object.keys(ACCOUNT_KIND_LABEL) as AccountKind[]).map((k) => (
            <button
              type="button"
              key={k}
              className={`chip ${kind === k ? "on" : ""}`}
              onClick={() => setKind(k)}
            >
              {ACCOUNT_KIND_EMOJI[k]} {ACCOUNT_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <span className="field-label">Warna</span>
        <div className="color-row">
          {ACCOUNT_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`color-btn ${color === c ? "on" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Warna ${c}`}
            />
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field-label">Saldo saat ini</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Rp 0"
          value={display}
          onChange={(e) => onBalanceChange(e.target.value)}
        />
      </label>
      <p className="hint">
        {editing
          ? "Mengubah angka ini hanya menyesuaikan saldo awal. Riwayat transaksimu tidak berubah."
          : "Isi sesuai saldo di aplikasi bank atau e-wallet sekarang. Setelah itu saldo berubah otomatis."}
      </p>

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn-main">
        {editing ? "Simpan perubahan" : "Tambah rekening"}
      </button>
      {editing && onDelete && (
        <button type="button" className="btn-ghost danger" onClick={() => onDelete(editing.id)}>
          Hapus rekening
        </button>
      )}
    </form>
  );
}

/* ---------- Form pindah saldo ---------- */

export function TransferForm({
  accounts,
  balances,
  onSubmit,
}: {
  accounts: Account[];
  balances: Record<string, number>;
  onSubmit: (data: Omit<Transfer, "id">) => void;
}) {
  const [from, setFrom] = useState(accounts[0].id);
  const [to, setTo] = useState((accounts[1] ?? accounts[0]).id);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const fromBalance = balances[from] ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (from === to) {
      setError("Pilih dua rekening yang berbeda.");
      return;
    }
    if (!value || value <= 0) {
      setError("Isi jumlah lebih dari nol.");
      return;
    }
    if (value > fromBalance) {
      setError(`Saldo rekening asal hanya ${formatIDR(Math.max(fromBalance, 0))}.`);
      return;
    }
    if (!date) {
      setError("Pilih tanggal.");
      return;
    }
    onSubmit({ from, to, amount: value, date, note: note.trim() });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="row">
        <label className="field">
          <span className="field-label">Dari</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Ke</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="amount-field">
        <span className="rp">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          autoFocus
          value={amount ? nf.format(Number(amount)) : ""}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          aria-label="Jumlah"
        />
      </label>
      <p className="hint">Saldo rekening asal: {formatIDR(fromBalance)}</p>

      <div className="row">
        <label className="field">
          <span className="field-label">Tanggal</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Catatan</span>
          <input
            type="text"
            placeholder="Opsional, mis. top up"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn-main">
        Pindahkan saldo
      </button>
    </form>
  );
}

/* ---------- Baris riwayat pindah saldo ---------- */

export function TransferRow({
  transfer,
  accounts,
  hide,
  onClick,
}: {
  transfer: Transfer;
  accounts: Account[];
  hide?: boolean;
  onClick: () => void;
}) {
  const name = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Rekening dihapus";
  return (
    <li>
      <button className="tx" onClick={onClick} aria-label="Hapus pindah saldo ini">
        <span className="tx-icon" style={{ background: "var(--surface-2)" }} aria-hidden>
          ⇄
        </span>
        <span className="tx-main">
          <span className="tx-title">
            {name(transfer.from)} → {name(transfer.to)}
          </span>
          <span className="tx-meta">
            {formatDay(transfer.date)}
            {transfer.note ? ` · ${transfer.note}` : ""}
          </span>
        </span>
        <span className="tx-amt">{hide ? "Rp ••••" : formatIDR(transfer.amount)}</span>
      </button>
    </li>
  );
}