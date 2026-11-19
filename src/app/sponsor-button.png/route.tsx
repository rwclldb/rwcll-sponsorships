import { ImageResponse } from "next/og";

/**
 * A "Become a Sponsor" button image for the league website, which strips iframes, scripts and
 * often styling, but keeps plain links and images. Drawn at 2x (640×128) for sharp display at 320×64.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2eaf4a",
          borderRadius: 24,
          color: "white",
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        Become a Sponsor →
      </div>
    ),
    {
      width: 640,
      height: 128,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
