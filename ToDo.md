# TODO.md - LynqArt Build Plan

> Digital exhibition and artist statement platform
>
> Stack:
>
> * Frontend: React + Vite
> * Backend: Django + Django REST Framework
> * Database: PostgreSQL (Neon)
> * Storage: Cloudinary
> * Auth: JWT
> * Markdown: react-markdown
> * QR codes: Python `qrcode`
>
> Goal:
> Build a complete, maintainable exhibition platform with permanent artwork and exhibition pages.

---

# Already in Project

## Context and schema

* [x] `ProjectContext.md` updated with the exhibition-first product direction
* [x] `db.Structure.txt` exists and defines the target data model

## Django models

* [x] User and artist profile models
* [x] Artwork, versions, images, tags, categories
* [x] Comments and favorites
* [x] Expert reviews
* [x] QR code and scan models
* [x] Analytics and AI generation models
* [x] Notification model
* [x] Exhibition models

## Model alignment fixes

* [x] Added `can_manage_exhibitions` to `User`
* [x] Added UUID default to `Exhibition.id`
* [x] Updated QR model to support artwork or exhibition targets

---

# MVP Backlog

## 1. Backend foundation

* [x] Confirm app list and settings for accounts, artworks, exhibitions, comments, reviews, analytics, ai, qr, notifications
* [x] Register custom user model in Django settings
* [x] Add database migrations for the current models
* [x] Verify app imports and circular dependency safety
* [x] Configure CORS, media storage, and env vars

## 2. Authentication and permissions

* [ ] Register
* [ ] Login
* [ ] Refresh token
* [ ] Logout
* [ ] Current user endpoint
* [ ] Permission checks for artist actions
* [ ] Permission checks for exhibition organizers
* [ ] Admin-only expert assignment

## 3. Artist profile flow

* [ ] Create artist profile when a user becomes an artist
* [ ] Public artist profile page
* [ ] Edit bio, links, avatar, phone, location
* [ ] Show artist artworks and exhibition participation

## 4. Artwork publishing

* [ ] Create artwork CRUD endpoints
* [ ] Upload artwork image(s)
* [ ] Publish / draft / archive artwork states
* [ ] Category and tag assignment
* [ ] Artwork detail page
* [ ] Public artwork slug routing

## 5. Artist statements

* [ ] Markdown statement editor
* [ ] Live preview
* [ ] Save statement versions
* [ ] Restore prior version
* [ ] Render statement safely on public pages

## 6. QR code workflows

* [ ] Generate artwork QR codes
* [ ] Generate exhibition QR codes
* [ ] Store QR image URLs
* [ ] Download QR image
* [ ] Route artwork QR to artwork page
* [ ] Route exhibition QR to exhibition catalogue

## 7. Exhibition system

* [ ] Exhibition CRUD endpoints
* [ ] Exhibition artwork linking
* [ ] Public exhibition catalogue page
* [ ] Featured exhibitions on homepage
* [ ] Exhibition organizer permissions
* [ ] Exhibition slug routing

## 8. Public engagement

* [ ] Public comments on artworks
* [ ] Threaded replies
* [ ] Expert reviews above public comments
* [ ] Favorites for artworks
* [ ] Anonymous view tracking

## 9. Analytics dashboard

* [ ] Artwork views
* [ ] QR scans
* [ ] Unique visitor tracking
* [ ] Comment and favorite counts
* [ ] Artist dashboard summary cards

## 10. AI writing assistant

* [ ] Draft artist statement generation
* [ ] Grammar and clarity rewrite
* [ ] Exhibition summary draft
* [ ] Curator intro draft
* [ ] Save AI output for review before publishing

## 11. Search and discovery

* [ ] Search artworks by title, category, tag, medium, year
* [ ] Search artists by name
* [ ] Search exhibitions by title and location
* [ ] Basic filter and sort controls

## 12. Notifications

* [ ] Notify artists about comments
* [ ] Notify artists about expert reviews
* [ ] Notify users about relevant engagement
* [ ] Notification read state

## 13. Frontend app shell

* [ ] Public layout
* [ ] Auth layout
* [ ] Navigation
* [ ] Footer
* [ ] Responsive design system
* [ ] API client and auth state handling

## 14. Core pages

* [ ] Home
* [ ] Explore artworks
* [ ] Artwork detail
* [ ] Artist profile
* [ ] Exhibition catalogue
* [ ] Login
* [ ] Register
* [ ] Artist dashboard
* [ ] Upload artwork
* [ ] Manage exhibition

## 15. Release readiness

* [ ] Add seed data for local testing
* [ ] Document setup steps
* [ ] Document API endpoints
* [ ] Add basic tests for models and critical flows
* [ ] Verify production env variables
* [ ] Deploy backend
* [ ] Deploy frontend

---

# Important Product Rules

* Do not add a single `role` field.
* Use capability flags like `is_artist`, `is_expert`, and `can_manage_exhibitions`.
* Artists are not automatically experts.
* AI must never publish content automatically.
* Artwork and exhibition pages should use stable slugs or UUIDs.
* Exhibitions are first-class entities, not just homepage content.
* Keep the MVP focused on publishing, exhibition browsing, QR access, comments, expert reviews, and analytics.

---

# MVP Completion Criteria

The MVP is complete when:

* [ ] Artists can register and become artists
* [ ] Artists can upload artworks and write Markdown statements
* [ ] Each artwork gets a QR code and public page
* [ ] Exhibitions can be created and linked to artworks
* [ ] Exhibition QR codes open exhibition catalogues
* [ ] Guests can browse artworks and exhibitions without logging in
* [ ] Lecturers can leave expert reviews
* [ ] Users can leave comments and favorites
* [ ] Artists can edit work while preserving version history
* [ ] Artists can view analytics
* [ ] AI helps with writing but never publishes automatically
