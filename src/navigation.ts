import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'am'] as const;
export const localePrefix = 'as-needed'; // Don't add /en prefix for default locale

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });
