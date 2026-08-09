# PROJECT_CONTEXT.md

# LynqArt

## Project Overview

LynqArt is a digital exhibition management and artist statement platform that connects physical and digital art experiences through QR codes. It enables artists to publish artworks, write rich Markdown artist statements, participate in exhibitions, receive expert critiques, and preserve their work in a permanent digital archive.

All users register as regular users first. Guests can browse the platform without an account, while registered users gain additional capabilities depending on permission flags rather than a single role field.

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

LynqArt solves these problems by allowing every artwork and exhibition to have a permanent digital page that can be accessed through a QR code.

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
* Browse exhibition catalogues

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

## Exhibition Organizer

An exhibition organizer is a user with permission to manage exhibition content.

Can

* Create and edit exhibitions
* Add artworks to exhibitions
* Generate exhibition QR codes
* Manage exhibition visibility
* Review exhibition analytics

This capability is granted through permissions rather than a hard-coded role.

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
* Manage exhibitions
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
* Tailwind CSS or CSS Modules

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
    can_manage_exhibitions = models.BooleanField(default=False)
```

Continue using Django's built-in `is_staff` and `is_superuser` for administrative access.

This design allows one user to simultaneously be:

* a regular user and artist,
* an artist and expert,
* an exhibition organizer and artist,
* or even an administrator and artist.

---

# Core Design Principles

LynqArt is built around four core principles.

1. Every artwork has a story.

Every artwork should have an accompanying artist statement that helps viewers understand the artist's intent.

2. Physical and digital exhibitions should complement each other.

QR codes connect physical artworks to richer digital experiences without distracting from the artwork itself.

3. Artists retain ownership of their work.

LynqArt assists artists through AI writing tools but never replaces the artist's creative voice.

4. Preserve artistic history.

Artworks and exhibitions should remain accessible long after physical exhibitions have ended, creating a permanent digital archive.

---

# Authentication Philosophy

Authentication identifies who the user is.

Permissions determine what the user is allowed to do.

Avoid coupling identity to a single role.

Use permissions or capability flags instead.

---

# Architecture

React Frontend

-> Django REST API

-> PostgreSQL

-> Cloudinary

The backend exposes REST APIs that can later be consumed by a React Native mobile application without requiring major backend changes.

---

# Major Features

* Authentication
* Artist Profiles
* Artwork Upload
* Markdown Artist Statements
* Live Markdown Preview
* QR Code Generation
* Exhibition Management
* Exhibition QR Codes
* Exhibition Catalogues
* Artwork Exhibition Associations
* Homepage Featured Exhibitions
* Expert Reviews
* Public Comments
* Artwork Version History
* Search
* Analytics
* AI Writing Assistant

---

# Exhibition System

Exhibitions are first-class entities within LynqArt.

An exhibition represents a curated collection of artworks and may correspond to:

* University exhibitions
* Department showcases
* Galleries
* Competitions
* Festivals
* Personal exhibitions

Each exhibition contains:

* Title
* Banner
* Description in Markdown
* QR Code
* Start and End Dates
* Organizer
* Location
* Artwork Collection

An artwork may belong to multiple exhibitions.

Exhibitions remain accessible after they end, creating a permanent digital archive.

---

# AI Philosophy

AI is NOT responsible for creating artworks.

AI is only a writing assistant.

It assists artists by

* Generating draft artist statements
* Correcting grammar
* Improving clarity
* Generating exhibition summaries
* Improving curator introductions
* Suggesting keywords and tags
* Improving accessibility text in future versions

The artist always reviews and edits AI output before publishing.

AI should never automatically publish content.

The application should still function completely if AI is disabled.

---

# QR Code Workflow

## Artwork QR

Artist uploads artwork

->

Publishes artwork

->

Backend generates permanent URL

->

Backend generates QR Code

->

QR Code stored in Cloudinary

->

Artist downloads QR Code

->

QR attached to physical artwork

->

Visitor scans QR

->

Artwork page opens

QR codes should always point to permanent slugs or UUIDs instead of numeric IDs.

## Exhibition QR

Exhibition created

->

Backend generates exhibition QR code

->

QR Code stored in Cloudinary

->

Organizer places QR on exhibition material

->

Visitor scans QR

->

Exhibition catalogue opens

->

Visitor browses artworks

->

Visitor opens individual artwork

Exhibition QR codes should lead to a catalogue or landing page for the exhibition, not directly to a single artwork unless that is the intended presentation.

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

* User
* ArtistProfile
* Artwork
* ArtworkVersion
* ArtworkImage
* Category
* Tag
* Exhibition
* ExhibitionArtwork
* QRCode
* Comment
* ExpertReview
* Favorite
* ArtworkView
* QRScan
* AIGeneration
* Notification

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

Phase 2

Completed:

Phase 1
Phase 2

Next Task:

Frontend app shell and public pages.

---

# Long-Term Vision

Future versions may include

* Mobile application
* Virtual exhibitions
* Exhibition catalogue PDF export
* Curator notes
* Exhibition maps
* Audio artist statements
* Multi-language support
* AI accessibility descriptions
* Visitor heat maps
* Exhibition attendance tracking
* Digital certificates for exhibitions
* Public API
* Offline exhibition mode

---

# Guiding Principle

Every feature should support one central idea:

Help viewers understand and appreciate artworks by connecting them directly to the artist's voice.
