# Agent rules
- All UI strings go through `useLang().t(bn, en)` from src/lib/i18n.tsx — keeps both languages in sync without a translation library.
- Format dates/money only via src/lib/locale.ts (Asia/Dhaka, BDT) — one place for locale rules.
- Roles live in public.user_roles (enum admin/doctor/patient, new users get patient via trigger); role pages wrap content in RoleShell — never store roles on profiles.
- Database triggers couple authenticated admin role grants to account approval and doctor activation, including doctor profiles created after the grant; ordinary signup never inherits this approval.
- Doctor badges are independent boolean fields protected by the existing admin-only doctor write policies; a shared bilingual badge display keeps public surfaces consistent.
- Non-secret SMS configuration uses the admin-only sms_settings table with explicit field allowlisting; credentials use a verified connector or the encrypted project secret store, never public CMS data or browser storage.
- SMS history is admin-read-only and trusted-service-written; store only safe response codes, distinguish provider acceptance from delivery and recipient confirmation, and never invent missing send timestamps.
- Custom SMS uses an authenticated admin server function, fixed provider HTTPS endpoint, saved sender and server-only key; claim a unique request ID before calling the provider to prevent duplicate submissions.
- Admin-editable site copy/images live in public.site_content (key → jsonb), read via useCms() from src/lib/cms.tsx with code defaults as fallback; images stored as resized data URLs because public storage buckets are blocked in this workspace.

- Appointment booking and lifecycle changes use authenticated database RPCs; direct appointment writes are revoked so slot, ownership, transition and cancellation checks run atomically.
- App bookings call an authenticated server function around the booking RPC, then notify the doctor's private profile phone through Automas; the appointment ID uniquely claims SMS history before sending, and SMS failure never invalidates a saved booking.
- Doctor availability is persisted as Dhaka-local weekly schedules and leave dates; public slots are derived from them, and Realtime subscriptions are scoped and cleaned up.
- Prescription medicine instructions stay in the existing items JSON; shared medicine helpers resolve bilingual timing presets while preserving legacy/custom text and per-medicine comments.
- Standalone medicine schedules are doctor-authored and patient-readable; patient-owned SMS consent and service-only atomic dose claims prevent unauthorized reminders and duplicate provider submissions. Managed authenticated HTTP scheduling checks Dhaka dose windows using each schedule’s persisted lead time; unknown provider results are not automatically retried.
