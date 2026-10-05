import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANTH 5A Classroom Word Cloud",
  description: "An anonymous classroom word cloud exploring what is a tool.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

