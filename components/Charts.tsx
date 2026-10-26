"use client";

import { formatCompact, formatIDR } from "@/lib/format";

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji" aria-hidden>🍩</div>
        <p>Belum ada pengeluaran di bulan ini.</p>
      </div>
    );
  }

  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Pengeluaran per kategori">
        <g transform="rotate(-90 80 80)">
          {data.map((d) => {
            const len = (d.value / total) * c;
            const gap = data.length > 1 ? 2 : 0;
            const el = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth="24"
                strokeDasharray={`${Math.max(len - gap, 0)} ${c - Math.max(len - gap, 0)}`}
                strokeDashoffset={-offset}
              >
                <title>{`${d.label}: ${formatIDR(d.value)}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="11" fill="var(--muted)">
          Keluar
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--ink)">
          {formatCompact(total)}
        </text>
      </svg>
      <ul className="legend">
        {data.map((d) => (
          <li key={d.label}>
            <span className="swatch" style={{ background: d.color }} />
            <span className="name">{d.label}</span>
            <span className="pct">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface BarPoint {
  label: string;
  income: number;
  expense: number;
}

export function TrendChart({ data }: { data: BarPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const W = 420;
  const H = 180;
  const padTop = 10;
  const padBottom = 24;
  const chartH = H - padTop - padBottom;
  const groupW = W / data.length;
  const barW = Math.min(20, groupW / 3);
  const y = (v: number) => padTop + chartH - (v / max) * chartH;

  return (
    <div>
      <svg className="bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tren pemasukan dan pengeluaran">
        <line x1="0" x2={W} y1={padTop + chartH} y2={padTop + chartH} stroke="var(--line)" />
        {data.map((d, i) => {
          const cx = groupW * i + groupW / 2;
          return (
            <g key={d.label}>
              <rect
                x={cx - barW - 1}
                y={y(d.income)}
                width={barW}
                height={Math.max(padTop + chartH - y(d.income), 0)}
                rx="5"
                fill="var(--income)"
              >
                <title>{`${d.label} · Pemasukan ${formatIDR(d.income)}`}</title>
              </rect>
              <rect
                x={cx + 1}
                y={y(d.expense)}
                width={barW}
                height={Math.max(padTop + chartH - y(d.expense), 0)}
                rx="5"
                fill="var(--brand-deep)"
              >
                <title>{`${d.label} · Pengeluaran ${formatIDR(d.expense)}`}</title>
              </rect>
              <text x={cx} y={H - 7} textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span><i style={{ background: "var(--income)" }} />Pemasukan</span>
        <span><i style={{ background: "var(--brand-deep)" }} />Pengeluaran</span>
      </div>
    </div>
  );
}
