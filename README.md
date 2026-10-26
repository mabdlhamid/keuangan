# Keuangan Pribadi

Aplikasi pencatat keuangan pribadi berbasis **Next.js (App Router) + TypeScript**.
Data disimpan di `localStorage` browser, jadi tidak perlu database maupun akun.

## Fitur

- Catat pemasukan & pengeluaran (jumlah, kategori, tanggal, catatan)
- Ubah / hapus transaksi, cari, dan filter berdasarkan jenis
- Ringkasan bulanan: saldo total, pemasukan, pengeluaran, selisih
- Grafik donat pengeluaran per kategori dan tren 6 bulan
- Anggaran per kategori dengan indikator progres (kuning ≥ 80%, merah bila melebihi)
- Ekspor CSV (bisa dibuka di Excel), backup/impor JSON
- Mode gelap otomatis mengikuti pengaturan sistem, tampilan responsif

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
```

Build produksi:

```bash
npm run build
npm start
```

## Struktur

```
app/          halaman & layout (page.tsx memegang state utama)
components/   form, daftar transaksi, grafik, panel anggaran
lib/          tipe, kategori, format IDR/tanggal, localStorage, ekspor/impor
```

## Catatan

- Data hanya tersimpan di browser/perangkat yang dipakai. Gunakan **Backup JSON** untuk memindahkan data antar perangkat.
- Kategori dapat diubah di `lib/categories.ts`.
