import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CMS Блог",
  description: "Современная CMS система для блогов с поддержкой markdown и кастомных эмодзи",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <SiteSettingsProvider>
            {children}
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
