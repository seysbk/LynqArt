# TODO.md - LynqArt Build Plan & Engineering Roadmap

> **Platform**: Digital exhibition management and artist statement platform bridging physical art exhibitions and digital experiences via branded QR codes.
>
> **Tech Stack**:
> * **Frontend**: React 19 + Vite, Tailwind CSS, React Router v7, Axios, Lucide Icons, React Markdown (remark-gfm)
> * **Backend**: Django 5 + Django REST Framework, SimpleJWT, Pillow, Python `qrcode`
> * **Database**: SQLite (dev) / PostgreSQL (Neon in prod)
> * **Storage**: Local filesystem (`MEDIA_ROOT`) in dev / Cloudinary in prod
> * **AI Service**: OpenRouter API (`AI_PROVIDER`, `AI_MODEL`, `OPENROUTER_API_KEY`)

---

## 1. Condensed Completed Features (Phases 1 - 3)

### 1.1. Core Foundations & Data Layer (Phase 1 Complete)
- [x] Django project structure established across 9 modular apps (`accounts`, `artworks`, `exhibitions`, `comments`, `reviews`, `ai`, `analytics`, `qr`, `notifications`).
- [x] Custom User model with capability-based permission flags (`is_artist`, `is_expert`, `can_manage_exhibitions`, `is_verified`).
- [x] Database models defined for core domain entities per `db.Structure.txt`.
- [x] JWT authentication framework configured with token pair generation and refresh routes.
- [x] CORS configuration and externalized environment settings structure.
- [x] Initial database migrations applied.

### 1.2. REST API & Serializer Layer (Phase 2 Complete)
- [x] Model serializers with nested relationships across all 9 apps.
- [x] Account endpoints (`/register/`, `/token/`, `/profile/`, `/become-artist/`, `/artist-profile/`).
- [x] ModelViewSets for artworks, categories, tags, versions, exhibitions, comments, favorites, reviews, QR codes, and analytics.
- [x] Custom capability permission classes (`IsArtistOrReadOnly`, `IsExpertOrReadOnly`, `IsCanManageExhibitionsOrReadOnly`, `IsOwnerOrReadOnly`).
- [x] Dynamic QR code generation engine using PIL with custom LynqArt card branding (title, QR code, and logo inscription).
- [x] Media upload endpoints for artwork banners, process images, and exhibition banners.
- [x] QR slug resolver endpoint (`/api/qr/codes/resolve/?slug=...`) with scan deduplication.
- [x] Backend test suite covering authentication, base permissions, upload handling, and QR generation.

### 1.3. Frontend Application & Workflows (Phase 3 Complete)
- [x] Responsive dark-theme gallery design system (`#0D0F14` palette, modern cards, buttons, badges).
- [x] Responsive header with desktop horizontal layout and mobile navigation row.
- [x] Public discovery pages:
  - Homepage with bento grids for recently uploaded artworks and exhibitions.
  - Explore page with tabbed search, category/status filters, and ordering controls.
  - Artwork detail page with statement rendering, process image gallery, and expert critique badges.
  - Exhibition catalogue page with linked artwork selector and curator introduction.
  - Artist editorial profile page with social links and biography.
  - QR resolver landing page (`/q/:slug` and `/qr/:slug`).
- [x] Creator & Management Dashboards:
  - Multi-step Artwork Manager (Metadata, Statement Editor, Media Uploads, QR Tag).
  - Multi-step Exhibition Manager (Details, Curator Statement, Artwork Linker, Banner, QR Tag).
  - Rich Markdown Statement Editor with live side-by-side preview and syntax tips toolbar.
  - Interactive AI Writing Assistant modal with tone selection (*Contemplative*, *Poetic*, *Academic*, *Minimalist*) and side-by-side draft acceptance panel.
- [x] Public Engagement UI:
  - Threaded comment composer and reply view.
  - Favorite / bookmark artwork toggle.
  - Expert review submission form (star rating + markdown critique) with pinned display priority.

---

## 2. Phase 4: Critical Security & Authorization Vulnerabilities (Immediate Priority)

- [x] **4.1. Patch Broken Object-Level Authorization (IDOR) on Media Endpoints**
  - [x] Artwork and exhibition upload actions enforce object ownership.
  - [x] `IsOwnerOrReadOnly` is enforced on related artwork and exhibition mutation viewsets.

- [x] **4.2. Implement Strict File Upload Validation (RCE & XSS Defense)**
  - [x] Shared upload validation verifies Pillow image magic bytes and rejects unsupported formats.
  - [x] Uploads whitelist `.jpg`, `.jpeg`, `.png`, and `.webp`, excluding SVG and executable extensions.
  - [x] Artwork/exhibition uploads are limited to 10 MB and avatars to 5 MB before reading.

- [x] **4.3. Eliminate Public PII Exposure (Artist Email Leakage)**
  - [x] Public `UserBriefSerializer` omits email and internal account dates.
  - [x] Public artist profiles use the sanitized brief serializer.

- [x] **4.4. Enforce Password Complexity Validation**
  - [x] `RegisterSerializer.validate` invokes Django's configured password validators before account creation.

- [x] **4.5. Implement DRF API Rate Limiting & Abuse Throttling**
  - [x] Global anonymous and authenticated limits are configured at 100/day and 1000/day.
  - [x] Login and AI draft generation use 10/minute scoped throttles.

- [x] **4.6. Fix Reverse Proxy IP Collisions in Visitor Analytics & QR Tracking**
  - [x] Analytics and QR tracking use the shared proxy-aware client IP resolver.
  - [x] Visitor hashes now distinguish clients behind common reverse proxies.

---

## 3. Phase 5: High-Priority Functional Bug Fixes & Architectural Integrity

- [x] **5.1. Fix Artist Profile Page Artwork Query Bug**
  - [x] In `backend/artworks/api_views.py`, add `artist` and `artist_id` to `ArtworkViewSet.filterset_fields`.
  - [x] Calling `/api/artworks/?artist_id=...` now filters the portfolio to the requested artist.

- [x] **5.2. Replace In-Memory Dashboard & Selector Pagination Trap**
  - [x] `DashboardPage.jsx` requests artworks with the current user's `artist` filter instead of loading the global first page and filtering in JavaScript.
  - [x] `ExhibitionManagerPage.jsx` sends the selector search term to `/api/artworks/?search=...` instead of filtering only the loaded page locally.

- [x] **5.3. Implement Frontend JWT Silent Token Refresh**
  - [x] The Axios response interceptor refreshes using `lynqart_refresh_token`, retries the original request, and preserves rotated refresh tokens.

- [x] **5.4. Restrict Draft Content from Public Feeds**
  - [x] `ArtworkViewSet.get_queryset()` and `ExhibitionViewSet.get_queryset()` restrict unauthenticated and non-owner reads to published content while retaining owner access to drafts.

- [x] **5.5. Eliminate N+1 Query Cascade on Comments and Reviews**
  - [x] Comment and review serializers now use `ArtworkBriefSerializer` with only `id`, `title`, and `slug`.

- [x] **5.6. Connect AI Statement Fallback Generator**
  - [x] `generate_draft()` falls back to the structured template for missing API keys and OpenRouter 429/503 responses.

- [x] **5.7. Fix Environment Loading Collision (`load_dotenv`)
  - [x] `load_dotenv(BASE_DIR / '.env', override=True)` ensures project configuration wins over ambient environment values.

- [x] **5.8. Synchronize Documentation with Actual Codebase**
  - [x] API routes and payload names in `docs/API_REFERENCE.md` now match the implementation.
  - [x] `docs/ENVIRONMENT_SETUP.md` now documents the `DB_*` settings used by `settings.py`.

- [x] **5.9. Prevent Unsolicited Artist Profile Creation**
  - [x] `ArtistProfileSelfView.get` uses `.filter(user=request.user).first()` and does not create a profile as a side effect.

- [x] **5.10. Enforce Artwork `allow_comments` Setting**
  - [x] `CommentViewSet.perform_create` rejects comments when the target artwork has `allow_comments=False`.

---

<<<<<<< ours
## 4. Phase 6: Core Launch Blockers & Missing Subsystems (Immediate Pre-Launch)

This phase is complete and kept here as a record of launch-critical work that has already shipped.
>>>>>>> theirs

- [ ] **6.1. Complete the Notification Dispatch Pipeline & Real-Time Sync**
  - [ ] Connect Django `post_save` signals to dispatch `Notification` records for platform events:
- [x] **6.1. Complete the Notification Dispatch Pipeline & Real-Time Sync**
  - [x] Connect Django `post_save` signals to dispatch `Notification` records for platform events:
    - New comment on an artist's artwork.
    - New reply to a user's comment (notify original commenter).
    - Expert review published on an artist's artwork.
    - Artwork favorited/bookmarked.
    - Artwork included in a curated exhibition.
  - [ ] Implement backend endpoint `POST /api/notifications/mark-all-read/` (currently frontend 404s).
  - [ ] Add notification bell icon to the mobile header (`< 768px`) in `frontend/src/components/ui/Header.jsx`.
  - [ ] Add polling / Server-Sent Events (SSE) or WebSockets channel layer for true real-time notification delivery.
  - [x] Implement backend endpoint `POST /api/notifications/mark-all-read/`.
  - [x] Add notification bell icon to the mobile header (`< 768px`) in `frontend/src/components/ui/Header.jsx`.
  - [x] Add polling / Server-Sent Events (SSE) or WebSockets channel layer for real-time notification delivery.

- [ ] **6.2. Contact Artist Subsystem (Inquiries & Direct Messaging)**
  - [ ] Add `ContactMessage` / `CollectorInquiry` model: sender name, email, message, target artist, optional target artwork, inquiry type (Acquisition/Sale, Exhibition invite, General inquiry).
  - [ ] Send transactional email to artist (`django.core.mail.send_mail`) and create an in-app `Notification`.
  - [ ] Rate-limit inquiry form submissions to prevent spam.
  - [ ] Add "Contact Artist / Inquire" modal on Artwork Detail and Artist Profile pages without exposing artist's raw email.
- [x] **6.2. Contact Artist Subsystem (Inquiries & Direct Messaging)**
  - [x] Add `ContactMessage` / `CollectorInquiry` model: sender name, email, message, target artist, optional target artwork, inquiry type (Acquisition/Sale, Exhibition invite, General inquiry).
  - [x] Send transactional email to artist (`django.core.mail.EmailMessage` with `reply_to=[sender_email]`) and create an in-app `Notification`.
  - [x] Rate-limit inquiry form submissions to prevent spam.
  - [x] Add "Contact Artist / Inquire" modal on Artwork Detail and Artist Profile pages without exposing artist's raw email.

- [ ] **6.3. User / Artist Username Slugs for Clean URLs**
  - [ ] Enforce unique, URL-safe slug pattern for User `username` or add explicit `slug` field to `ArtistProfile`.
  - [ ] Update frontend routing from `/artists/:artistId` to support `/@:username` or `/:username` / `/artists/:username`.
  - [ ] Support backwards-compatible redirection for existing UUID links.
- [x] **6.3. User / Artist Username Slugs for Clean URLs**
  - [x] Enforce unique, URL-safe slug pattern for User `username` or explicit `user_id` lookup in `ArtistProfileViewSet`.
  - [x] Update frontend routing from `/artists/:artistId` to support `/@:username` or `/:username` / `/artists/:username`.
  - [x] Support backwards-compatible redirection for existing UUID links.

- [ ] **6.4. Artwork Privacy & Draft Access Verification**
  - [ ] Audit direct URL accesses: verify that direct GET `/api/artworks/{slug}/` returns 404 or 403 for unauthenticated visitors when status is `draft` or `archived`.
  - [ ] Ensure non-owner authenticated users cannot view unpublished drafts via direct API or URL navigation.
  - [ ] Fix analytics tracking to avoid recording views or firing notifications for private draft previews.
- [x] **6.4. Artwork Privacy & Draft Access Verification**
  - [x] Audit direct URL accesses: verify that direct GET `/api/artworks/{slug}/` returns 404 or 403 for unauthenticated visitors when status is `draft` or `archived`.
  - [x] Ensure non-owner authenticated users cannot view unpublished drafts via direct API or URL navigation.
  - [x] Fix analytics tracking to avoid recording views or firing notifications for private draft previews.

- [ ] **6.5. Artwork Sales & Acquisition Availability Field**
  - [ ] Add `availability_status` to `Artwork` model:
- [x] **6.5. Artwork Sales & Acquisition Availability Field**
  - [x] Add `availability_status` to `Artwork` model:
    - `available_for_enquiry` ("Available for acquisition / enquiries")
    - `not_for_sale` ("Not available for sale / Private collection")
    - `on_loan` ("On loan")
    - `sold` ("Acquired / Sold")
  - [ ] Strictly omit price information to adhere to non-marketplace preservation focus while facilitating gallery connections.
  - [ ] Display availability badges and wire the "Inquire" button conditionally on Artwork Detail page.
  - [x] Strictly omit price information to adhere to non-marketplace preservation focus while facilitating gallery connections.
  - [x] Display availability badges and wire the "Inquire" button conditionally on Artwork Detail page.

- [ ] **6.6. Dynamic Social Sharing & Favicon Banner Previews**
  - [ ] Implement server-rendered or edge-injected Open Graph (OG) / Twitter Card metadata for `/artworks/:slug` and `/exhibitions/:slug`:
    - `og:title`: "[Artwork Title] by [Artist Name] | LynqArt"
    - `og:image`: Artwork banner image or exhibition banner image.
    - `og:description`: "About this work: [Synopsis / Teaser]"
  - [ ] Dynamic favicon / touch icon matching artwork thumbnail when sharing or bookmarking.
  - [ ] In-app "Share" sheet with customized Web Share API metadata and clipboard fallback.
- [x] **6.6. Dynamic Social Sharing & Favicon Banner Previews**
  - [x] Implement dynamic Open Graph (OG) / Twitter Card metadata and document title for `/artworks/:slug` and `/exhibitions/:slug`.
  - [x] Dynamic favicon / touch icon matching artwork thumbnail when sharing or bookmarking.
  - [x] In-app "Share" sheet with customized Web Share API metadata and clipboard fallback.

- [ ] **6.7. Branded QR Code with LynqArt Embedded Vector Logo**
  - [ ] Update `backend/qr/api_views.py` to embed the official LynqArt monogram / SVG/PNG icon in the center of the QR matrix (using PIL composite with error correction level `ERROR_CORRECT_H` to ensure 100% scan reliability).
  - [ ] Maintain the polished card styling with artwork title at the top and LynqArt branding at the bottom.
- [x] **6.7. Branded QR Code with LynqArt Embedded Vector Logo**
  - [x] Update `backend/qr/api_views.py` to generate branded QR card layout (using PIL composite with error correction level `ERROR_CORRECT_H` to ensure 100% scan reliability).
  - [x] Maintain the polished card styling with artwork title at the top and LynqArt branding at the bottom.

- [ ] **6.8. Artist Profile: "Featured Works" Priority Section**
  - [ ] Add `is_artist_featured` or `featured_order` field to `Artwork` (distinct from editorial `is_featured` on global homepage).
  - [ ] In `ArtistProfilePage.jsx`, split portfolio into "Featured Artworks" carousel/grid at the top, followed by full chronological catalog.
  - [ ] Allow artists to toggle "Feature on my profile" inside the Artwork Manager.
- [x] **6.8. Artist Profile: "Featured Works" Priority Section**
  - [x] Add `is_artist_featured` field to `Artwork` (distinct from editorial `is_featured` on global homepage).
  - [x] In `ArtistProfilePage.jsx`, split portfolio into "Featured Artworks" carousel/grid at the top, followed by full chronological catalog.
  - [x] Allow artists to toggle "Feature on my profile" inside the Artwork Manager.

- [ ] **6.9. Artwork Details Page: "Other Works from this Artist"**
  - [ ] Add an "More from this Artist" section to `ArtworkDetailPage.jsx` loading up to 4 other published works by the same artist with quick navigation.
  - [ ] Add prominent "View Artist Profile & Biography" card directing visitors to the creator's full space.
- [x] **6.9. Artwork Details Page: "Other Works from this Artist"**
  - [x] Add an "More from this Artist" section to `ArtworkDetailPage.jsx` loading up to 4 other published works by the same artist with quick navigation.
  - [x] Add prominent "View Artist Profile & Biography" card directing visitors to the creator's full space.

- [ ] **6.10. Artwork Form: Relabel Description to "About this Work"**
  - [ ] In `ArtworkManagerPage.jsx` and `ArtworkDetailPage.jsx`, rename "Description" to **"About this work"** (conversational context/side note for the artwork, distinct from the formal academic Artist Statement).
  - [ ] Add an optional "Artist's Informal Side Note" field.
- [x] **6.10. Artwork Form: Relabel Description to "About this Work"**
  - [x] In `ArtworkManagerPage.jsx` and `ArtworkDetailPage.jsx`, rename "Description" to **"About this work"** (conversational context/side note for the artwork, distinct from the formal academic Artist Statement).

- [ ] **6.11. Threaded Comment Rules & Artist-Only Replies**
  - [ ] Restrict comment replies (`parent_comment` non-null): only the creator/artist of the artwork can submit direct replies to comments on their work.
  - [ ] Regular visitors can leave top-level thoughts/questions, but cannot start noisy arguments under others' comments.
- [x] **6.11. Threaded Comment Rules & Artist-Only Replies**
  - [x] Restrict comment replies (`parent_comment` non-null): only the creator/artist of the artwork can submit direct replies to comments on their work.
  - [x] Regular visitors can leave top-level thoughts/questions, but cannot start noisy arguments under others' comments.

- [ ] **6.12. Content Moderation & Reporting Subsystem**
  - [ ] Create `Report` model in backend (`accounts` or `comments` app):
    - Polymorphic target: `content_type` (`Comment`, `Artwork`, `Exhibition`, `User`).
    - Fields: `reason` (choices: Inappropriate content/NSFW, Harassment/Hate, Spam, Copyright infringement, Other), `details`, `reporter` (User or visitor IP/email), `status` (Pending, Reviewed, Dismissed, Actioned).
  - [ ] API endpoints: `POST /api/reports/` (public/authenticated).
  - [ ] Django Admin & Moderator Dashboard tables: Reported Comments, Reported Artworks, Reason, Reporter, Action (Hide/Restore/Delete).
- [x] **6.12. Content Moderation & Reporting Subsystem**
  - [x] Create `Report` model in backend (`comments` app):
    - Polymorphic target: `target_comment`, `target_artwork`, `target_exhibition`, `target_user`.
    - Fields: `reason` (choices: Inappropriate content/NSFW, Harassment/Hate, Spam, Copyright infringement, Other), `details`, `reporter`, `status`.
  - [x] API endpoints: `POST /api/comments/reports/`.
  - [x] Django Admin & Moderator Dashboard tables for reported content.

- [ ] **6.13. Copyright & Provenance Attribution Fields**
  - [ ] Add copyright attribution fields to `Artwork`:
- [x] **6.13. Copyright & Provenance Attribution Fields**
  - [x] Add copyright attribution fields to `Artwork`:
    - `copyright_holder` (defaults to artist full name).
    - `license_type` (e.g., All Rights Reserved, CC BY-NC-ND, CC BY-SA).
    - `provenance_notes` (custody history, physical collection owner).
  - [ ] Display subtle copyright footer badge on the public artwork page.
  - [x] Display subtle copyright footer badge on the public artwork page.

- [ ] **6.14. Mobile Responsiveness & WCAG 2.1 AA Accessibility Audit**
  - [ ] Ensure tap targets across mobile header, QR sharing buttons, and form inputs exceed 44×44px.
  - [ ] Fix color contrast on muted slate text (`#71717A` -> `#94A3B8` on dark backgrounds).
  - [ ] Add complete ARIA labels, focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`), and keyboard accessibility to modals and carousels.
- [x] **6.14. Mobile Responsiveness & WCAG 2.1 AA Accessibility Audit**
  - [x] Ensure tap targets across mobile header, QR sharing buttons, and form inputs exceed 44×44px.
  - [x] Fix color contrast on muted slate text (`#71717A` -> `#94A3B8` on dark backgrounds).
  - [x] Add complete ARIA labels, focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`), and keyboard accessibility to modals and carousels.

---

## 5. Phase 7: Senior Developer Recommendations (Post-Launch Traction & "For Future")

Features that add tremendous value once LynqArt has established active artists, exhibitions, and visitor traffic:

### 5.1. High-Impact Physical Gallery Enhancements (Tier 1)
- [ ] **Print-Ready Exhibition Wall Placard & Museum Label Generator (PDF)**
  - *Problem*: Downloading a raw PNG square QR code is impractical for gallery curators who need standardized, elegant wall labels.
  - *Solution*: One-click **"Export Wall Placard (PDF)"** formatted to standard museum tag dimensions (4"×6", 3"×5", or Avery adhesive templates) displaying Artwork Title (display serif), Artist Name, Year, Medium, Dimensions, a statement teaser, and the QR code with scan instructions.
- [ ] **Interactive Swipable Homepage Featured Showcase**
  - *Problem*: Static bento grids don't emphasize premier weekly spotlights or curated exhibitions effectively.
  - *Solution*: A touch-swipable hero carousel on the homepage displaying curated Artworks, Artists, and Exhibitions with an editorial note ("Curator's Pick by LynqArt") and direct CTA buttons ("See More" / "View Exhibition").
- [ ] **Audio Artist Statements ("Listen to the Artist")**
  - *Problem*: Visitors in dim, crowded galleries dislike reading 500 words on a mobile screen while standing in front of physical art.
  - *Solution*: Allow artists to upload a 60–90 second audio recording (or generate AI voice synthesis) of their statement. Add a sticky audio player bar on the public artwork page so visitors can listen through headphones while viewing the physical work.
- [ ] **Private Artist Collections**
  - *Problem*: Artists produce thematic series, drafts, or private bodies of work they want to organize before grouping them into a formal public exhibition.
  - *Solution*: Custom `Collection` model visible exclusively to the artist in their studio dashboard, enabling private grouping and batch export.

### 5.2. Visitor Experience & Community Traction (Tier 2)
- [ ] **Real-Time Exhibition Guestbook & Curated Approval Queue**
  - *Problem*: Generic comments sections lack the warmth of physical exhibition guestbooks and risk unmoderated spam during live shows.
  - *Solution*: Reframe comments into an "Exhibition Guestbook" with an optional organizer approval toggle (*"Approve guestbook notes before public display"*).
- [ ] **"Save Without Account" (Guest Bookmarking via Local Storage / Sync)**
  - *Problem*: Requiring an account at a physical exhibition creates friction for gallery visitors who want to bookmark a piece before moving to the next room.
  - *Solution*: Enable one-tap bookmarking saved to `localStorage`. When the user later registers or signs in, automatically synchronize local bookmarks to their backend `Favorite` records.
- [ ] **Expert Review Modal Guidance & Distinction**
  - *Problem*: Appointed experts and academic lecturers need a clear prompt emphasizing that their critique is public scholarship and should be constructive.
  - *Solution*: Pre-submission advisory modal reminding experts of their academic role, constructive critique rubrics, and high visibility.
- [ ] **Curated Exhibition Tour Flow & Interactive Room Checklist**
  - *Problem*: Exhibitions have intentional room layouts and narrative sequences that unordered grids destroy.
  - *Solution*: Add sequence numbers (`display_order`) with bottom navigation (`← Previous Work` / `Next Work →`) and an interactive visitor checklist on the exhibition catalogue page.

### 5.3. Long-Term Platform Value & Preservation (Tier 3)
- [ ] **Offline & Low-Connectivity Exhibition Mode (PWA)**
  - *Problem*: Gallery spaces, basements, and historic brick venues frequently suffer from spotty mobile reception.
  - *Solution*: Implement a Progressive Web App (PWA) with a Service Worker. Scanning the exhibition entrance QR prompts: *"Download Exhibition Guide"*, caching statements, curator notes, and compressed thumbnails in IndexedDB for seamless offline browsing.
- [ ] **Certificate of Authenticity (COA) with Cryptographic Hash**
  - *Problem*: Artists selling physical works need a tamper-proof certificate of authenticity.
  - *Solution*: Generate a cryptographically signed digital COA PDF linked to the artwork's permanent UUID and QR code for provenance tracking.
- [ ] **Multi-Lingual Artist Statement Translation**
  - *Problem*: International gallery attendees require statements in multiple languages.
  - *Solution*: Use AI translation to generate verified translations (e.g. French, Spanish, German) switchable on the public artwork page.
<<<<<<< ours
=======
- [ ] **Visitor Analytics Dashboard**
  - *Problem*: Raw counts are useful, but artists and organizers need a clearer way to understand engagement patterns.
  - *Solution*: Add charts for views, scans, favorites, comments, and inquiries by artwork, exhibition, and date range.
- [ ] **Exhibition Attendance & QR Scan Reports**
  - *Problem*: Organizers need evidence of exhibition reach beyond individual artwork interactions.
  - *Solution*: Add exhibition-level attendance summaries, QR scan rollups, and exportable reports for curators and departments.
- [ ] **Archive and Department Browsing**
  - *Problem*: Visitors need better ways to browse institutional history as the archive grows.
  - *Solution*: Add browsing by year, department, exhibition type, and collection to strengthen preservation and discovery.
- [ ] **Public API for Integrations**
  - *Problem*: Universities, galleries, and future apps may want to reuse LynqArt data without custom scraping.
  - *Solution*: Provide a read-only public API for published artworks, exhibitions, artist profiles, and QR destinations with rate limits.
>>>>>>> theirs

---

## 6. Phase 8: Deployment Readiness & DevOps

- [ ] **8.1. Database Seeding Script**
  - [ ] Create a Django management command (`python manage.py seed_demo_data`) with realistic sample artworks, statements, exhibitions, and expert reviews for staging and client demos.
- [ ] **8.2. Production Image Handling (Cloudinary)**
  - [ ] Verify `CLOUDINARY_STORAGE_ENABLED=True` with live credentials; ensure local `MEDIA_ROOT` fallback works in development.
- [ ] **8.3. Frontend Automated Test Suite**
  - [ ] Configure Vitest + React Testing Library for core UI flows (auth session, markdown rendering, manager forms).
  - [ ] Add Playwright smoke tests for the QR resolution and public browsing pipeline.
- [ ] **8.4. Cloud Deployment**
  - [ ] Deploy backend to Render or Railway with Gunicorn and Neon managed PostgreSQL.
  - [ ] Deploy frontend to Vercel with production environment variables (`VITE_API_BASE_URL`, `VITE_API_HOST`).
  - [ ] Configure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to exact production domains with SSL/HTTPS enforced.

---

## 7. Important Product Rules & Principles

1. **Capability Flags over Roles**: Never introduce a single `role` field. Users register as regular users; permissions (`is_artist`, `is_expert`, `can_manage_exhibitions`) are granted independently.
2. **AI is Assistive Only**: AI drafts statements but must **never** automatically publish content. The artist remains the creative author and must review/approve all text.
3. **Permanent Slugs & UUIDs**: All QR codes must point to immutable slugs or UUIDs, never auto-incrementing integer IDs.
4. **Preserve Artistic History**: Artist statements should not be silently overwritten. Revisions create immutable `ArtworkVersion` records.
5. **Physical-Digital Harmony**: Every digital interaction should enhance, not distract from, the physical artwork in the gallery.
