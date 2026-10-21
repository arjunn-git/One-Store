import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "8px",
          border: "1.5px solid #243447",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            background: "#102A43",
          }}
        >
          <svg
            width="16"
            height="16"
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
