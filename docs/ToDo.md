# LynqArt TODO — MVP Audit & Deployment Roadmap

> Last audited: 2026-09-10
>
> LynqArt is a digital exhibition and artwork-archive platform connecting physical artworks to public digital records through QR codes.

## Status key

- `[x]` Implemented in the repository and confirmed by code inspection.
- `[ ]` Not implemented, not verified in a production-like environment, or still requiring a product decision.

## 1. MVP audit — complete

### 1.1 Platform foundations

- [x] Django project with the nine domain apps: accounts, artworks, exhibitions, comments, reviews, AI, analytics, QR, and notifications.
- [x] Custom user model with independent capability flags for artists, experts, exhibition managers, and verification.
- [x] Core models, relationships, migrations, SQLite development configuration, and PostgreSQL-compatible settings.
- [x] JWT login, refresh, registration, profile management, and artist onboarding.
- [x] Environment-based configuration and CORS/CSRF configuration.

### 1.2 Public visitor experience

- [x] Homepage with featured/recent artworks and exhibitions.
- [x] Search and explore pages with artwork/exhibition filters and ordering.
- [x] Public artwork pages with artist statements, artwork details, progress images/video, attribution, availability, comments, favorites, reviews, sharing, and related works.
- [x] Public exhibition catalogues with curator text and linked artworks.
- [x] Public artist profiles with biography, social links, and featured works.
- [x] QR resolver routes (`/q/:slug` and `/qr/:slug`) with scan deduplication.
- [x] Dynamic share-preview metadata for artwork and exhibition links.

### 1.3 Artist and organizer workflows

- [x] Multi-step artwork manager for metadata, Markdown statements, revisions, media, contributors, exhibition associations, and QR codes.
- [x] Multi-step exhibition manager for details, curator statement, banner, artwork linking, and QR code.
- [x] AI statement assistant with review-before-save behavior and structured fallback when the provider is unavailable.
- [x] Artwork statement history stored as immutable versions.
- [x] Artist-featured artwork controls distinct from editorial homepage featuring.
- [x] Artists and accepted collaborators can associate work with exhibitions; organizers can manage their exhibition catalogue.
- [x] Optional single process video per artwork, limited to 10 MB and validated to MP4/WebM/MOV.
- [x] Exhibition artwork selection updates immediately after a successful link/unlink operation.

### 1.4 Engagement, communication, and moderation

- [x] Threaded comments with artist/collaborator-only replies.
- [x] Favorites/bookmarks and artist notifications.
- [x] Expert reviews with rating, Markdown critique, and pinned display support.
- [x] Collector inquiries without exposing artist email addresses, with notification and email delivery hooks.
- [x] Visitor feedback endpoint and UI.
- [x] Content reports for comments, artworks, exhibitions, expert reviews, and users.
- [x] Admin moderation panel showing pending reports; reviewed reports leave the active dashboard queue.
- [x] Notification creation for comments, replies, reviews, favorites, exhibition inclusion, and report updates.
- [x] Notification polling, mobile notification access, and mark-all-as-read endpoint.

### 1.5 Analytics and QR administration

- [x] Artwork views and unique visitor counts with proxy-aware visitor hashing.
- [x] Artwork and exhibition QR scan tracking with short-window deduplication.
- [x] Dashboard analytics scoped to the current artist/organizer.
- [x] Branded QR card generation with high error correction and downloadable images.

### 1.6 Security and integrity work completed

- [x] Object-level authorization on artwork, exhibition, media, contributor, statement, QR, and moderation mutations.
- [x] Draft/archived content excluded from public feeds and direct public detail access.
- [x] Upload size, extension, and image magic-byte validation; SVG and executable extensions are excluded.
- [x] Password validation and scoped API throttling for login, AI generation, and inquiries.
- [x] Public serializers omit private account information such as email.
- [x] Frontend JWT refresh/retry flow for expired access tokens.
- [x] Artwork `allow_comments` setting enforced server-side.
- [x] Copyright, licence, provenance, availability, and attribution fields.

## 2. Recently completed fixes to retain in the release notes

- [x] Compact, non-wrapping buttons for narrow mobile layouts.
- [x] Exhibition association permission correction for artwork owners and accepted collaborators.
- [x] AI statement permission/error-flow correction for artwork collaborators.
- [x] Per-artwork AI generation history moved into selected-artwork analytics.
- [x] Optional process video upload and public playback.
- [x] Google Identity Services browser integration; manual ID-token prompting removed.

## 3. Deployment blockers — complete these before launch

These are the next priority. They are not new MVP features; they are the checks and operational work needed to make the existing MVP safe and supportable in production.

### 3.1 Production configuration and infrastructure

- [ ] Deploy the backend and frontend to staging first, then production.
- [ ] Use PostgreSQL in the deployed environment and run every migration, including the process-video migration.
- [ ] Set a unique production `SECRET_KEY`; do not use development defaults.
- [ ] Set exact production `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
- [ ] Confirm HTTPS, secure cookies, HSTS, reverse-proxy HTTPS headers, and `SECURE_SSL_REDIRECT` work correctly behind the chosen host.
- [x] Configure Gunicorn/process management and a health check for the backend.
- [x] Configure static-file collection and serving; confirm media URLs work from the deployed frontend.
- [x] Configure production error logging; external alerting/exception monitoring still requires a provider.

### 3.2 Media and data safety

- [ ] Verify Cloudinary (or the selected object store) with real credentials, including image, video, QR, and avatar uploads.
- [x] Confirm the development local-media fallback still works after storage changes.
- [x] Define retention and deletion behavior for replaced/deleted media; remove orphaned files if necessary.
- [ ] Configure automated PostgreSQL backups and perform a restore test.
- [x] Confirm migration rollback/forward procedures and document the release process.

### 3.3 Authentication and external services

- [ ] Add a real `VITE_GOOGLE_CLIENT_ID` to the frontend deployment.
- [ ] Configure the Google OAuth consent screen and exact authorized origins/redirect-related settings for the production domain.
- [ ] Test Google sign-in with a real browser credential; offline/manual ID-token entry is not a supported sign-in flow.
- [ ] Configure a real transactional email provider and verify inquiry, report, and notification email behavior.
- [ ] Configure OpenRouter credentials/model limits if live AI generation is desired; verify the fallback remains usable when AI is unavailable.
- [ ] Confirm domain, DNS, SSL certificate, and frontend `VITE_API_BASE_URL`/`VITE_API_HOST` values.

### 3.4 Release verification

- [ ] Add frontend automated coverage with Vitest and React Testing Library for login/session refresh, artwork manager save/versioning, exhibition linking, video upload state, and public rendering.
- [ ] Add Playwright smoke coverage for registration/login, public browsing, QR resolution, artwork creation, exhibition linking, and Google sign-in availability.
- [x] Run the complete backend suite in the project virtual environment: `python manage.py test accounts artworks comments reviews notifications qr ai exhibitions`.
- [ ] Perform manual mobile QA on real iOS/Android browsers, including narrow buttons, media playback, QR scanning, notification access, and modal keyboard/focus behavior.
- [ ] Test authorization with separate artist, collaborator, organizer, expert, regular-user, anonymous, and admin accounts.
- [ ] Test upload rejection for oversized files, invalid extensions, fake image files, unsupported videos, and duplicate process videos.
- [ ] Verify draft/archived privacy, report moderation, inquiry delivery, refresh-token rotation, and production error pages.

### 3.5 Operational readiness

- [x] Add a short production runbook covering deploy, migrate, rollback, backups, storage, secrets rotation, and incident response.
- [ ] Decide who can grant `is_artist`, `is_expert`, `can_manage_exhibitions`, and `is_verified` in production.
- [ ] Define moderation response policy, copyright-report handling, data deletion requests, and support contact details.
- [x] Create realistic staging/demo seed data or a documented manual setup checklist for launch demonstrations.
- [ ] Confirm privacy/legal pages, cookie/analytics disclosure, terms, and Ghana Data Protection Act wording with the project owner/adviser.

## 4. Post-launch improvements

These should wait until the deployment blockers are closed and real usage shows which problems matter most.

- [ ] Print-ready museum labels/wall placards with QR codes.
- [ ] Audio artist statements.
- [ ] Private artist collections.
- [ ] Guest bookmarking without an account, with later account sync.
- [ ] Exhibition guestbook approval queue.
- [ ] Curated exhibition tour flow with previous/next artwork navigation.
- [ ] PWA/offline exhibition mode for low-connectivity venues.
- [ ] Cryptographic certificate of authenticity.
- [ ] Verified multilingual statement translations.
- [ ] Richer charts for views, scans, favorites, comments, inquiries, and date ranges.
- [ ] Exhibition attendance/scan reports and exports.
- [ ] Archive browsing by year, department, exhibition type, and collection.
- [ ] Read-only public API for institutional integrations.

## 5. Product rules

1. Use independent capability flags rather than a single role field.
2. AI remains assistive: no draft is published or saved as a statement version without artist review and explicit save.
3. QR destinations use stable slugs/UUID-backed records, never display-only integer IDs.
4. Statement revisions are preserved as versions rather than silently overwritten.
5. Digital features should support the physical exhibition rather than distract from it.
