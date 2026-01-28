import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

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
      <body
        className={`${spaceGrotesk.className} min-h-screen text-neutral-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
