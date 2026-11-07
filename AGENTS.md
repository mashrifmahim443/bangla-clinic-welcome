# Agent rules
- All UI strings go through `useLang().t(bn, en)` from src/lib/i18n.tsx — keeps both languages in sync without a translation library.
- Format dates/money only via src/lib/locale.ts (Asia/Dhaka, BDT) — one place for locale rules.
- Roles live in public.user_roles (enum admin/doctor/patient, new users get patient via trigger); role pages wrap content in RoleShell — never store roles on profiles.
- Database triggers couple authenticated admin role grants to account approval and doctor activation, including doctor profiles created after the grant; ordinary signup never inherits this approval.
- Doctor badges are independent boolean fields protected by the existing admin-only doctor write policies; a shared bilingual badge display keeps public surfaces consistent.
- SMS provider settings remain draft-only until sending is implemented; credentials use a verified connector or, when explicitly requested, the encrypted project secret store, never public CMS data or browser storage.
- Admin-editable site copy/images live in public.site_content (key → jsonb), read via useCms() from src/lib/cms.tsx with code defaults as fallback; images stored as resized data URLs because public storage buckets are blocked in this workspace.

- Appointment booking and lifecycle changes use authenticated database RPCs; direct appointment writes are revoked so slot, ownership, transition and cancellation checks run atomically.
- Doctor availability is persisted as Dhaka-local weekly schedules and leave dates; public slots are derived from them, and Realtime subscriptions are scoped and cleaned up.
- Prescription medicine instructions stay in the existing items JSON; shared medicine helpers resolve bilingual timing presets while preserving legacy/custom text and per-medicine comments.
