import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat Map",
  description: "A Beautiful Universe of Knowledge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
