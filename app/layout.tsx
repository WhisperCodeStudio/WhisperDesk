import type { Metadata } from "next";
import { Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-body",
});

const balthazar = localFont({
  src: "../public/fonts/Balthazar-Regular.ttf",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "WhisperDesk",
  description: "Founder Command Centre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${balthazar.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
