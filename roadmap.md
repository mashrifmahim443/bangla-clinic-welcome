# Roadmap (from product brief)
- [x] Standalone doctor-written medicine schedules, patient-controlled SMS consent and authenticated minute-by-minute reminder callback; signed-in save/readback, real provider acceptance, duplicate prevention and mobile layout verified. Publish latest app to activate the new scheduled endpoint on the published site.
- [x] Automas SMS API setup placeholders from public documentation; admin page and mobile layout verified.
- [x] Automas API key collected through the encrypted project secret form at the user's request; never entered into public CMS or browser storage.
- [x] Automas test SMS accepted by provider and receipt confirmed by user.
- [x] Admin custom SMS composer with authenticated sending and recorded results; real SMS accepted, send time/status read back in history, nine unit tests passed and mobile layout checked.
- [x] Save SMS configuration button with admin-only storage; authenticated save/reload and mobile layout verified, credential allowlist tests passed.
- [x] Admin SMS history with send time, recipient, safe provider response and separately sourced delivery status; custom sends recorded automatically, authenticated readback and mobile checks passed. Provider delivery receipts await documented integration.
- [x] Automas automatic medicine reminders implemented with service-only dose claims and SMS history; other automatic messaging flows remain separate.
- [x] Admin-controlled Verified and Special doctor badges on homepage, directory and profile; signed-in saving/removal tested, writes restricted by admin-only policies.
- [x] Admin role checkmarks approve accounts and activate existing or subsequently completed doctor profiles; Forhad visible in directory, two signed-in regression tests passed.
- [x] Per-medicine timing dropdown, custom instructions and individual comments in doctor and patient prescription views (4 tests passed; signed-in save check unavailable without a matching account)
- [x] Video consultation (free Jitsi link; move to paid video service before launch)
- [x] Food logging in the check-in
- [x] Doctor sign-up with BMDC verification by admin
- [ ] Subscription payments (needs payment provider)
- [ ] Automatic 3x daily SMS/WhatsApp check-in sending (needs SMS provider)
- [x] Patient profile: diabetes type, birth year, gender
- [x] Larger-text toggle
- [x] Admin six-month targets table

## M3 — Doctor directory and appointments
- [x] Directory search, filters, doctor introduction, experience and genuine reviews/ratings
- [x] Doctor weekly availability, leave and live availability status
- [x] Booking with consultation type, reason and previous reports
- [x] Secure appointment lifecycle, rescheduling and database double-booking protection
- [x] Patient history access and in-app status notifications
- [x] Cancellation eligibility: 24-hour refunds; later requests reviewed by admin
- [ ] Online payment collection and actual refunds (deferred by user; needs payment provider)
