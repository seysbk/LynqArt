# LynqArt: Production Deployment, Security Audit & Platform Enhancement Guide

This document covers critical operational considerations for deploying LynqArt to production (Vercel frontend + Django backend on Render/Railway/VPS), handling image uploads safely across environments, protecting against security vulnerabilities, and feature ideas to increase platform appeal for artists and art lovers.

---

## 1. Production Image Handling (Local vs Production)

### The Problem with Local Media Storage in Production
In local development, Django saves media files directly to the local filesystem (`MEDIA_ROOT`). However, serverless or containerized deployment platforms (e.g., Vercel, Render, Railway, AWS ECS) use ephemeral file systems. Files uploaded locally to `/media/` will be **wiped out** upon redeployments or container restarts.

### Recommended Solution: Cloud Object Storage

To ensure images (artworks, profile pictures, exhibition banners) persist reliably in production:

#### Option A: Cloudinary (Easiest Integration)
1. Install `django-cloudinary-storage`:
   ```bash
   pip install django-cloudinary-storage
   ```
2. Update `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       'cloudinary_storage',
       'django.contrib.staticfiles',
       'cloudinary',
       ...
   ]

   CLOUDINARY_STORAGE = {
       'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
       'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
       'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
   }

   DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

#### Option B: AWS S3 or DigitalOcean Spaces
1. Install `django-storages` and `boto3`:
   ```bash
   pip install django-storages boto3
   ```
2. Configure `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'` with S3 credentials in environment variables.

---

## 2. Pre-Deployment Checklist

1. **Environment Variables**:
   - `DEBUG=False` in production.
   - Set a strong, unique `SECRET_KEY`.
   - Set `ALLOWED_HOSTS` (e.g., `api.lynqart.com`, `.render.com`).
   - `CORS_ALLOWED_ORIGINS` must list exact production frontend domain(s) (e.g., `https://lynqart.vercel.app`).

2. **Database Configuration**:
   - Use a managed PostgreSQL database (e.g., Neon, Supabase, Render Postgres, ElephantSQL) instead of SQLite in production.

3. **HTTPS & Security Headers**:
   - Ensure SSL/TLS is enabled for both frontend (Vercel handles this automatically) and backend.
   - Enable `SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, and `CSRF_COOKIE_SECURE = True` in `settings.py` for production.

---

## 3. Security Audit & Vulnerability Mitigation

### Current Strengths
- **JWT Authentication**: Secure token-based access via SimpleJWT.
- **Role-Based Access Control**: Artist permissions enforced on write actions (`IsArtistOrReadOnly`).
- **Data Protection Compliance**: Aligned with Data Protection Act, 2012 (Act 843) of Ghana.

### Recommendations for Hardening
1. **File Upload Validation**:
   - Enforce MIME type & file extension verification for image uploads to prevent remote code execution or script upload attacks. Limit max file size (e.g. 10MB).
2. **Rate Limiting (Throttle)**:
   - Configure DRF throttling (`REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES']`) to defend against brute force login attacks and API abuse.
3. **CORS Restrictions**:
   - Ensure `CORS_ALLOW_ALL_ORIGINS` is `False` in production environments.

---

## 4. Feature Suggestions to Enhance Platform Appeal

### For Artists
1. **Interactive Certificate of Authenticity (COA)**:
   - Generate downloadable PDF / QR-backed cryptographic certificates of authenticity for each published physical artwork.
2. **Sales & Purchasing Inquiries**:
   - Allow collectors/art lovers to submit purchase inquiries directly to the artist via a structured inquiry form.
3. **Audio & Video Statements**:
   - Enable artists to upload audio walkthroughs or video statements explaining their process alongside written statements.

### For Art Lovers & Gallery Visitors
1. **Curated Virtual Exhibitions & Audio Tours**:
   - An audio guide mode when scanning exhibition QR codes in galleries.
2. **Collector Favorites & Curated Collections**:
   - Allow visitors to save artworks to custom named collections (e.g., "Abstract Inspirations", "Wishlist").
3. **AR Preview (Augmented Reality)**:
   - Enable visitors to view the artwork sized to scale on their wall using web AR (WebXR / USDZ preview).
