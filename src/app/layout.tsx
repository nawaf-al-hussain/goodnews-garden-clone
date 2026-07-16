import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Good News Garden Visualization",
  description: "Interactive 3D network visualization of Good News Garden.",
  keywords:
    "good news, Indonesia, visualization, 3D, network, garden, d3, three.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
