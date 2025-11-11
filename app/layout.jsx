import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingWidget from "@/components/FloatingWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TVET",
  description: "Ticket Support System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>

      {/* Floating support widget */}
      <FloatingWidget />
    </html>
  );
}
