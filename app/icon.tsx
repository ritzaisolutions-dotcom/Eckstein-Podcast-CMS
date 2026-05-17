import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5eed8",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,2 30,16 16,30 2,16" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
          <polygon points="16,7 25,16 16,25 7,16" fill="#05101f" />
          <line x1="12" y1="12" x2="12" y2="20" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="12" x2="19" y2="12" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="16" x2="18" y2="16" stroke="#c9a84c" strokeWidth="1.25" strokeLinecap="round" />
          <line x1="12" y1="20" x2="19" y2="20" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
