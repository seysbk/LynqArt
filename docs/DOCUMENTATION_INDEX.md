# 📖 LynqArt Documentation Index

Welcome to LynqArt! This document provides a quick reference to all available documentation.

## 🎯 Start Here

1. **[README.md](../README.md)** - Project overview, quick start guide, technology stack
2. **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Complete guide for configuring environment variables

## 📚 Core Documentation

### Project Understanding
- **[ProjectContext.md](ProjectContext.md)** - Architecture, design decisions, permission model, data flow
- **[db.Structure.txt](db.Structure.txt)** - Database schema reference with all tables and fields

### Development Guidance
- **[Prompt.md](Prompt.md)** - Development rules, coding standards, expected response format
- **[ToDo.md](ToDo.md)** - Project roadmap and feature list by phase
- **[PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)** - Completion summary and next steps for Phase 2
- **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** - Phase 2 API completion summary

### API Development
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API endpoint documentation with examples

## 🚀 Quick Start

### Backend Setup (Local Development)

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings (default values work for local development)

# 5. Run migrations
python manage.py migrate

# 6. Create superuser (for admin access)
python manage.py createsuperuser

# 7. Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`
Admin panel at: `http://localhost:8000/admin`

## 📋 Documentation by Role

### For Project Managers / Stakeholders
1. Read: [README.md](../README.md) - Project overview and features
2. Read: [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) & [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) - Completion status and timeline
3. Reference: [ToDo.md](ToDo.md) - Feature roadmap

### For Backend Developers
1. Read: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Environment configuration
2. Read: [ProjectContext.md](ProjectContext.md) - Architecture and design
3. Reference: [API_REFERENCE.md](API_REFERENCE.md) - API specifications
4. Reference: [db.Structure.txt](db.Structure.txt) - Database schema
5. Follow: [Prompt.md](Prompt.md) - Development standards

### For Frontend Developers
1. Read: [API_REFERENCE.md](API_REFERENCE.md) - API endpoints and examples
2. Read: [ProjectContext.md](ProjectContext.md) - Data model overview
3. Reference: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Backend setup (to run locally)
4. Reference: [README.md](../README.md) - Technology stack

### For DevOps / Deployment
1. Read: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - All configuration options
2. Read: [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md#next-steps-phase-2) - Deployment requirements
3. Reference: [db.Structure.txt](db.Structure.txt) - Database schema (for PostgreSQL setup)

## 🗂️ Project Structure

```
LynqArt/
├── backend/
│   ├── config/                 # Django project settings
│   ├── accounts/              # User authentication and profiles
│   ├── artworks/              # Artwork management with versioning
│   ├── exhibitions/           # Exhibition management
│   ├── comments/              # Comments and favorites
│   ├── reviews/               # Expert reviews
│   ├── ai/                    # AI-assisted content
│   ├── analytics/             # View and engagement tracking
│   ├── qr/                    # QR code generation
│   ├── notifications/         # User notifications
│   ├── manage.py              # Django management script
│   └── requirements.txt        # Python dependencies
├── docs/                      # Central documentation directory
│   ├── API_REFERENCE.md       # API documentation
│   ├── DOCUMENTATION_INDEX.md # Documentation quick reference
│   ├── ENVIRONMENT_SETUP.md   # Environment configuration guide
│   ├── PHASE_1_COMPLETE.md    # Phase 1 completion summary
│   ├── PHASE_2_COMPLETE.md    # Phase 2 completion summary
│   ├── ProjectContext.md      # Architecture and design decisions
│   ├── Prompt.md              # Development guidelines
│   ├── ToDo.md                # Feature roadmap
│   ├── db.Structure.txt       # Database schema reference
│   └── Presentation1.pptx     # Presentation slides
├── README.md                  # Project overview
└── .gitignore                 # Git ignore rules
```

## 🔑 Key Architecture Decisions

### User Role Model
- Users register as **regular users** (no role selection)
- Users become **artists** through a "Become an Artist" action (creates ArtistProfile)
- Users become **experts** when assigned by Django admins
- Permission model uses capability flags: `is_artist`, `is_expert`, `is_verified`, `can_manage_exhibitions`

### Authentication
- **JWT tokens** via SimpleJWT
- Access token: 60 minutes (configurable)
- Refresh token: 7 days (configurable)
- Token refresh enabled, old tokens blacklisted

### Data Storage
- **Primary Database**: SQLite (development), PostgreSQL (production)
- **Media/Images**: Local (development), Cloudinary (production)
- **Configuration**: Environment variables (never hardcoded)

### API Design
- **Base URL**: `/api/`
- **Versioning**: None (single stable API)
- **Authentication**: Bearer token in Authorization header
- **Pagination**: Page-based with configurable page size
- **Permissions**: Read-only for public content, authenticated required for writes

## 🛠️ Common Commands

```bash
# Development
cd backend
python manage.py runserver              # Start dev server
python manage.py migrate                # Apply migrations
python manage.py makemigrations         # Create new migrations
python manage.py createsuperuser        # Create admin user
python manage.py check                  # Verify configuration
python manage.py shell                  # Interactive Python shell

# Testing
python manage.py test                   # Run all tests
python manage.py test app_name          # Test specific app

# Production
gunicorn config.wsgi:application        # Run production server
python manage.py collectstatic          # Collect static files
python manage.py migrate --noinput      # Apply migrations (no prompt)
```

## 📞 Environment Variables

All configuration is environment-driven:

| Category | Key Variables |
|----------|---|
| **Django Core** | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `ENV` |
| **Database** | `DATABASE_ENGINE`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT` |
| **Frontend** | `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_ALL_ORIGINS` |
| **Authentication** | `ACCESS_TOKEN_LIFETIME`, `REFRESH_TOKEN_LIFETIME` |
| **Email** | `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` |
| **Storage** | `CLOUDINARY_ENABLED`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **AI Services** | `OPENAI_API_KEY`, `OPENAI_MODEL` |

**For detailed explanations**: See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)

## ✅ Phase 1 Status

**Current Phase**: ✅ Phase 1 - Backend Infrastructure (COMPLETE)

What's complete:
- ✅ 9 Django apps created and configured
- ✅ All models defined per database schema
- ✅ Custom User model with permission flags
- ✅ JWT authentication configured
- ✅ CORS and media storage configured
- ✅ Environment variables system established
- ✅ Comprehensive documentation

What's next:
- 🚀 Phase 2a: Create serializers for all 9 apps
- 🚀 Phase 2b: Implement authentication endpoints (register, login, profile)
- 🚀 Phase 2c: Build CRUD ViewSets for all models
- 🚀 Phase 2d: Add permission classes and access control
- 🚀 Phase 2e: Implement file upload and QR code generation
- 🚀 Phase 2f: Add comprehensive tests

**Estimated duration for Phase 2**: 2-3 weeks

## 🆘 Troubleshooting

### "I need to set up the backend locally"
→ Start here: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)

### "I need to understand the API structure"
→ Reference: [API_REFERENCE.md](API_REFERENCE.md)

### "I need to know why a design decision was made"
→ Read: [ProjectContext.md](ProjectContext.md)

### "I need the database schema"
→ Reference: [db.Structure.txt](db.Structure.txt)

### "I'm developing and need coding standards"
→ Follow: [Prompt.md](Prompt.md)

### "I need to know the development roadmap"
→ See: [ToDo.md](ToDo.md)

### "I need to know what Phase 1 completed"
→ Read: [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)

## 📞 Support

If something is unclear:
1. Check the relevant documentation file above
2. Search for the specific term in ProjectContext.md
3. Review the code comments in the Django apps
4. Run `python manage.py check` to verify configuration

---

**Last Updated**: Phase 1 Completion
**Backend Status**: ✅ Ready for Phase 2 (API Implementation)
**Documentation Status**: ✅ Comprehensive and up-to-date

Happy coding! 🎨
