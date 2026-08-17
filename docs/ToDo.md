# TODO.md - LynqArt Build Plan

> Digital exhibition and artist statement platform
>
> Stack:
>
> * Frontend: React + Vite
> * Backend: Django + Django REST Framework
> * Database: PostgreSQL (Neon) / SQLite (dev)
> * Storage: Local in development, Cloudinary in production
> * Auth: JWT
> * Markdown: react-markdown + remark-gfm
> * QR codes: Python `qrcode`
>
> Goal:
> Build a complete, maintainable exhibition platform with permanent artwork and exhibition pages.

---

# Project Status

## Completed Foundations

* [x] `ProjectContext.md` updated with the exhibition-first product direction
* [x] `db.Structure.txt` exists and defines the target data model
* [x] Backend Django project initialized
* [x] Core apps created and registered
* [x] Custom user model configured with capability flags
* [x] Initial database migrations created and applied
* [x] JWT authentication configured
* [x] CORS and environment-driven settings configured
* [x] Documentation set up for backend and environment workflow

## Phase 1 Completed

* [x] Django project structure established
* [x] Database models created for all core entities
* [x] Authentication and security infrastructure added
* [x] Configuration management externalized to environment variables
* [x] Core documentation completed
* [x] Security defaults and production-ready settings added

## Phase 2 Completed

### 2a. Serializers & ViewSets
* [x] `accounts/serializers.py`
  * [x] `UserSerializer`
  * [x] `ArtistProfileSerializer`
  * [x] `CurrentUserSerializer`
  * [x] `UserBriefSerializer`
  * [x] `RegisterSerializer`
  * [x] `BecomeArtistSerializer`
  * [x] `ProfileUpdateSerializer`
* [x] `artworks/serializers.py`
  * [x] `CategorySerializer`
  * [x] `TagSerializer`
  * [x] `ArtworkVersionSerializer`
  * [x] `ArtworkImageSerializer`
  * [x] `ArtworkTagSerializer`
  * [x] `ArtworkSerializer`
  * [x] nested and related-object serialization
* [x] `exhibitions/serializers.py`
  * [x] `ExhibitionArtworkSerializer`
  * [x] `ExhibitionSerializer`
  * [x] `ExhibitionDetailSerializer`
* [x] `comments/serializers.py`
  * [x] `CommentSerializer`
  * [x] `FavoriteSerializer`
* [x] `reviews/serializers.py`
  * [x] `ExpertReviewSerializer`
* [x] `ai/serializers.py`
  * [x] `AIGenerationSerializer`
* [x] `analytics/serializers.py`
  * [x] `ArtworkViewSerializer`
* [x] `qr/serializers.py`
  * [x] `QRCodeSerializer`
  * [x] `QRScanSerializer`
* [x] `notifications/serializers.py`
  * [x] `NotificationSerializer`
* [x] CRUD viewsets created across the backend
* [x] Search and ordering support added where relevant

### 2b. Authentication Endpoints
* [x] `POST /api/accounts/register/`
* [x] `POST /api/accounts/token/`
* [x] `POST /api/accounts/token/refresh/`
* [x] `POST /api/accounts/token/verify/`
* [x] `GET /api/accounts/profile/`
* [x] `PATCH /api/accounts/profile/`
* [x] `POST /api/accounts/become-artist/`
* [x] `GET /api/accounts/artist-profile/`

### 2c. Basic CRUD ViewSets
* [x] `accounts`
  * [x] `UserViewSet`
  * [x] `ArtistProfileViewSet`
* [x] `artworks`
  * [x] `CategoryViewSet`
  * [x] `TagViewSet`
  * [x] `ArtworkViewSet`
  * [x] `ArtworkVersionViewSet`
  * [x] `ArtworkImageViewSet`
  * [x] `ArtworkTagViewSet`
* [x] `exhibitions`
  * [x] `ExhibitionViewSet`
  * [x] `ExhibitionArtworkViewSet`
* [x] `comments`
  * [x] `CommentViewSet`
  * [x] `FavoriteViewSet`
* [x] `reviews`
  * [x] `ExpertReviewViewSet`
* [x] `analytics`
  * [x] `ArtworkViewViewSet`
* [x] `ai`
  * [x] `AIGenerationViewSet`
* [x] `qr`
  * [x] `QRCodeViewSet`
  * [x] `QRScanViewSet`
* [x] `notifications`
  * [x] `NotificationViewSet`

### 2d. Permission Classes
* [x] `IsArtistOrReadOnly`
* [x] `IsExpertOrReadOnly`
* [x] `IsOwnerOrReadOnly`
* [x] `IsCanManageExhibitions`
* [x] `IsAdminOrReadOnly`
* [x] `IsSelfOrAdmin`
* [x] `IsArtistProfileOwnerOrAdmin`
* [x] ownership checks applied to artist profiles and core content views

### 2e. File Upload Handling
* [x] Artwork image upload endpoint
  * [x] `POST /api/artworks/{id}/upload_images/`
* [x] Artwork banner upload endpoint
  * [x] `POST /api/artworks/{id}/upload_banner/`
* [x] QR generation endpoint
  * [x] `POST /api/qr/codes/generate_qr/`
* [x] QR download endpoint
* [x] Local dev storage works through `MEDIA_ROOT`
* [x] Production storage works through Cloudinary
* [x] `qrcode` dependency added to backend requirements

### 2f. Testing
* [x] Authentication security tests
* [x] Permission enforcement tests
* [x] Artwork upload tests
* [x] QR generation and download tests
* [x] Search/filter smoke tests
* [x] Django system checks pass
* [x] Full backend test suite passes

---

## Phase 3 Completed (Frontend & Workflows)

### 3. Frontend Foundation
* [x] Create the React + Vite application structure
* [x] Define route layout for public and authenticated sections
* [x] Build a public layout with consistent navigation and footer
* [x] Build an auth layout for login/register flows
* [x] Set up a responsive design system for desktop and mobile
* [x] Add a shared loading state pattern and error boundary strategy
* [x] Create a reusable API client layer for backend requests
* [x] Add JWT token storage and session restoration

### 4. Authentication UI
* [x] Login page
* [x] Register page
* [x] Logout flow
* [x] Current user session loading on app startup
* [x] Protected routes for authenticated areas
* [x] Become-an-artist flow in the UI
* [x] Basic account/profile editing entry points

### 5. Public Browsing Pages
* [x] Home page
* [x] Explore artworks page
* [x] Artwork detail page
* [x] Artist profile page
* [x] Exhibition catalogue page
* [x] QR landing behavior for artwork pages
* [x] QR landing behavior for exhibition catalogues
* [x] Empty-state and loading-state handling for public pages

### 6. Artwork Management UI
* [x] Artist dashboard entry point for artworks
* [x] Create artwork form
* [x] Edit artwork form
* [x] Artwork image upload UI
* [x] Banner upload UI
* [x] Artwork publish/draft/archive controls
* [x] Category and tag selection UI
* [x] Artwork version history UI

### 7. Artist Statements UI
* [x] Markdown statement editor
* [x] Live preview panel
* [x] Version save flow
* [x] Version history list
* [x] Safe markdown rendering on the public artwork page
* [x] Markdown Tips toolbar and formatting guide

### 8. QR Code Workflow UI
* [x] Backend QR generation is complete
* [x] Show generated artwork QR codes in the artist dashboard
* [x] Show generated exhibition QR codes in the organizer dashboard
* [x] Add QR download buttons in the frontend
* [x] Make artwork QR links land on artwork detail pages
* [x] Make exhibition QR links land on exhibition catalogue pages

### 9. Exhibition Management UI
* [x] Create exhibition form
* [x] Edit exhibition form
* [x] Exhibition artwork linking UI
* [x] Exhibition visibility controls
* [x] Exhibition QR code display/download
* [x] Public exhibition catalogue page
* [x] Featured exhibitions on homepage
* [x] Exhibition slug routing

### 10. Public Engagement UI
* [x] Comment composer
* [x] Threaded comment reply UI
* [x] Favorite artwork toggle
* [x] Expert review display priority above comments
* [x] Guest-friendly read-only engagement views

### 11. Analytics Dashboard UI
* [x] Comment and favorite counts
* [x] Artist dashboard summary cards
* [x] QR scan summary metrics

### 12. AI Writing Assistant UI
* [x] Draft artist statement generation panel
* [x] Grammar and clarity rewrite panel
* [x] Exhibition summary draft panel
* [x] Curator intro draft panel
* [x] Save AI output for review before publishing (`POST /api/ai/generations/generate_draft/`)
* [x] Keep AI output separate from final published content (Artist review & approval panel)

### 13. Search and Discovery UI
* [x] Search artworks by title, category, tag, medium, and year
* [x] Search artists by name
* [x] Search exhibitions by title and location
* [x] Add filter and sort controls
* [x] Preserve search state in the URL

---

# Remaining Work

## 14. Notifications UI & Fine Polish

* [ ] Real-time notification center dropdown
* [ ] Mark notification as read UI
* [ ] Comment and review notifications push

## 15. End-to-End Test Suite

* [x] Production bundle build verification (`vite build`)
* [ ] E2E Cypress or Playwright test suite

## 16. Deployment & Release Readiness

* [ ] Add seed data script for production database
* [ ] Deploy frontend to Vercel
* [ ] Deploy backend to Render/Railway
* [ ] Connect production Neon PostgreSQL and Cloudinary

---

# Important Product Rules

* Do not add a single `role` field.
* Use capability flags like `is_artist`, `is_expert`, and `can_manage_exhibitions`.
* Artists are not automatically experts.
* AI must never publish content automatically.
* Artwork and exhibition pages should use stable slugs or UUIDs.
* Exhibitions are first-class entities, not just homepage content.
* Keep the MVP focused on publishing, exhibition browsing, QR access, comments, expert reviews, and analytics.
* Uploads must work locally in development and through Cloudinary in production.

---

# MVP Completion Criteria

The MVP is complete when:

* [x] Artists can register and become artists
* [x] Artists can upload artworks and write Markdown statements
* [x] Each artwork gets a QR code and public page
* [x] Exhibitions can be created and linked to artworks
* [x] Exhibition QR codes open exhibition catalogues
* [x] Guests can browse artworks and exhibitions without logging in
* [x] Lecturers can leave expert reviews
* [x] Users can leave comments and favorites
* [x] Artists can edit work while preserving version history
* [x] Artists can view analytics
* [x] AI helps with writing but never publishes automatically

---

# Phase 3 Completion Summary

* [x] Phase 1 complete (Backend foundations)
* [x] Phase 2 complete (Serializers, viewsets, permissions, tests)
* [x] Phase 3 complete (Frontend UI design style guide, artwork & exhibition management, QR workflows, AI assistant, public catalogue)
