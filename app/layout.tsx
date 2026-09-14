import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Shape of Threat | Reading Attacking Patterns Through xT",
  description:
    "An illustrated soccer research article for the UIUC women's soccer coaching staff, explaining expected threat and k-means tactical clustering.",
  authors: [{ name: "Liuhy" }],
  openGraph: {
    title: "The Shape of Threat",
    description: "Reading attacking patterns through xT and tactical clustering.",
    type: "article",
    images: [{ url: "/assets/clusters-created.png", width: 1200, height: 621 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123c35",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
