# 🌍 next-intl Migration Guide

## ✅ What's Been Done

1. ✅ Installed `next-intl`
2. ✅ Created `src/i18n.ts` configuration
3. ✅ Updated `next.config.mjs` with next-intl plugin
4. ✅ Updated `middleware.ts` to handle locales + auth
5. ✅ Created `[locale]` layout structure
6. ✅ Updated `LanguageContext` to work with next-intl
7. ✅ Updated `LanguageToggle` component

## 🚧 What Needs to Be Done

### Step 1: Move All Route Folders to [locale]

You need to move these folders from `src/app/` to `src/app/[locale]/`:

```
src/app/
  ├── [locale]/          ← NEW
  │   ├── layout.tsx     ← DONE
  │   ├── page.tsx       ← DONE
  │   ├── login/         ← MOVE HERE
  │   ├── register/      ← MOVE HERE
  │   ├── forgot-password/ ← MOVE HERE
  │   ├── dashboard/     ← MOVE HERE
  │   └── admin/         ← MOVE HERE
  ├── api/               ← KEEP (don't move API routes)
  ├── layout.tsx         ← KEEP (root layout)
  └── providers.tsx      ← KEEP
```

**Commands to run:**
```bash
cd src/app
mv login [locale]/
mv register [locale]/
mv forgot-password [locale]/
mv dashboard [locale]/
mv admin [locale]/
```

### Step 2: Update Component Imports

Replace the old `useLanguage` hook with `useTranslations` from next-intl:

**Before:**
```typescript
import { useLanguage } from '@/context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('auth.login')}</h1>;
}
```

**After:**
```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('auth');
  return <h1>{t('login')}</h1>;
}
```

**Note:** The key structure changes:
- Old: `t('auth.login')` - full path
- New: `t('login')` - namespace is in useTranslations('auth')

### Step 3: Update Navigation Links

All links need to include the locale:

**Before:**
```typescript
<Link href="/dashboard">Dashboard</Link>
```

**After:**
```typescript
import { Link } from '@/navigation';
<Link href="/dashboard">Dashboard</Link>
```

First, create `src/navigation.ts`:
```typescript
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'am'] as const;
export const localePrefix = 'as-needed';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });
```

### Step 4: Update Router Usage

**Before:**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

**After:**
```typescript
import { useRouter } from '@/navigation';

const router = useRouter();
router.push('/dashboard'); // Automatically adds locale
```

### Step 5: Update Translation Keys in JSON

Your JSON files are already structured correctly! No changes needed.

### Step 6: Test the Migration

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000` - should redirect to `/login`
3. Visit `http://localhost:3000/am` - should redirect to `/am/login`
4. Test language toggle - should switch between `/en/...` and `/am/...`
5. Test all navigation links
6. Test authentication flow

## 📝 Component Migration Examples

### Example 1: AuthPage

**Before:**
```typescript
import { useLanguage } from "@/context/LanguageContext";

export function AuthPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t("auth.welcomeBack")}</h1>
      <button>{t("auth.login")}</button>
    </div>
  );
}
```

**After:**
```typescript
import { useTranslations } from 'next-intl';

export function AuthPage() {
  const t = useTranslations('auth');
  
  return (
    <div>
      <h1>{t("welcomeBack")}</h1>
      <button>{t("login")}</button>
    </div>
  );
}
```

### Example 2: Dashboard with Multiple Namespaces

**Before:**
```typescript
const { t } = useLanguage();

<h1>{t("dashboard.welcome")}</h1>
<p>{t("status.pending")}</p>
<button>{t("action.save")}</button>
```

**After:**
```typescript
const tDashboard = useTranslations('dashboard');
const tStatus = useTranslations('status');
const tAction = useTranslations('action');

<h1>{tDashboard("welcome")}</h1>
<p>{tStatus("pending")}</p>
<button>{tAction("save")}</button>
```

### Example 3: Navigation with Links

**Before:**
```typescript
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const { t } = useLanguage();

<Link href="/dashboard">{t("nav.dashboard")}</Link>
```

**After:**
```typescript
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

const t = useTranslations('nav');

<Link href="/dashboard">{t("dashboard")}</Link>
```

## 🎯 Benefits After Migration

1. ✅ **URL-based localization**: `/en/dashboard` vs `/am/dashboard`
2. ✅ **Better SEO**: Search engines can index different language versions
3. ✅ **Server-side rendering**: Translations work on server components
4. ✅ **Type safety**: TypeScript support for translation keys
5. ✅ **Better performance**: Automatic code splitting per locale
6. ✅ **Pluralization**: Built-in support for plural forms
7. ✅ **Date/Number formatting**: Locale-aware formatting

## 🔧 Troubleshooting

### Issue: "Cannot find module '@/navigation'"
**Solution:** Create `src/navigation.ts` as shown in Step 3

### Issue: "useTranslations is not a function"
**Solution:** Make sure component is wrapped in NextIntlClientProvider

### Issue: Routes not working
**Solution:** Ensure all route folders are moved to `[locale]/`

### Issue: Language toggle not working
**Solution:** Check that middleware is properly configured

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Migration Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router)
- [Examples](https://github.com/amannn/next-intl/tree/main/examples)

## 🚀 Next Steps

1. Move route folders to `[locale]/`
2. Create `src/navigation.ts`
3. Update one component at a time
4. Test thoroughly
5. Commit changes

Good luck with the migration! 🎉
