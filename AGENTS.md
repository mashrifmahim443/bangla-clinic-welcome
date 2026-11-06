# Agent rules
- All UI strings go through `useLang().t(bn, en)` from src/lib/i18n.tsx — keeps both languages in sync without a translation library.
- Format dates/money only via src/lib/locale.ts (Asia/Dhaka, BDT) — one place for locale rules.
- Roles live in public.user_roles (enum admin/doctor/patient, new users get patient via trigger); role pages wrap content in RoleShell — never store roles on profiles.
- Admin-editable site copy/images live in public.site_content (key → jsonb), read via useCms() from src/lib/cms.tsx with code defaults as fallback; images stored as resized data URLs because public storage buckets are blocked in this workspace.
