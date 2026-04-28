"use client";

/**
 * Root page - redirects to login
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/login`);
  }, [router, locale]);

  return null;
}
