# PROJECT_CONTEXT.md

# LynqArt

## Project Overview

LynqArt is a digital exhibition and artist statement platform. All users register as regular users first. Guests can browse the platform without an account, while registered users gain additional capabilities depending on permission flags rather than a single role field.

The platform supports public exhibition viewing, artist publishing workflows, expert critique, and future expansion for additional user capability types. The goal is to provide a digital archive of artistic work while keeping access permissions flexible and extensible.

The QR code serves as a bridge between physical exhibitions and digital content.

---

# Problem Statement

Printed artist statements have several limitations:

* Artists may not be available during exhibitions.
* Printed statements are difficult to read in crowded spaces.
* Visitors cannot easily keep a copy.
* Printed text is limited in length.
* There is no permanent digital archive.

LynqArt solves these problems by allowing every artwork to have its own webpage that can be accessed through a QR code.

---

# Target Users

## Guest (Unauthenticated)

Can

* Browse artworks
* Scan QR codes
* View artist statements
* View artist profiles
* Search artworks
* View comments and expert reviews

Cannot

* Comment
* Favorite artworks
* Follow artists
* Upload artworks

---

## Registered User

All accounts start as a regular registered user.

Can

* Manage their profile
* Comment on artworks
* Reply to comments
* Favorite artworks
* Follow artists (future feature)

A registered user is not automatically an artist.

---

## Artist

A registered user may become an artist by taking a "Become an Artist" action inside the platform.

Can

* Upload artworks
* Edit artworks
* Write Markdown artist statements
* Generate QR codes
* View analytics
* Use the AI writing assistant
* Manage their gallery
* Access the artist dashboard

Artists retain all regular user permissions.

An artist profile is created only when the user becomes an artist.

---

## Expert / Lecturer

Experts are never self-assigned.

Only an administrator grants expert privileges in Django Admin.

Can

* Leave expert reviews
* Receive an expert badge
* Have their reviews displayed above public comments

Experts may also be artists.

---

## Administrator

Administrators are created through Django's administration system.

Can

* Manage users
* Verify experts
* Moderate content
* Manage reported comments
* Manage featured artworks
* Perform full platform administration

No public registration path exists for administrators.

---

# Tech Stack

## Frontend

* React
* Vite
* React Router
* Axios
* React Markdown
* Tailwind CSS (or CSS Modules)

---

## Backend

* Django
* Django REST Framework
* JWT Authentication
* Python qrcode
* Pillow

---

## Database

PostgreSQL (Neon)

---

## Storage

Cloudinary

Images and QR codes are stored outside the database.

Only metadata is stored in PostgreSQL.

---

## Deployment

Frontend

Vercel

Backend

Render

Database

Neon

---

# Permission Model

Do not use a single `role` field such as:

* role = artist
* role = lecturer
* role = admin

Instead, use independent permission flags.

Example:

```python
class User(AbstractUser):
    is_artist = models.BooleanField(default=False)
    is_expert = models.BooleanField(default=False)
```

Continue using Django's built-in `is_staff` and `is_superuser` for administrative access.

This design allows one user to simultaneously be:

* a regular user and artist,
* an artist and expert,
* or even an administrator and artist.

---

# Authentication Philosophy

Authentication identifies who the user is.

Permissions determine what the user is allowed to do.

Avoid coupling identity to a single role.

Use permissions or capability flags instead.

---

# Architecture

React Frontend

↓

Django REST API

↓

PostgreSQL

↓

Cloudinary

The backend exposes REST APIs that can later be consumed by a React Native mobile application without requiring major backend changes.

---

# Major Features

* Authentication
* Artist Profiles
* Artwork Upload
* Markdown Artist Statements
* Live Markdown Preview
* QR Code Generation
* Expert Reviews
* Public Comments
* Artwork Version History
* Search
* Analytics
* AI Writing Assistant

---

# Future Extensibility

This permission-based architecture should make it easy to add future capabilities without redesigning the database.

Examples include:

* Verified Artist
* Curator
* Exhibition Organizer
* Moderator
* Department Representative

---

# AI Philosophy

AI is NOT responsible for creating artworks.

AI is only a writing assistant.

It assists artists by

* Generating draft artist statements
* Correcting grammar
* Improving clarity
* Creating exhibition summaries

The artist always reviews and edits AI output before publishing.

AI should never automatically publish content.

The application should still function completely if AI is disabled.

---

# QR Code Workflow

Artist uploads artwork

↓

Publishes artwork

↓

Backend generates permanent URL

↓

Backend generates QR Code

↓

QR Code stored in Cloudinary

↓

Artist downloads QR Code

↓

QR attached to physical artwork

↓

Visitor scans QR

↓

Artwork page opens

QR codes should always point to permanent slugs or UUIDs instead of numeric IDs.

---

# Version History

Artist statements should never be overwritten.

Every edit creates a new ArtworkVersion record.

Artists can

* View previous versions
* Restore previous versions

The QR code always points to the latest published version.

---

# Analytics

Track

* Total views
* Unique visitors
* QR scans
* Comments
* Favorites

Guests are tracked anonymously using hashed identifiers and browser cookies to avoid counting repeated refreshes as new visits.

No personally identifiable visitor information should be displayed to artists.

---

# Database Design

Main models

User

ArtistProfile

Artwork

ArtworkVersion

Comment

ExpertReview

QRCode

ArtworkView

Favorite

Notification

Department

Category

Tag

---

# Coding Standards

Backend

* Follow PEP 8.
* Use class-based DRF views where appropriate.
* Keep business logic in services or model methods where practical.
* Validate all serializer inputs.
* Use UUIDs or slugs for public-facing URLs.

Frontend

* Use functional React components.
* Use hooks.
* Keep components small and reusable.
* Prefer composition over duplication.
* Keep API logic in dedicated service files.

General

* Write meaningful commit messages.
* Avoid duplicate code.
* Keep functions focused on one responsibility.
* Document non-obvious logic.

---

# Current Development Status

This file should be updated after every completed phase.

Current Phase:

Phase 0

Completed:

None

Next Task:

Initialize backend project.

---

# Long-Term Vision

Future versions may include

* Mobile application
* Virtual exhibitions
* Audio artist statements
* Multi-language support
* Department archives
* Exhibition collections
* AI accessibility tools
* Visitor heat maps
* Offline exhibition mode

---

# Guiding Principle

Every feature should support one central idea:

Help viewers understand and appreciate artworks by connecting them directly to the artist's voice.
