# PROJECT_CONTEXT.md

# ArtLink

## Project Overview

LynqArt is a Digital Exhibition & Artist Statement Platform built primarily for artists. It enables artists to upload artworks, write artist statements using Markdown, generate QR codes that link directly to each artwork, receive expert critiques from lecturers, collect public feedback, and maintain a permanent archive of their artistic works.

The goal is not to create another online art marketplace. Instead, the platform focuses on improving the exhibition experience by allowing viewers to understand the meaning behind artworks even when the artist is unavailable.

The QR code serves as a bridge between physical exhibitions and digital content.

---

# Problem Statement

Printed artist statements have several limitations:

* Artists may not be available during exhibitions.
* Printed statements are difficult to read in crowded spaces.
* Visitors cannot easily keep a copy.
* Printed text is limited in length.
* There is no permanent digital archive.

ArtLink solves these problems by allowing every artwork to have its own webpage that can be accessed through a QR code.

---

# Target Users

## Artists

Can

* Register
* Upload artworks
* Edit artworks
* Write artist statements
* Generate QR codes
* View analytics
* Manage their gallery

---

## Lecturers (Experts)

Can

* Leave expert critiques
* Review artworks
* Receive expert verification badge

Expert reviews appear above public comments.

---

## Visitors

Can

* Browse artworks
* Scan QR codes
* Read statements
* View artist profiles
* Leave comments

Visitors do NOT need an account to view artworks.

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
