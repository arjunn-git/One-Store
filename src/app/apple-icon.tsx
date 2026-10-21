import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080B10",
          borderRadius: "40px",
          border: "4px solid #243447",
        }}
      >
        <div
          style={{
            width: "130px",
            height: "130px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "32px",
            background: "#102A43",
            border: "2px solid #7DD3FC40",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="none" stroke="#7DD3FC" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 7v10" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M9.5 9.5L12 7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
