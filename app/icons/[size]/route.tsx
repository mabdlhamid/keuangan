import { ImageResponse } from "next/og";

// Ikon aplikasi digambar lewat kode, jadi tidak perlu file gambar.
const SIZES: Record<string, number> = { "192": 192, "512": 512, maskable: 512 };

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export const dynamic = "force-static";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZES[size] ?? 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFC400",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -s * 0.18,
            right: -s * 0.18,
            width: s * 0.6,
            height: s * 0.6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
          }}
        />
        <div
          style={{
            width: s * 0.56,
            height: s * 0.42,
            background: "#181816",
            borderRadius: s * 0.09,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: s * 0.07,
          }}
        >
          <div
            style={{
              width: s * 0.12,
              height: s * 0.12,
              borderRadius: "50%",
              background: "#FFC400",
            }}
          />
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}