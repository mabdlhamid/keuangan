"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import BudgetPanel from "@/components/BudgetPanel";
import { DonutChart, TrendChart, type BarPoint, type Slice } from "@/components/Charts";
import {
  IconBack,
  IconChart,
  IconChevron,
  IconDown,
  IconEye,
  IconEyeOff,
  IconHome,
  IconList,
  IconPlus,
  IconPocket,
  IconSettings,
  IconUp,
} from "@/components/Icons";
import { MoveForm, PocketForm, PocketMini, PocketRow } from "@/components/Pockets";
import Sheet from "@/components/Sheet";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { colorFor } from "@/lib/categories";
import { exportBackup, exportCSV, parseBackup } from "@/lib/exporters";
import {
  currentMonth,
  formatIDR,
  greeting,
  monthLabel,
  newId,
  shiftMonth,
} from "@/lib/format";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Budgets, Pocket, Transaction, TxType } from "@/lib/types";
import { useCloudState } from "@/lib/useCloudState";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Tab = "home" | "tx" | "pockets" | "stats";

type SheetState =
  | { kind: "tx"; editing: Transaction | null; type: TxType }
  | { kind: "pocket"; editing: Pocket | null }
  | { kind: "move"; pocketId: string; mode: "in" | "out" }
  | { kind: "settings" }
  | null;

const MASK = "Rp ••••••";

/* =====================================================================
 * Pintu masuk: cek sesi login. Tanpa kunci Supabase → mode lokal (tanpa login).
 * ===================================================================== */

export default function Page() {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null | undefined>(configured ? undefined : null);

  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  if (!configured) {
    return <App userId={null} email={null} onLogout={null} />;
  }
  if (session === undefined) return <div className="loading">Memuat…</div>;
  if (!session) return <AuthScreen />;

  return (
    <App
      key={session.user.id}
      userId={session.user.id}
      email={session.user.email ?? ""}
      onLogout={() => getSupabase().auth.signOut()}
    />
  );
}

/* =====================================================================
 * Aplikasi utama
 * ===================================================================== */

interface AppProps {
  userId: string | null;
  email: string | null;
  onLogout: (() => void) | null;
}

function App({ userId, email, onLogout }: AppProps) {
  const [transactions, setTransactions, txReady, txErr] = useCloudState<Transaction[]>(userId, "transactions", []);
  const [budgets, setBudgets, bReady, bErr] = useCloudState<Budgets>(userId, "budgets", {});
  const [pockets, setPockets, pReady, pErr] = useCloudState<Pocket[]>(userId, "pockets", []);
  const [hide, setHide] = useLocalStorage<boolean>("kp:hide", false); // preferensi tampilan, per perangkat

  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [month, setMonth] = useState(currentMonth());
  const [typeFilter, setTypeFilter] = useState<"all" | TxType>("all");
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = txReady && bReady && pReady;
  const loadError = txErr || bErr || pErr;

  useEffect(() => {
    const onErr = (e: Event) => setSaveError((e as CustomEvent<string>).detail || "Gagal menyimpan.");
    const onOk = () => setSaveError("");
    window.addEventListener("kp:save-error", onErr);
    window.addEventListener("kp:saved", onOk);
    return () => {
      window.removeEventListener("kp:save-error", onErr);
      window.removeEventListener("kp:saved", onOk);
    };
  }, []);

  /* ---------- Hitungan ---------- */

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month]
  );

  const { income, expense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of monthTx) {
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    }
    return { income: inc, expense: exp };
  }, [monthTx]);

  const pocketsTotal = useMemo(() => pockets.reduce((s, p) => s + p.balance, 0), [pockets]);

  // Saldo utama = semua pemasukan − semua pengeluaran − uang yang sudah disimpan di kantong
  const mainBalance = useMemo(() => {
    const cash = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    return cash - pocketsTotal;
  }, [transactions, pocketsTotal]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTx) {
      if (t.type === "expense") map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  }, [monthTx]);

  const slices: Slice[] = useMemo(
    () =>
      Object.entries(spentByCategory)
        .map(([label, value]) => ({ label, value, color: colorFor(label) }))
        .sort((a, b) => b.value - a.value),
    [spentByCategory]
  );

  const trend: BarPoint[] = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
    return months.map((m) => {
      let inc = 0;
      let exp = 0;
      for (const t of transactions) {
        if (!t.date.startsWith(m)) continue;
        if (t.type === "income") inc += t.amount;
        else exp += t.amount;
      }
      return { label: monthLabel(m, true), income: inc, expense: exp };
    });
  }, [transactions, month]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthTx
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => !q || t.note.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, typeFilter, query]);

  /* ---------- Aksi ---------- */

  const closeSheet = () => setSheet(null);

  function saveTx(data: Omit<Transaction, "id">, id?: string) {
    if (id) setTransactions((prev) => prev.map((t) => (t.id === id ? { ...data, id } : t)));
    else setTransactions((prev) => [{ ...data, id: newId() }, ...prev]);
    setMonth(data.date.slice(0, 7));
    closeSheet();
  }

  function deleteTx(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    closeSheet();
  }

  function savePocket(data: Omit<Pocket, "id" | "balance">, id?: string) {
    if (id) setPockets((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    else setPockets((prev) => [...prev, { ...data, id: newId(), balance: 0 }]);
    closeSheet();
  }

  function deletePocket(id: string) {
    setPockets((prev) => prev.filter((p) => p.id !== id));
    closeSheet();
  }

  function movePocket(id: string, delta: number) {
    setPockets((prev) => prev.map((p) => (p.id === id ? { ...p, balance: p.balance + delta } : p)));
    closeSheet();
  }

  function openMove(pocketId: string, mode: "in" | "out") {
    setSheet({ kind: "move", pocketId, mode });
  }

  function quickDeposit() {
    if (pockets.length === 0) setSheet({ kind: "pocket", editing: null });
    else openMove(pockets[0].id, "in");
  }

  function setBudget(category: string, amount: number) {
    setBudgets((prev) => {
      const next = { ...prev };
      if (amount > 0) next[category] = amount;
      else delete next[category];
      return next;
    });
  }

  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed) {
      alert("File backup tidak bisa dibaca. Pastikan file berasal dari menu Backup.");
      return;
    }
    if (!confirm(`Pulihkan ${parsed.transactions.length} transaksi dan ${parsed.pockets.length} kantong? Data saat ini akan diganti.`)) return;
    setTransactions(parsed.transactions);
    setBudgets(parsed.budgets);
    setPockets(parsed.pockets);
    closeSheet();
  }

  function resetAll() {
    if (!confirm("Hapus SEMUA data (transaksi, kantong, anggaran)? Ini tidak bisa dibatalkan.")) return;
    setTransactions([]);
    setBudgets({});
    setPockets([]);
    closeSheet();
  }

  if (loadError) {
    return (
      <div className="loading">
        <div style={{ maxWidth: 360, padding: 24, textAlign: "center", display: "grid", gap: 12 }}>
          <strong style={{ color: "var(--ink)", fontSize: 18 }}>Data belum bisa dimuat</strong>
          <span>{loadError}</span>
          <span style={{ fontSize: 13 }}>
            Jika pesan menyebut tabel <code>user_data</code> tidak ditemukan, jalankan file{" "}
            <code>supabase.sql</code> di SQL Editor Supabase.
          </span>
          <button className="btn-main" onClick={() => location.reload()}>
            Coba lagi
          </button>
          {onLogout && (
            <button className="btn-ghost" onClick={onLogout}>
              Keluar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!ready) return <div className="loading">Memuat…</div>;

  const money = (n: number) => (hide ? MASK : formatIDR(n));

  const MonthNav = (
    <div className="month-nav">
      <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Bulan sebelumnya">
        <IconBack />
      </button>
      <span className="label">{monthLabel(month)}</span>
      <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Bulan berikutnya">
        <IconChevron />
      </button>
    </div>
  );

  /* ---------- Layar ---------- */

  const home = (
    <div className="home-grid">
      <div className="home-left">
        <header className="hero">
          <div className="hero-top">
            <p className="hello">
              {greeting()}
              <strong>Atur uangmu hari ini</strong>
            </p>
            <div className="hero-actions">
              <button className="round-btn" onClick={() => setSheet({ kind: "settings" })} aria-label="Akun dan data">
                <IconSettings />
              </button>
            </div>
          </div>

          <div className="balance-label">
            Saldo utama
            <button className="eye" onClick={() => setHide(!hide)} aria-label={hide ? "Tampilkan saldo" : "Sembunyikan saldo"}>
              {hide ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          <div className={`balance ${!hide && mainBalance < 0 ? "neg" : ""}`}>
            {hide ? MASK : formatIDR(mainBalance)}
          </div>

          <div className="hero-split">
            <div className="mini-stat">
              <span><IconDown /> Masuk bulan ini</span>
              <b>{money(income)}</b>
            </div>
            <div className="mini-stat">
              <span><IconUp /> Keluar bulan ini</span>
              <b>{money(expense)}</b>
            </div>
          </div>
        </header>

        <div className="page" style={{ marginTop: 16 }}>
          <div className="quick">
            <button onClick={() => setSheet({ kind: "tx", editing: null, type: "income" })}>
              <span className="q-ico green"><IconDown /></span>
              Uang masuk
            </button>
            <button onClick={() => setSheet({ kind: "tx", editing: null, type: "expense" })}>
              <span className="q-ico red"><IconUp /></span>
              Uang keluar
            </button>
            <button onClick={quickDeposit}>
              <span className="q-ico"><IconPocket /></span>
              Setor kantong
            </button>
          </div>

          <section>
            <div className="section-head">
              <h2>Kantong</h2>
              {pockets.length > 0 && (
                <button className="link-btn" onClick={() => setTab("pockets")}>
                  Lihat semua <IconChevron />
                </button>
              )}
            </div>
            <div className="pocket-scroll">
              {pockets.map((p) => (
                <PocketMini key={p.id} pocket={p} hide={hide} onClick={() => openMove(p.id, "in")} />
              ))}
              <button className="pocket-mini add" onClick={() => setSheet({ kind: "pocket", editing: null })}>
                <span className="pocket-badge" aria-hidden>＋</span>
                Buat kantong
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="home-right page">
        <section>
          <div className="section-head">
            <h2>Transaksi terbaru</h2>
            {transactions.length > 0 && (
              <button className="link-btn" onClick={() => setTab("tx")}>
                Lihat semua <IconChevron />
              </button>
            )}
          </div>
          <TransactionList
            items={sorted.slice(0, 6)}
            hide={hide}
            onSelect={(t) => setSheet({ kind: "tx", editing: t, type: t.type })}
            emptyText="Belum ada catatan. Mulai dengan menambah uang masuk atau keluar."
          />
        </section>
      </div>
    </div>
  );

  const txTab = (
    <>
      <div className="page-head">
        <h1>Transaksi</h1>
      </div>
      <div className="page tx-page">
        {MonthNav}
        <div className="summary-strip">
          <div>
            <span>Masuk</span>
            <b className="income">{money(income)}</b>
          </div>
          <div>
            <span>Keluar</span>
            <b className="expense">{money(expense)}</b>
          </div>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Cari catatan atau kategori"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari transaksi"
        />
        <div className="filter-row">
          {(
            [
              ["all", "Semua"],
              ["income", "Masuk"],
              ["expense", "Keluar"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              className={`chip ${typeFilter === v ? "on" : ""}`}
              onClick={() => setTypeFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <TransactionList
          grouped
          hide={hide}
          items={filtered}
          onSelect={(t) => setSheet({ kind: "tx", editing: t, type: t.type })}
          emptyText={`Tidak ada transaksi di ${monthLabel(month)}.`}
        />
      </div>
    </>
  );

  const pocketsTab = (
    <>
      <div className="page-head">
        <h1>Kantong</h1>
        <button className="pill primary" onClick={() => setSheet({ kind: "pocket", editing: null })}>
          ＋ Kantong baru
        </button>
      </div>
      <div className="page">
        <div className="total-card">
          <span>Total di semua kantong</span>
          <b>{hide ? MASK : formatIDR(pocketsTotal)}</b>
          <small>Saldo utama: {money(mainBalance)}</small>
        </div>

        {pockets.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji" aria-hidden>🐷</div>
            <p>
              Pisahkan uang untuk tujuan tertentu, misalnya dana darurat, liburan, atau gadget baru.
            </p>
            <button className="btn-soft" onClick={() => setSheet({ kind: "pocket", editing: null })}>
              Buat kantong pertama
            </button>
          </div>
        ) : (
          <div className="pocket-list">
            {pockets.map((p) => (
              <PocketRow
                key={p.id}
                pocket={p}
                hide={hide}
                onDeposit={() => openMove(p.id, "in")}
                onWithdraw={() => openMove(p.id, "out")}
                onEdit={() => setSheet({ kind: "pocket", editing: p })}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  const statsTab = (
    <>
      <div className="page-head">
        <h1>Statistik</h1>
      </div>
      <div className="page stats-page">
        {MonthNav}
        <section className="panel">
          <h2>Ke mana uangmu pergi</h2>
          <DonutChart data={slices} />
        </section>
        <section className="panel">
          <h2>6 bulan terakhir</h2>
          <TrendChart data={trend} />
        </section>
        <section className="panel">
          <h2>Anggaran bulanan</h2>
          <BudgetPanel budgets={budgets} spent={spentByCategory} onChange={setBudget} />
        </section>
      </div>
    </>
  );

  /* ---------- Sheet ---------- */

  const sheetTitle =
    sheet?.kind === "tx"
      ? sheet.editing
        ? "Ubah transaksi"
        : sheet.type === "income"
        ? "Uang masuk"
        : "Uang keluar"
      : sheet?.kind === "pocket"
      ? sheet.editing
        ? "Ubah kantong"
        : "Kantong baru"
      : sheet?.kind === "move"
      ? "Pindahkan uang"
      : "Akun dan data";

  return (
    <div className="app">
      {saveError && (
        <div className="toast" role="alert">
          Gagal menyimpan ke server: {saveError}
        </div>
      )}

      <main className="content">
        {tab === "home" && home}
        {tab === "tx" && txTab}
        {tab === "pockets" && pocketsTab}
        {tab === "stats" && statsTab}
      </main>

      <nav className="nav" aria-label="Menu utama">
        <div className="nav-brand">Keuangan Pribadi</div>
        <button className={`nav-item ${tab === "home" ? "on" : ""}`} onClick={() => setTab("home")}>
          <span className="ico"><IconHome /></span>
          Beranda
        </button>
        <button className={`nav-item ${tab === "tx" ? "on" : ""}`} onClick={() => setTab("tx")}>
          <span className="ico"><IconList /></span>
          Transaksi
        </button>
        <button
          className="fab"
          onClick={() => setSheet({ kind: "tx", editing: null, type: "expense" })}
          aria-label="Catat transaksi"
        >
          <IconPlus />
          <span className="fab-label">Catat transaksi</span>
        </button>
        <button className={`nav-item ${tab === "pockets" ? "on" : ""}`} onClick={() => setTab("pockets")}>
          <span className="ico"><IconPocket /></span>
          Kantong
        </button>
        <button className={`nav-item ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")}>
          <span className="ico"><IconChart /></span>
          Statistik
        </button>
        <button className="nav-item nav-settings" onClick={() => setSheet({ kind: "settings" })}>
          <span className="ico"><IconSettings /></span>
          Akun dan data
        </button>
      </nav>

      <Sheet open={sheet !== null} title={sheetTitle} onClose={closeSheet}>
        {sheet?.kind === "tx" && (
          <TransactionForm
            editing={sheet.editing}
            initialType={sheet.type}
            onSubmit={saveTx}
            onDelete={deleteTx}
          />
        )}
        {sheet?.kind === "pocket" && (
          <PocketForm editing={sheet.editing} onSubmit={savePocket} onDelete={deletePocket} />
        )}
        {sheet?.kind === "move" && pockets.length > 0 && (
          <MoveForm
            pockets={pockets}
            initialId={sheet.pocketId}
            initialMode={sheet.mode}
            mainBalance={mainBalance}
            onSubmit={movePocket}
          />
        )}
        {sheet?.kind === "settings" && (
          <div className="settings-list">
            <div className="account-box">
              {email ? (
                <>
                  <span>Masuk sebagai</span>
                  <b>{email}</b>
                </>
              ) : (
                <>
                  <span>Mode lokal</span>
                  <b>Belum ada login. Data hanya di browser ini.</b>
                </>
              )}
            </div>
            <button className="btn-soft" onClick={() => exportCSV(transactions)} disabled={transactions.length === 0}>
              Ekspor transaksi (CSV untuk Excel)
            </button>
            <button className="btn-soft" onClick={() => exportBackup(transactions, budgets, pockets)}>
              Simpan backup (JSON)
            </button>
            <button className="btn-soft" onClick={() => fileRef.current?.click()}>
              Pulihkan dari backup
            </button>
            <button className="btn-soft danger" onClick={resetAll}>
              Hapus semua data
            </button>
            {onLogout && (
              <button className="btn-main" onClick={onLogout}>
                Keluar dari akun
              </button>
            )}
            <p className="settings-note">
              {email
                ? "Data tersimpan di akun Anda, jadi sama di semua perangkat. Backup tetap berguna sebagai salinan cadangan."
                : "Simpan backup berkala supaya data aman saat cache browser dibersihkan."}
            </p>
          </div>
        )}
      </Sheet>

      <input ref={fileRef} type="file" accept="application/json" hidden onChange={importBackup} />
    </div>
  );
}