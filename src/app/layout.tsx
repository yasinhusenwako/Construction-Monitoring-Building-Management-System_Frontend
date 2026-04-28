import type { Metadata } from "next";

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
  return children;
}
