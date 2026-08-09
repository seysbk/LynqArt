# LynqArt

LynqArt is a digital exhibition and artist statement platform designed for artists, lecturers, and visitors. It connects physical artworks to permanent digital experiences through QR codes, allowing viewers to access artist statements, gallery details, reviews, and related context even when the artist is not present.

The platform is built to support meaningful engagement with art by making each work discoverable, explainable, and archiveable.

## Project Overview

LynqArt helps artists publish their work in a structured and engaging way by combining:

- artwork profiles and gallery pages
- markdown-based artist statements
- QR code access to each artwork
- public comments and expert reviews
- versioned statements for editing and preservation
- analytics for views and interactions
- optional AI assistance for writing support without automatic publishing

The project is not designed as a general marketplace. Instead, it is focused on exhibition visibility, context, and digital preservation.

## Problem Being Solved

Printed artist statements are often limited in several ways:

- they are difficult to read in crowded exhibition spaces
- they are not easily accessible to visitors after the event
- they cannot easily be updated or preserved over time
- they offer no permanent digital archive
- artists may not be available to explain their work in person

LynqArt solves this by giving every artwork a permanent public page that can be reached through a QR code.

## Target Users

### Artists
Artists can register, upload artworks, manage their portfolio, write artist statements, generate QR codes, and view analytics.

### Lecturers
Lecturers can review artworks and leave expert critiques that appear above public comments.

### Visitors
Visitors can browse the gallery, scan QR codes, read artist statements, view profiles, and leave feedback without needing an account.

## Core Features

### Authentication & Roles
- User registration and JWT authentication
- Permission flags: `is_artist`, `is_expert`, `is_verified`, `can_manage_exhibitions`
- Users start as regular members; become artists through "Become an Artist" action
- Experts appointed by Django admins
- Exhibition managers assigned by admins

### Artists & Profiles
- Artist profiles with bio, social links, and portfolio metadata
- Artist portfolio management
- Artwork upload and publication workflow
- Artist statement versioning and history

### Artworks & Exhibitions
- Artwork management with metadata and categorization
- Artwork versioning to preserve prior statements
- Exhibition management and curation
- Group artworks into exhibitions
- Mark exhibitions as featured

### Statements & Content
- Markdown artist statements with live preview
- Artwork version history to preserve prior statements
- Optional AI writing assistant for drafting and editing
- AI-generated content requires artist approval

### Engagement & Discovery
- QR code generation linked to permanent artwork URLs
- QR code tracking with scan analytics
- Expert review system with pinned reviews
- Public comments and discussion threads (threaded/nested)
- Search and filtering for artworks, artists, categories, and exhibitions
- Artwork analytics including views, QR scans, and engagement
- Favorite/bookmark system for visitors

### Notifications
- User notification system for interactions and events
- Read/unread tracking

### Viewing & Analytics
- Public gallery browsing (no authentication required)
- Artwork view analytics with visitor tracking
- QR scan tracking
- User engagement metrics

## Quick Start

### Backend Setup (Django)

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (see docs/ENVIRONMENT_SETUP.md for detailed guide)
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`
Admin interface at `http://localhost:8000/admin`

**For detailed environment configuration (databases, email, storage, etc.):**
👉 See [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)

## Technology Stack

### Frontend
- React
- Vite
- React Router
- Axios
- React Markdown
- Tailwind CSS

### Backend
- Django 5.2.6
- Django REST Framework 3.16.1
- Django REST Framework SimpleJWT 5.5.1
- Django CORS Headers 4.9.0
- Python qrcode
- Pillow

### Database
- SQLite 3 (development)
- PostgreSQL via Neon (production)

### Storage & Services
- Cloudinary (optional, for production image/QR storage)
- OpenAI API (optional, for AI writing assistance)

### Deployment
- Frontend: Vercel
- Backend: Render, Railway, or similar
- Database: Neon PostgreSQL
- Storage: Cloudinary

## System Architecture

The application follows a simple layered architecture:

React Frontend
  -> Django REST API
  -> PostgreSQL Database
  -> Cloudinary for image and QR storage

This design keeps the backend API ready for future expansion, including mobile clients or additional integrations.

## Data Model Overview

The system is built around a set of core entities:

- User
- ArtistProfile
- Artwork
- ArtworkVersion
- ArtworkImage
- Category
- Tag
- QRCode
- Exhibition
- ExpertReview
- Comment
- Favorite
- ArtworkView
- QRScan
- Notification
- AI generation record

The schema supports versioned artwork statements, public review workflows, and anonymous analytics tracking while protecting personal data.

## QR Code Workflow

The QR flow is a central part of the product:

1. Artist uploads artwork
2. Artwork is reviewed and published
3. Backend generates a permanent public URL
4. QR code is generated for the artwork
5. QR code image is stored in Cloudinary
6. Artist downloads and places the QR on the physical work
7. Visitor scans the QR
8. Visitor opens the artwork page and reads the statement

Permanent slugs or UUID-based URLs are preferred over numeric IDs to ensure stable access and reliable metadata.

## AI Philosophy

AI is treated as a writing assistant rather than an autonomous content publisher.

It supports artists by:

- generating draft statements
- correcting grammar
- improving clarity
- creating summary text for exhibitions

AI-generated content must always be reviewed and approved by the artist before publication. The platform must continue to function completely even when AI features are disabled.

## Versioning Approach

Artist statements are never overwritten. Each edit creates a new version record, which allows artists to:

- review previous statements
- restore prior versions
- maintain a consistent publication history
- preserve the latest version associated with the current QR code

This is important for accountability, revision tracking, and exhibition continuity.

## Analytics Strategy

The platform tracks engagement without exposing personally identifiable visitor data.

Key metrics include:

- total views
- unique visitors
- QR scans
- comments
- favorites

Guest visits are tracked using anonymous identifiers and browser-based hashing techniques to avoid inflating counts from repeated refreshes.

## MVP Completion Criteria

The minimum viable product is considered complete when:

- artists can register
- artists can upload artworks
- artists can write markdown statements
- each artwork generates a QR code
- guests can view artwork pages without sign-in
- lecturers can leave expert reviews
- users can leave comments
- artists can edit work while preserving version history
- artists can access analytics
- AI assists with writing but never publishes automatically

## Repository Structure

- `backend/`: Django REST API project
- `docs/`: Project documentation and guides
- `frontend/`: (Planned) Vite + React frontend application

## Documentation

Comprehensive project documentation is located in the [`docs/`](docs/) directory:

- [Documentation Index](docs/DOCUMENTATION_INDEX.md)
- [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)
- [API Reference](docs/API_REFERENCE.md)
- [Project Context & Architecture](docs/ProjectContext.md)
- [Database Schema Reference](docs/db.Structure.txt)
- [Development Guidelines](docs/Prompt.md)
- [Project Build Plan & TODO](docs/ToDo.md)
- [Phase 1 Completion Summary](docs/PHASE_1_COMPLETE.md)
- [Phase 2 Completion Summary](docs/PHASE_2_COMPLETE.md)

## Long-Term Vision

Future growth could include:

- mobile application support
- virtual exhibitions
- audio artist statements
- multi-language support
- archive and department-based browsing
- AI accessibility features
- visitor heat maps
- offline exhibition mode

## Summary

LynqArt is a focused digital exhibition platform designed to connect artworks with their meaning. By combining public-facing artwork pages, QR access, versioned artist statements, public discussion, and expert review, the project creates a lasting digital layer for physical exhibitions.

The product is intentionally centered on clarity, accessibility, and preservation rather than commerce. Its core mission is to help viewers understand and appreciate artworks through the artist's own voice.
