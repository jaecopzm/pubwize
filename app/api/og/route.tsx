import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Pubwize Blog";
  const tag = searchParams.get("tag") || "";
  const rt = searchParams.get("rt") || "";

  const fontSize = title.length > 60 ? 52 : title.length > 40 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f0f14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Gradient blobs */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.2) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(34,211,238,0.12) 0%, transparent 45%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: "80px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Badge row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.35)",
                borderRadius: 8,
                padding: "6px 16px",
                color: "#818cf8",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              Pubwize Blog
            </div>
            {tag && (
              <div
                style={{
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: "#22d3ee",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {tag}
              </div>
            )}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize,
              fontWeight: 900,
              color: "#f8fafc",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Reading time */}
          {rt && (
            <div style={{ marginTop: 28, color: "#64748b", fontSize: 20, display: "flex" }}>
              {rt}
            </div>
          )}

          {/* Domain */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              color: "#818cf8",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
            }}
          >
            pubwize.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
