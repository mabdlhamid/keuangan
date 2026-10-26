"use client";

import { useState } from "react";
import { POCKET_COLORS, POCKET_EMOJIS } from "@/lib/categories";
import { formatIDR } from "@/lib/format";
import type { Pocket } from "@/lib/types";

/* ---------- Kartu kecil untuk beranda ---------- */

export function PocketMini({
  pocket,
  hide,
  onClick,
}: {
  pocket: Pocket;
  hide?: boolean;
  onClick: () => void;
}) {
  const pct = pocket.target > 0 ? Math.min(100, (pocket.balance / pocket.target) * 100) : 0;
  return (
    <button className="pocket-mini" onClick={onClick} style={{ ["--pc" as string]: pocket.color }}>
      <span className="pocket-badge" aria-hidden>{pocket.emoji}</span>
      <span className="pocket-name">{pocket.name}</span>
      <span className="pocket-amt">{hide ? "Rp ••••" : formatIDR(pocket.balance)}</span>
      {pocket.target > 0 && (
        <span className="bar thin" aria-hidden>
          <i style={{ width: `${pct}%`, background: pocket.color }} />
        </span>
      )}
    </button>
  );
}

/* ---------- Baris lengkap untuk tab Kantong ---------- */

export function PocketRow({
  pocket,
  hide,
  onDeposit,
  onWithdraw,
  onEdit,
}: {
  pocket: Pocket;
  hide?: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
  onEdit: () => void;
}) {
  const pct = pocket.target > 0 ? Math.min(100, (pocket.balance / pocket.target) * 100) : 0;
  const done = pocket.target > 0 && pocket.balance >= pocket.target;

  return (
    <article className="pocket-row" style={{ ["--pc" as string]: pocket.color }}>
      <div className="pocket-top">
        <span className="pocket-badge big" aria-hidden>{pocket.emoji}</span>
        <div className="pocket-id">
          <h3>{pocket.name}</h3>
          <p>
            {pocket.target > 0
              ? done
                ? "Target tercapai 🎉"
                : `${Math.round(pct)}% dari ${hide ? "Rp ••••" : formatIDR(pocket.target)}`
              : "Tanpa target"}
          </p>
        </div>
        <button className="pill" onClick={onEdit}>Ubah</button>
      </div>

      <div className="pocket-balance">{hide ? "Rp ••••••" : formatIDR(pocket.balance)}</div>

      {pocket.target > 0 && (
        <div className="bar" role="progressbar" aria-label={`Progres ${pocket.name}`} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%`, background: pocket.color }} />
        </div>
      )}

      <div className="pocket-actions">
        <button className="btn-soft" onClick={onDeposit}>Setor</button>
        <button className="btn-soft" onClick={onWithdraw} disabled={pocket.balance <= 0}>
          Tarik
        </button>
      </div>
    </article>
  );
}

/* ---------- Form buat / ubah kantong ---------- */

export function PocketForm({
  editing,
  onSubmit,
  onDelete,
}: {
  editing: Pocket | null;
  onSubmit: (data: Omit<Pocket, "id" | "balance">, id?: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? POCKET_EMOJIS[0]);
  const [color, setColor] = useState(editing?.color ?? POCKET_COLORS[0]);
  const [target, setTarget] = useState(editing?.target ? String(editing.target) : "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Beri nama kantong, misalnya “Liburan Bali”.");
      return;
    }
    onSubmit({ name: name.trim(), emoji, color, target: Number(target) || 0 }, editing?.id);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="pocket-preview" style={{ ["--pc" as string]: color }}>
        <span className="pocket-badge big" aria-hidden>{emoji}</span>
        <strong>{name.trim() || "Kantong baru"}</strong>
      </div>

      <label className="field">
        <span className="field-label">Nama kantong</span>
        <input
          type="text"
          autoFocus={!editing}
          placeholder="Contoh: Dana darurat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={28}
        />
      </label>

      <div className="field-group">
        <span className="field-label">Ikon</span>
        <div className="emoji-grid">
          {POCKET_EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              className={`emoji-btn ${emoji === e ? "on" : ""}`}
              onClick={() => setEmoji(e)}
              aria-label={`Ikon ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <span className="field-label">Warna</span>
        <div className="color-row">
          {POCKET_COLORS.map((c) => (
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
        <span className="field-label">Target (opsional)</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Rp 0"
          value={target ? new Intl.NumberFormat("id-ID").format(Number(target)) : ""}
          onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
        />
      </label>

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn-main">
        {editing ? "Simpan perubahan" : "Buat kantong"}
      </button>
      {editing && onDelete && (
        <button
          type="button"
          className="btn-ghost danger"
          onClick={() => {
            const msg =
              editing.balance > 0
                ? `Hapus kantong ini? Saldo ${formatIDR(editing.balance)} akan kembali ke saldo utama.`
                : "Hapus kantong ini?";
            if (confirm(msg)) onDelete(editing.id);
          }}
        >
          Hapus kantong
        </button>
      )}
    </form>
  );
}

/* ---------- Form setor / tarik ---------- */

const QUICK = [50_000, 100_000, 500_000, 1_000_000];

export function MoveForm({
  pockets,
  initialId,
  initialMode,
  mainBalance,
  onSubmit,
}: {
  pockets: Pocket[];
  initialId: string;
  initialMode: "in" | "out";
  mainBalance: number;
  onSubmit: (pocketId: string, delta: number) => void;
}) {
  const [id, setId] = useState(initialId);
  const [mode, setMode] = useState<"in" | "out">(initialMode);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const pocket = pockets.find((p) => p.id === id) ?? pockets[0];
  const available = mode === "in" ? mainBalance : pocket.balance;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Isi jumlah lebih dari nol.");
      return;
    }
    if (value > available) {
      setError(
        mode === "in"
          ? `Saldo utama hanya ${formatIDR(Math.max(available, 0))}.`
          : `Isi kantong hanya ${formatIDR(available)}.`
      );
      return;
    }
    onSubmit(pocket.id, mode === "in" ? value : -value);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="seg" role="group" aria-label="Setor atau tarik">
        <button type="button" className={mode === "in" ? "active" : ""} onClick={() => setMode("in")}>
          Setor
        </button>
        <button type="button" className={mode === "out" ? "active" : ""} onClick={() => setMode("out")}>
          Tarik
        </button>
      </div>

      <label className="field">
        <span className="field-label">Kantong</span>
        <select value={pocket.id} onChange={(e) => setId(e.target.value)}>
          {pockets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="amount-field">
        <span className="rp">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          autoFocus
          value={amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : ""}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          aria-label="Jumlah"
        />
      </label>

      <div className="chips">
        {QUICK.map((q) => (
          <button type="button" key={q} className="chip" onClick={() => setAmount(String(q))}>
            {new Intl.NumberFormat("id-ID").format(q / 1000)}rb
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => setAmount(String(Math.max(available, 0)))}
        >
          Semua
        </button>
      </div>

      <p className="hint">
        {mode === "in"
          ? `Tersedia di saldo utama: ${formatIDR(Math.max(mainBalance, 0))}`
          : `Tersedia di kantong: ${formatIDR(pocket.balance)}`}
      </p>

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn-main">
        {mode === "in" ? "Setor ke kantong" : "Tarik ke saldo utama"}
      </button>
    </form>
  );
}
