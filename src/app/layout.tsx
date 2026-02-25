import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CES MBR Portal — Monthly Business Review",
  description: "Customer Excellence Services — Business Intelligence Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
