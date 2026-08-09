# LynqArt API Reference

Base URL: `http://localhost:8000/api/` (development)

## Authentication

### Obtain Token
```
POST /accounts/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
```
POST /accounts/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Register User
```
POST /accounts/register/
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "username": "newuser",
  "first_name": "John",
  "last_name": "Doe"
}
```

## User Endpoints

### Get Current User Profile
```
GET /accounts/profile/
Authorization: Bearer {access_token}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "username",
  "first_name": "John",
  "last_name": "Doe",
  "is_artist": false,
  "is_expert": false,
  "is_verified": false,
  "can_manage_exhibitions": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update User Profile
```
PATCH /accounts/profile/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

### Become an Artist
```
POST /accounts/become-artist/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "bio": "I'm a painter focused on abstract art",
  "website": "https://example.com",
  "instagram": "@myinstagram",
  "location": "New York, NY"
}

Response:
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "bio": "I'm a painter focused on abstract art",
  "avatar_url": null,
  "website": "https://example.com",
  "instagram": "@myinstagram",
  "twitter": null,
  "phone": null,
  "location": "New York, NY",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Artist Profile
```
GET /accounts/artists/{user_id}/
```

## Artwork Endpoints

### List All Artworks
```
GET /artworks/
Query parameters:
  - category={category_id}
  - status=published
  - search={keyword}
  - page={page_number}
  - page_size={items_per_page}
```

### Create Artwork
```
POST /artworks/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Abstract Dreams",
  "description": "An exploration of color and form",
  "category": "550e8400-e29b-41d4-a716-446655440001",
  "status": "draft",
  "tags": ["abstract", "oil-painting"],
  "artwork_images": [
    {
      "image_url": "https://cloudinary.com/...",
      "alt_text": "Main artwork view",
      "display_order": 1
    }
  ]
}
```

### Get Artwork Detail
```
GET /artworks/{artwork_id}/
```

### Update Artwork
```
PATCH /artworks/{artwork_id}/
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Delete Artwork
```
DELETE /artworks/{artwork_id}/
Authorization: Bearer {access_token}
```

### Create Artwork Version (Artist Statement)
```
POST /artworks/{artwork_id}/versions/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "markdown_statement": "# My Artistic Process\n\nThis piece explores...",
  "ai_generated": false
}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000",
  "version_number": 2,
  "markdown_statement": "# My Artistic Process\n\nThis piece explores...",
  "html_statement": "<h1>My Artistic Process</h1><p>This piece explores...</p>",
  "ai_generated": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Artwork Versions
```
GET /artworks/{artwork_id}/versions/
```

## Exhibition Endpoints

### List All Exhibitions
```
GET /exhibitions/
Query parameters:
  - search={keyword}
  - featured=true
  - page={page_number}
```

### Create Exhibition
```
POST /exhibitions/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Summer 2024 Collection",
  "description": "A curated selection of emerging artists",
  "status": "draft",
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "featured": true
}
```

### Get Exhibition Detail
```
GET /exhibitions/{exhibition_id}/
```

### Add Artwork to Exhibition
```
POST /exhibitions/{exhibition_id}/add-artwork/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Remove Artwork from Exhibition
```
POST /exhibitions/{exhibition_id}/remove-artwork/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Exhibition Artworks
```
GET /exhibitions/{exhibition_id}/artworks/
```

## Comments & Reviews

### List Comments on Artwork
```
GET /comments/?artwork_id={artwork_id}
```

### Create Comment
```
POST /comments/
Authorization: Bearer {access_token} (optional)
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000",
  "comment_text": "Great work! Love the use of color.",
  "parent_comment": null
}
```

### Reply to Comment
```
POST /comments/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000",
  "comment_text": "Thanks for the feedback!",
  "parent_comment": "550e8400-e29b-41d4-a716-446655440099"
}
```

### Expert Reviews
```
GET /reviews/?artwork_id={artwork_id}

POST /reviews/
Authorization: Bearer {access_token} (must be expert)
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000",
  "markdown_review": "# Expert Critique\n\nThis work demonstrates...",
  "rating": 4,
  "is_pinned": true
}
```

## QR Code Endpoints

### Generate QR Code for Artwork
```
POST /qr/generate-qr/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "entity_type": "artwork",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "entity_type": "artwork",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "qr_slug": "artwork-550e8400",
  "qr_image_url": "https://cloudinary.com/image.png",
  "scans": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Track QR Scan
```
POST /qr/{qr_code_id}/scans/

Response:
{
  "qr_code_id": "550e8400-e29b-41d4-a716-446655440010",
  "user_id": null,
  "visitor_hash": "abc123...",
  "viewed_from": "mobile",
  "scanned_at": "2024-01-15T10:30:00Z"
}
```

## Analytics Endpoints

### Get Artwork Views
```
GET /analytics/artwork-views/?artwork_id={artwork_id}
```

### Track View
```
POST /analytics/views/
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000",
  "visitor_hash": "abc123...",
  "viewed_from": "web"
}
```

## Favorites Endpoint

### Add to Favorites
```
POST /comments/favorites/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "artwork_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Remove from Favorites
```
DELETE /comments/favorites/{artwork_id}/
Authorization: Bearer {access_token}
```

### Get User's Favorites
```
GET /comments/favorites/
Authorization: Bearer {access_token}
```

## Notifications Endpoints

### List User Notifications
```
GET /notifications/
Authorization: Bearer {access_token}
Query parameters:
  - is_read=false
  - page={page_number}
```

### Mark Notification as Read
```
PATCH /notifications/{notification_id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_read": true
}
```

### Mark All as Read
```
POST /notifications/mark-all-read/
Authorization: Bearer {access_token}
```

## Pagination

All list endpoints support pagination with query parameters:
- `page` (integer, 1-indexed)
- `page_size` (integer, default: 20)

Response format:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/artworks/?page=2",
  "previous": null,
  "results": [...]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- **400**: Bad Request (invalid data)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Server Error

Error format:
```json
{
  "detail": "Error message here",
  "code": "error_code"
}
```

## Authentication Headers

Include JWT token in all protected endpoints:
```
Authorization: Bearer {access_token}
```

Or as a cookie (when configured):
```
Cookie: jwt={access_token}
```

---

**Note:** This API is built with Django REST Framework. The schema is automatically generated and available at `/api/schema/` (when schema generation is enabled).
