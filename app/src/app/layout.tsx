import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemedProviders from "@/components/ThemedProviders";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ui/theme-provider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wisk",
  description:
    "Trustless background verification with DigiLocker + SNARK proofs — secure, private & employer-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemedProviders>
            <Header />
            <main className="pt-16">{children}</main>
            <Footer />
          </ThemedProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
