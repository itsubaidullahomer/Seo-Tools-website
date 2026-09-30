import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4f46e5", borderRadius: 40 }}>
        <svg width="120" height="120" viewBox="0 0 32 32">
          <path d="M9 11h14M9 16h9M9 21h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="22" cy="16" r="2" fill="#fff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
