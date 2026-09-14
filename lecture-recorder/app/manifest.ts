import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "講義レコーダー — Lecture Recorder",
    short_name: "講義レコーダー",
    description:
      "Record Japanese lectures with live JA/EN transcription, summary and main points.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6f4",
    theme_color: "#4f46e5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
