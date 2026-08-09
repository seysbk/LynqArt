# TODO.md - LynqArt Build Plan

> Digital exhibition and artist statement platform
>
> Stack:
>
> * Frontend: React + Vite
> * Backend: Django + Django REST Framework
> * Database: PostgreSQL (Neon)
> * Storage: Local in development, Cloudinary in production
> * Auth: JWT
> * Markdown: react-markdown
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
  * [x] streams local files in development
  * [x] falls back to returning the hosted URL in production
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

# Remaining Work

## 3. Frontend Foundation

* [ ] Create the React + Vite application structure
* [ ] Define route layout for public and authenticated sections
* [ ] Build a public layout with consistent navigation and footer
* [ ] Build an auth layout for login/register flows
* [ ] Set up a responsive design system for desktop and mobile
* [ ] Add a shared loading state pattern and error boundary strategy
* [ ] Create a reusable API client layer for backend requests
* [ ] Add JWT token storage and session restoration

## 4. Authentication UI

* [ ] Login page
* [ ] Register page
* [ ] Logout flow
* [ ] Current user session loading on app startup
* [ ] Protected routes for authenticated areas
* [ ] Become-an-artist flow in the UI
* [ ] Basic account/profile editing entry points

## 5. Public Browsing Pages

* [ ] Home page
* [ ] Explore artworks page
* [ ] Artwork detail page
* [ ] Artist profile page
* [ ] Exhibition catalogue page
* [ ] QR landing behavior for artwork pages
* [ ] QR landing behavior for exhibition catalogues
* [ ] Empty-state and loading-state handling for public pages

## 6. Artwork Management UI

* [ ] Artist dashboard entry point for artworks
* [ ] Create artwork form
* [ ] Edit artwork form
* [ ] Artwork image upload UI
* [ ] Banner upload UI
* [ ] Artwork publish/draft/archive controls
* [ ] Category and tag selection UI
* [ ] Artwork version history UI
* [ ] Restore prior version action

## 7. Artist Statements UI

* [ ] Markdown statement editor
* [ ] Live preview panel
* [ ] Version save flow
* [ ] Version history list
* [ ] Restore previous version action
* [ ] Safe markdown rendering on the public artwork page

## 8. QR Code Workflow UI

* [x] Backend QR generation is complete
* [ ] Show generated artwork QR codes in the artist dashboard
* [ ] Show generated exhibition QR codes in the organizer dashboard
* [ ] Add QR download buttons in the frontend
* [ ] Make artwork QR links land on artwork detail pages
* [ ] Make exhibition QR links land on exhibition catalogue pages

## 9. Exhibition Management UI

* [ ] Create exhibition form
* [ ] Edit exhibition form
* [ ] Exhibition artwork linking UI
* [ ] Exhibition visibility controls
* [ ] Exhibition QR code display/download
* [ ] Public exhibition catalogue page
* [ ] Featured exhibitions on homepage
* [ ] Exhibition slug routing

## 10. Public Engagement UI

* [ ] Comment composer
* [ ] Threaded comment reply UI
* [ ] Favorite artwork toggle
* [ ] Expert review display priority above comments
* [ ] Guest-friendly read-only engagement views
* [ ] Anonymous view tracking hooks

## 11. Analytics Dashboard UI

* [ ] Artwork views summary
* [ ] QR scan summary
* [ ] Unique visitor display
* [ ] Comment and favorite counts
* [ ] Artist dashboard summary cards
* [ ] Exhibition analytics overview

## 12. AI Writing Assistant UI

* [ ] Draft artist statement generation panel
* [ ] Grammar and clarity rewrite panel
* [ ] Exhibition summary draft panel
* [ ] Curator intro draft panel
* [ ] Save AI output for review before publishing
* [ ] Keep AI output separate from final published content

## 13. Search and Discovery UI

* [ ] Search artworks by title, category, tag, medium, and year
* [ ] Search artists by name
* [ ] Search exhibitions by title and location
* [ ] Add filter and sort controls
* [ ] Preserve search state in the URL

## 14. Notifications UI

* [ ] Notification center
* [ ] Mark notification as read
* [ ] Comment and review notifications
* [ ] Engagement notifications
* [ ] Unread count badge

## 15. Frontend Testing

* [ ] Component tests for core UI pieces
* [ ] Auth flow tests
* [ ] Route protection tests
* [ ] API integration tests
* [ ] Upload flow tests
* [ ] QR flow tests

## 16. Release Readiness

* [ ] Add seed data for local testing
* [ ] Verify frontend environment variables
* [ ] Document frontend setup steps
* [ ] Document deployment steps
* [ ] Deploy frontend
* [ ] Connect frontend to production backend

## 17. Integration and Polish

* [ ] Connect artwork QR routes to permanent public artwork pages
* [ ] Connect exhibition QR routes to permanent exhibition catalogue pages
* [ ] Validate search, filters, and ordering in the frontend
* [ ] Validate notification delivery and read-state updates
* [ ] Validate analytics values in the dashboard
* [ ] Tighten UX for empty states, loading states, and error states

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

# Phase 2 Completion Notes

## What Phase 2 delivered

* [x] Serializers for every active backend app
* [x] CRUD viewsets for all core models
* [x] Authentication endpoints for register and token handling
* [x] Permission classes for artist, expert, owner, and exhibition access
* [x] File upload handling for artworks and QR codes
* [x] Local storage and Cloudinary-compatible upload behavior
* [x] Full backend test coverage for critical API flows

## Current Status

* [x] Phase 1 complete
* [x] Phase 2 complete
* [ ] Phase 3 frontend implementation

---

# Next Recommended Work

1. Build the frontend shell and auth flow.
2. Add public artwork and exhibition pages.
3. Connect the upload and QR workflows to the UI.
4. Add richer dashboard screens for artists and organizers.
5. Keep extending tests as each frontend/backend slice lands.
