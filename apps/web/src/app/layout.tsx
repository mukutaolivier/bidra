import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";

export const metadata: Metadata = {
  title: "Bidra",
  description: "Norwegian community contribution platform",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="no">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}