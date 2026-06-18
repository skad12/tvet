import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingWidget from "@/components/FloatingWidget";
import AppToaster from "@/components/AppToaster";
import ThemeScript from "@/components/ThemeScript";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <AppToaster />
          <FloatingWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
