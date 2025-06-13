import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme";
import { TempoInit } from "./tempo-init";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dividend Investment AI",
  description: "AI-powered dividend ETF and stock research platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <TempoInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
