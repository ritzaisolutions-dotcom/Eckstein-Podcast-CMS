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
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
          {/* Outer diamond — gold border */}
          <polygon points="50,4 96,50 50,96 4,50" stroke="#c9a84c" strokeWidth="4" fill="#f5eed8" />
          {/* Inner diamond — navy fill */}
          <polygon points="50,18 82,50 50,82 18,50" fill="#05101f" />
          {/* E letterform in gold — serif style, centered in inner diamond */}
          <line x1="38" y1="36" x2="38" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt" />
          <line x1="38" y1="36" x2="63" y2="36" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt" />
          <line x1="38" y1="50" x2="60" y2="50" stroke="#c9a84c" strokeWidth="4" strokeLinecap="butt" />
          <line x1="38" y1="64" x2="63" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
