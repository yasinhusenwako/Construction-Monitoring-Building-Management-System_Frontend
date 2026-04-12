import type { Metadata } from "next";
import { Providers } from "./providers";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "INSA Construction Monitoring and Building Management System",
  description:
    "Construction Monitoring and Building Management System for INSA Ethiopia.",
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
