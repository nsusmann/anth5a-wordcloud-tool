import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANTH 5A Classroom Word Clouds",
  description: "Two anonymous classroom word clouds exploring what is and is not a tool.",
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
