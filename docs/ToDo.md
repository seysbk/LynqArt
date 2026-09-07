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

## 4. Phase 6: Missing Subsystems & Incomplete Workflows

- [ ] **6.1. Complete the Notification Dispatch Pipeline**
  - [ ] Connect Django `post_save` signals to dispatch notifications for key platform events:
    - New comment on an artist's artwork.
    - New reply to a user's comment.
    - Expert review published on an artist's artwork.
    - Artwork favorited/bookmarked.
    - Artwork included in a curated exhibition.
  - [ ] Implement `POST /api/notifications/mark-all-read/` on the backend (currently returns 404).
  - [ ] Add the notifications bell icon to the mobile header (`< 768px`) in `frontend/src/components/ui/Header.jsx`.

- [ ] **6.2. Prevent Ghost & Duplicate QR Records**
  - [ ] In `QRCodeSerializer.validate` (`backend/qr/serializers.py`), verify that the target `entity_id` actually exists in the database.
  - [ ] Add a `unique_together = ('entity_type', 'entity_id')` constraint or use `get_or_create` logic in `generate_qr` so repeated clicks do not create duplicate QR records with incrementing slugs.

- [x] **6.3. Concurrency-Safe Artwork Version Numbering**
  - [x] `ArtworkVersionViewSet.perform_create` assigns version numbers under `transaction.atomic()` with `select_for_update()` and updates the current version.

- [ ] **6.4. Comment Moderation & Reporting Subsystem**
  - [ ] Implement a `ReportedComment` model and endpoint (`POST /api/comments/{id}/report/`) so users can flag abusive comments.
  - [ ] Provide artwork owners and administrators with comment moderation tools (hide/delete) in the UI.

---

## 5. Phase 7: Senior Developer Recommendations (Prioritized)

Features designed to maximize real-world adoption in physical art galleries, university exhibitions, and independent artist communities:

### 5.1. Tier 1: High-Impact Physical Gallery Bridge (Immediate Next Up)
- [ ] **Print-Ready Exhibition Wall Placard & Museum Label Generator (PDF)**
  - *Problem*: Downloading a raw PNG square QR code is impractical for gallery curators who need standardized, elegant wall labels.
  - *Solution*: One-click **"Export Wall Placard (PDF)"** formatted to standard museum tag dimensions (4"×6", 3"×5", or Avery adhesive templates) displaying Artwork Title (display serif), Artist Name, Year, Medium, Dimensions, a statement teaser, and the QR code with scan instructions.
- [ ] **Audio Artist Statements ("Listen to the Artist")**
  - *Problem*: Visitors in dim, crowded galleries dislike reading 500 words on a mobile screen while standing in front of physical art.
  - *Solution*: Allow artists to upload a 60–90 second audio recording (or generate AI voice synthesis) of their statement. Add a sticky audio player bar on the public artwork page so visitors can listen through headphones while viewing the physical work.
- [ ] **Direct Collector & Acquisition Inquiries**
  - *Problem*: Physical exhibitions are primary networking and sales opportunities, but LynqArt has no channel to connect interested buyers with artists.
  - *Solution*: Add an optional *"Inquire About This Work"* button that opens a structured collector inquiry form, notifying the artist via email/notification without exposing personal contact details.

### 5.2. Tier 2: Enhanced Exhibition Experience & Engagement
- [ ] **Offline & Low-Connectivity Exhibition Mode (PWA)**
  - *Problem*: Gallery spaces, basements, and historic brick venues frequently suffer from spotty mobile reception.
  - *Solution*: Implement a Progressive Web App (PWA) with a Service Worker. Scanning the exhibition entrance QR prompts: *"Download Exhibition Guide"*, caching statements, curator notes, and compressed thumbnails in IndexedDB for seamless offline browsing.
- [ ] **Curated Exhibition Tour Flow & Interactive Room Checklist**
  - *Problem*: Exhibitions have intentional room layouts and narrative sequences that unordered grids destroy.
  - *Solution*: Add room groupings or sequence numbers (`display_order`) with bottom navigation (`← Previous Work` / `Next Work →`) and an interactive visitor checklist on the exhibition catalogue page.
- [ ] **Real-Time Exhibition Guestbook & Curated Approval Queue**
  - *Problem*: Generic comments sections lack the warmth of physical exhibition guestbooks and risk unmoderated spam during live shows.
  - *Solution*: Reframe comments into an "Exhibition Guestbook" with an optional organizer approval toggle (*"Approve guestbook notes before public display"*).

### 5.3. Tier 3: Long-Term Platform Value & Preservation
- [ ] **Certificate of Authenticity (COA) with Cryptographic Hash**
  - *Problem*: Artists selling physical works need a tamper-proof certificate of authenticity.
  - *Solution*: Generate a cryptographically signed digital COA PDF linked to the artwork's permanent UUID and QR code for provenance tracking.
- [ ] **Multi-Lingual Artist Statement Translation**
  - *Problem*: International gallery attendees require statements in multiple languages.
  - *Solution*: Use AI translation to generate verified translations (e.g. French, Spanish, German) switchable on the public artwork page.

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
