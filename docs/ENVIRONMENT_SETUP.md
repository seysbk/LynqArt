# LynqArt Backend Environment Setup Guide

## Overview

LynqArt's Django backend uses environment variables for flexible configuration across development, staging, and production environments. This guide explains how to set up your environment properly.

## Quick Start

1. **Copy the template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   # Development defaults are already suitable for local testing
   # Just ensure SECRET_KEY and DATABASE_URL are configured
   ```

3. **Load environment variables:**
   - Windows (Git Bash/PowerShell): Automatically loaded by Django
   - macOS/Linux: `source .env` or use `python-dotenv`

4. **Test the configuration:**
   ```bash
   python manage.py check
   ```

---

## Environment Variables Reference

### Core Django Settings

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `SECRET_KEY` | (required) | Django secret key for cryptographic signing | Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` | Enable debug mode (NEVER use `True` in production) | Development: `True`, Production: `False` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list of allowed domain names | `myapp.com,www.myapp.com,localhost` |
| `ENV` | `development` | Environment name for logging/monitoring | `development`, `staging`, `production` |

### Database Configuration

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `DATABASE_ENGINE` | `django.db.backends.sqlite3` | Database backend | `django.db.backends.postgresql` for PostgreSQL |
| `DATABASE_NAME` | `db.sqlite3` | Database name/path | `/path/to/db.sqlite3` or `lynqart_db` |
| `DATABASE_USER` | `` | Database user (PostgreSQL only) | `postgres` |
| `DATABASE_PASSWORD` | `` | Database password (PostgreSQL only) | `your_secure_password` |
| `DATABASE_HOST` | `` | Database host (PostgreSQL only) | `localhost`, `neon.tech`, etc. |
| `DATABASE_PORT` | `` | Database port (PostgreSQL only) | `5432` |

**SQLite Example (Development):**
```bash
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3
```

**PostgreSQL Example (Production on Neon):**
```bash
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=lynqart_prod
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_HOST=ep-example.us-east-1.compute.neon.tech
DATABASE_PORT=5432
```

### CORS Configuration

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173` | Comma-separated frontend URLs | `https://myapp.com,https://www.myapp.com` |
| `CORS_ALLOW_ALL_ORIGINS` | `False` | Allow all origins (security risk!) | Use only for testing; never in production |

**Development (Vite + React):**
```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Production:**
```bash
CORS_ALLOWED_ORIGINS=https://lynqart.com,https://www.lynqart.com
CORS_ALLOW_ALL_ORIGINS=False
```

### JWT Authentication

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `ACCESS_TOKEN_LIFETIME` | `60` | Access token expiration in minutes | `15` for short-lived tokens |
| `REFRESH_TOKEN_LIFETIME` | `7` | Refresh token expiration in days | `30` for longer validity |

**Development (Long-lived for testing):**
```bash
ACCESS_TOKEN_LIFETIME=1440  # 24 hours
REFRESH_TOKEN_LIFETIME=30   # 30 days
```

**Production (Short-lived for security):**
```bash
ACCESS_TOKEN_LIFETIME=15    # 15 minutes
REFRESH_TOKEN_LIFETIME=7    # 7 days
```

### Email Configuration

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Email service | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `localhost` | SMTP server | `smtp.gmail.com`, `smtp.sendgrid.net` |
| `EMAIL_PORT` | `1025` | SMTP port | `587`, `465` |
| `EMAIL_HOST_USER` | `` | Email account username | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | `` | Email account password/token | Use app-specific password |
| `EMAIL_USE_TLS` | `True` | Use TLS encryption | `True` for security |
| `DEFAULT_FROM_EMAIL` | `noreply@lynqart.local` | Sender email address | `noreply@lynqart.com` |

**Development (Console output):**
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Production (Gmail SMTP):**
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-app-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@lynqart.com
```

### Cloudinary (Optional Image Storage)

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `CLOUDINARY_ENABLED` | `False` | Enable Cloudinary storage | `True` to activate |
| `CLOUDINARY_CLOUD_NAME` | `` | Cloudinary account name | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `` | Cloudinary API key | Get from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `` | Cloudinary API secret | Get from Cloudinary dashboard |

**Development (Local storage):**
```bash
CLOUDINARY_ENABLED=False
# Images stored in backend/media/
```

**Production (Cloudinary):**
```bash
CLOUDINARY_ENABLED=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### AI Services (OpenAI)

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `OPENAI_API_KEY` | `` | OpenAI API key for AI writing assistance | Get from OpenAI account |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | Model to use | `gpt-4`, `gpt-3.5-turbo` |

```bash
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

---

## Environment Profiles

### Development Profile

```bash
# .env (Development)
SECRET_KEY=your-development-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
ENV=development

# Database: SQLite
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3

# Frontend: Vite React
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CORS_ALLOW_ALL_ORIGINS=False

# Email: Console output (check terminal)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Storage: Local
CLOUDINARY_ENABLED=False

# JWT: Long-lived for easy testing
ACCESS_TOKEN_LIFETIME=1440
REFRESH_TOKEN_LIFETIME=30
```

### Staging Profile

```bash
# .env (Staging)
SECRET_KEY=use-strong-random-key
DEBUG=False
ALLOWED_HOSTS=staging.lynqart.com,staging-api.lynqart.com
ENV=staging

# Database: PostgreSQL
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=lynqart_staging
DATABASE_USER=postgres
DATABASE_PASSWORD=secure-password
DATABASE_HOST=staging-db.neon.tech
DATABASE_PORT=5432

# Frontend: Staging frontend
CORS_ALLOWED_ORIGINS=https://staging.lynqart.com,https://staging-api.lynqart.com
CORS_ALLOW_ALL_ORIGINS=False

# Email: SendGrid (or your email service)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-sendgrid-key
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@staging.lynqart.com

# Storage: Cloudinary
CLOUDINARY_ENABLED=True
CLOUDINARY_CLOUD_NAME=staging-cloud
CLOUDINARY_API_KEY=staging-key
CLOUDINARY_API_SECRET=staging-secret

# JWT: Standard production settings
ACCESS_TOKEN_LIFETIME=15
REFRESH_TOKEN_LIFETIME=7
```

### Production Profile

```bash
# .env (Production)
SECRET_KEY=use-very-strong-random-key
DEBUG=False
ALLOWED_HOSTS=lynqart.com,www.lynqart.com,api.lynqart.com
ENV=production

# Database: PostgreSQL
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=lynqart_prod
DATABASE_USER=postgres
DATABASE_PASSWORD=very-secure-password
DATABASE_HOST=prod-db.neon.tech
DATABASE_PORT=5432

# Frontend: Production frontend
CORS_ALLOWED_ORIGINS=https://lynqart.com,https://www.lynqart.com
CORS_ALLOW_ALL_ORIGINS=False

# Email: Production email service
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-production-sendgrid-key
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@lynqart.com

# Storage: Cloudinary
CLOUDINARY_ENABLED=True
CLOUDINARY_CLOUD_NAME=production-cloud
CLOUDINARY_API_KEY=prod-key
CLOUDINARY_API_SECRET=prod-secret

# JWT: Short-lived for security
ACCESS_TOKEN_LIFETIME=15
REFRESH_TOKEN_LIFETIME=7

# AI Services
OPENAI_API_KEY=sk-prod-key-here
OPENAI_MODEL=gpt-4
```

---

## Setup Instructions by Environment

### Local Development

1. **Create `.env` from template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` with minimal changes:**
   ```bash
   SECRET_KEY=dev-key-123456789
   DEBUG=True
   # Keep other defaults for local development
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start development server:**
   ```bash
   python manage.py runserver
   ```

### Docker Deployment

If using Docker, pass environment variables:

```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV DEBUG=False
ENV ALLOWED_HOSTS=myapp.com
CMD ["gunicorn", "config.wsgi"]
```

Run with:
```bash
docker run -e DEBUG=False \
  -e SECRET_KEY="your-secret-key" \
  -e DATABASE_URL="postgresql://..." \
  your-image
```

### Environment Variable Security

**Development:**
- `.env` file tracked in git (for team defaults)
- Contains non-sensitive defaults only
- Individual developers override with personal values

**Production:**
- `.env` files NEVER committed to git (see `.gitignore`)
- Use platform secrets management:
  - **Heroku**: Config Vars
  - **Railway**: Environment Variables
  - **AWS**: Parameter Store / Secrets Manager
  - **Vercel/Netlify**: Environment Variables (for frontend)
  - **Docker**: Docker Secrets / mounted volumes

**Recommended approach for production:**
1. Generate strong `SECRET_KEY` (never hardcode)
2. Use managed database service (Neon PostgreSQL)
3. Store all secrets in platform's secret manager
4. Never commit `.env` files with real values
5. Rotate secrets quarterly

---

## Troubleshooting

### "SECRET_KEY is required"
**Solution:** Add `SECRET_KEY=your-key` to `.env`

### "Database connection refused"
**Solutions:**
1. Verify `DATABASE_HOST` and `DATABASE_PORT`
2. Check database credentials
3. Ensure database server is running
4. For Neon PostgreSQL: Verify connection string

### "CORS errors: Origin not allowed"
**Solution:** Add your frontend URL to `CORS_ALLOWED_ORIGINS`

### "DisallowedHost: Invalid HTTP_HOST header"
**Solution:** Add your domain to `ALLOWED_HOSTS`

### "Email not sending"
**Solutions:**
1. Verify `EMAIL_HOST`, `EMAIL_PORT`, credentials
2. For Gmail: Use app-specific password (not account password)
3. Check `EMAIL_USE_TLS` setting
4. For development: Use `console` backend to see emails in terminal

### "Cloudinary: Invalid credentials"
**Solution:** Verify `CLOUDINARY_ENABLED=True` and all three Cloudinary variables

---

## Generating a Secure SECRET_KEY

**Option 1: Django utility**
```bash
python manage.py shell
>>> from django.core.management.utils import get_random_secret_key
>>> print(get_random_secret_key())
```

**Option 2: Python**
```bash
python -c "from secrets import token_urlsafe; print(token_urlsafe(50))"
```

**Option 3: Online tool** (use only if you trust the service)
- https://djecrety.ir/ (Django secret key generator)

---

## Next Steps

After configuring environment variables:
1. ✅ Run `python manage.py check`
2. ✅ Run `python manage.py migrate`
3. ✅ Create superuser with `python manage.py createsuperuser`
4. ✅ Start server with `python manage.py runserver`
5. ✅ Access admin at `http://localhost:8000/admin`

Your LynqArt backend is ready for development! 🎨
