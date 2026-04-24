import type { Metadata } from "next";
import { Providers } from "./providers";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "INSA Construction Supervision and Building Management System",
  description:
    "Construction Supervision and Building Management System for INSA Ethiopia.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
