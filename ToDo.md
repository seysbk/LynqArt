# TODO.md - LynqArt Development Roadmap

> Digital Exhibition & Artist Statement Platform
>
> Stack:
>
> * Frontend: React + Vite
> * CSS: Tailwind CSS
> * Backend: Django + Django REST Framework
> * Database: PostgreSQL (Neon)
> * Image Storage: Cloudinary
> * Authentication: JWT
> * AI: OpenAI (optional, pluggable)
> * Markdown: react-markdown + remark plugins
> * QR Codes: Python qrcode library
>
> Development Philosophy:
> Complete one phase before moving to the next. Every phase should leave the application in a working state.

---

# Phase 0 — Planning

## Goals

* [ ] Create GitHub repository
* [ ] Initialize README
* [ ] Decide project structure
* [ ] Draw database ERD
* [ ] Create UI wireframes
* [ ] List MVP features
* [ ] List future features

Deliverables

* ER Diagram
* API endpoint list
* Component tree
* Folder structure

---

# Phase 1 — Backend Setup

## Django

* [ ] Create Django project
* [ ] Create virtual environment
* [ ] Install DRF
* [ ] Install JWT
* [ ] Configure PostgreSQL
* [ ] Configure CORS
* [ ] Configure environment variables
* [ ] Create base settings

Apps

* [ ] accounts
* [ ] artworks
* [ ] comments
* [ ] reviews
* [ ] analytics
* [ ] ai
* [ ] qr

Deliverables

Working API

---

# Phase 2 — React Setup

* [ ] Create React app
* [ ] Install React Router
* [ ] Configure Axios
* [ ] Authentication context
* [ ] Layout
* [ ] Navbar
* [ ] Footer
* [ ] Theme

Pages

* Home
* Explore
* Artwork
* Artist
* Login
* Register
* My Gallery
* Dashboard
* Upload Artwork

Deliverables

Responsive frontend skeleton

---

# Phase 3 — Authentication

Backend

* [ ] Register
* [ ] Login
* [ ] Refresh token
* [ ] Logout
* [ ] Profile endpoint

Frontend

* [ ] Login form
* [ ] Register form
* [ ] Protected routes
* [ ] Persist login

Roles

* Artist
* Lecturer
* Admin

Deliverables

Secure authentication

---

# Phase 4 — Artist Profiles

Artist Profile

* [ ] Bio
* [ ] Profile picture
* [ ] Social links
* [ ] Contact links
* [ ] Department
* [ ] Portfolio

Deliverables

Public artist profile

---

# Phase 5 — Artwork Upload

Fields

* Title
* Image
* Medium
* Category
* Dimensions
* Year
* Tags
* Description

Features

* [ ] Upload image
* [ ] Edit artwork
* [ ] Delete artwork
* [ ] Draft mode
* [ ] Publish mode

Deliverables

Artists can upload work

---

# Phase 6 — Markdown Artist Statements

Backend

* [ ] Store Markdown
* [ ] Version table

Frontend

* [ ] Markdown editor
* [ ] Live preview
* [ ] Toolbar
* [ ] Syntax guide

Deliverables

Frontend Mentor style editor

---

# Phase 7 — Artwork Versions

Tables

Artwork

ArtworkVersion

Features

* [ ] Save versions
* [ ] Restore versions
* [ ] Current version
* [ ] Version history

Deliverables

Complete version system

---

# Phase 8 — QR Code System

Backend

* [ ] Generate QR
* [ ] Save QR image
* [ ] Download QR

Routes

/artwork/{slug}

/qr/{slug}

Workflow

Upload artwork

↓

Publish

↓

Generate QR

↓

Save QR

↓

Download

↓

Print

↓

Visitor scans

↓

Artwork page

Deliverables

Permanent QR code system

---

# Phase 9 — Public Gallery

Guest users can

* Browse artworks
* Search artists
* Filter
* View profiles
* View statements

No login required.

Deliverables

Digital exhibition

---

# Phase 10 — Comments

Guest

Read only

Registered

Comment

Artist

Reply

Features

* Edit
* Delete
* Report

Deliverables

Discussion system

---

# Phase 11 — Expert Reviews

Roles

Lecturer

Features

* Verified badge
* Pin review
* Rich formatting
* Academic critique

Review appears above comments.

Deliverables

Expert review system

---

# Phase 12 — Analytics

Track

* Artwork views
* Unique visitors
* QR scans
* Comments
* Favorites

Dashboard

Views

QR scans

Weekly views

Monthly views

Deliverables

Artist dashboard

---

# Phase 13 — AI Assistant

Important

AI never publishes automatically.

Workflow

Artist enters notes

↓

AI generates draft

↓

Artist edits

↓

Preview

↓

Save

AI Features

* Artist statement
* Grammar correction
* Rewrite
* Short summary
* Exhibition description

Future

* Accessibility descriptions
* Translation

Deliverables

AI writing assistant

---

# Phase 14 — Search

Search by

* Artist
* Title
* Category
* Department
* Medium
* Year

Deliverables

Search engine

---

# Phase 15 — Favorites

Users can

* Favorite artwork
* Save artists

Deliverables

Collections

---

# Phase 16 — Notifications

Artist notified when

* Comment added
* Review added
* Favorite received

Deliverables

Notification center

---

# Phase 17 — Admin

Manage

Users

Artworks

Reviews

Reports

Experts

Departments

Deliverables

Admin dashboard

---

# Phase 18 — Deployment

Backend

Render

Frontend

Vercel

Database

Neon

Images

Cloudinary

Deliverables

Production system

---

# Phase 19 — Documentation

Create

README

API docs

Installation guide

ERD

Architecture diagram

Screenshots

User manual

Deployment guide

Deliverables

Project documentation

---

# Future Features

* Mobile app
* Audio artist statements
* Virtual exhibitions
* Exhibition collections
* AI artwork explanation
* Multi-language support
* Email notifications
* Certificates
* Awards
* Exhibition timeline
* Visitor heat maps
* Department archive
* Offline exhibition mode

---

# AI Development Rules

## Rule 1

Never ask an AI to build multiple phases at once.

---

## Rule 2

Each prompt should focus on one feature.

Examples

✅ Build the Artwork model.

❌ Build the entire backend.

---

## Rule 3

Commit after every completed feature.

---

## Rule 4

Test before asking AI for the next feature.

---

## Rule 5

Read and understand every generated line of code before accepting it.

---

## Rule 6

When changing LLMs, provide only the current phase, relevant files, and the specific task. Do not ask the new model to infer the whole project.

---

## Rule 7

Keep a PROJECT_CONTEXT.md file containing:

* Project overview
* Tech stack
* Folder structure
* Database schema
* API endpoints
* Coding conventions
* Current phase
* Known issues
* Next task

Paste or attach this file whenever switching to a different LLM so it immediately has the context it needs.

---

# MVP Completion Criteria

The MVP is complete when:

✓ Artists can register.

✓ Artists can upload artworks.

✓ Artists can write Markdown artist statements.

✓ Each artwork receives a QR code.

✓ Guests can scan and view artworks without logging in.

✓ Lecturers can leave expert reviews.

✓ Users can leave comments.

✓ Artists can edit their work while preserving version history.

✓ Artists can view analytics.

✓ AI assists with writing artist statements but never publishes automatically.

Only after these are complete should future enhancements be implemented.
