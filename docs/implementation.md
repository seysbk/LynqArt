# LynqArt Phase 6: Core Launch Blockers & Missing Subsystems Implementation Guide

> **Audience**: AI Agent / Senior Full-Stack Engineer  
> **Goal**: Execute Phase 6 of the LynqArt roadmap with 100% architectural consistency, preserving all security policies, non-marketplace gallery principles, and AI-assistive guardrails.  
> **Repository Context**:
> - **Backend**: Django 5 + Django REST Framework (`/backend`), SimpleJWT, SQLite in dev / PostgreSQL in prod.
> - **Frontend**: React 19 + Vite + Tailwind CSS (`/frontend`), React Router v7, Axios, Lucide Icons, React Markdown.

---

## 0. Strict Non-Negotiable Core Architectural Rules

1. **AI is Assistive Only**:
   - AI drafts statements into an staging buffer. It must **never** automatically save or publish directly to `ArtworkVersion` or `Artwork`.
   - The artist must explicitly click "Accept Draft", review/edit the Markdown in the editor, and submit a form save.
   - Prompts must strictly prohibit hallucinated concepts, fake symbolism, or invented biographical narratives.
2. **Permanent Slugs & UUIDs**:
   - Entities are looked up by `slug` or `UUID` (never sequential autoincrement IDs).
3. **No Direct Commerce**:
   - No prices, shopping carts, or payment processors. Availability is strictly framed around *gallery acquisition inquiries*, loans, or private collections.
4. **Preserve Art Historical Integrity**:
   - Edits to statements create immutable version records (`ArtworkVersion`).
5. **Strict Object Ownership**:
   - All write/mutation endpoints require `IsOwnerOrReadOnly` or specific capability flags (`is_artist`, `is_expert`, `can_manage_exhibitions`).

---

## Task 6.1: Notification Dispatch Pipeline & Real-Time Sync

### Objective
Ensure in-app `Notification` objects are created whenever community interactions happen, provide a batch `mark-all-read` endpoint, add mobile header access, and establish a lightweight real-time polling sync.

### Backend Changes
1. **Create Signals Module** (`backend/notifications/signals.py`):
   Connect `post_save` handlers:
   - **Comment on Artwork**:
     ```python
     @receiver(post_save, sender='comments.Comment')
     def notify_on_comment(sender, instance, created, **kwargs):
         if not created:
             return
         artwork = instance.artwork
         # 1. If it's a top-level comment, notify the artwork artist
         if not instance.parent_comment:
             if artwork.artist != instance.user:
                 Notification.objects.create(
                     user=artwork.artist,
                     title=f"New comment on {artwork.title}",
                     message=f"{instance.user.get_full_name() or instance.user.username} left a comment on your artwork.",
                     type="comment",
                 )
         # 2. If it's a reply, notify the author of the parent comment (and the artist if distinct)
         else:
             parent_author = instance.parent_comment.user
             if parent_author != instance.user:
                 Notification.objects.create(
                     user=parent_author,
                     title=f"New reply on {artwork.title}",
                     message=f"{instance.user.get_full_name() or instance.user.username} replied to your comment.",
                     type="reply",
                 )
     ```
   - **Artwork Favorited**:
     ```python
     @receiver(post_save, sender='comments.Favorite')
     def notify_on_favorite(sender, instance, created, **kwargs):
         if not created:
             return
         if instance.artwork.artist != instance.user:
             Notification.objects.create(
                 user=instance.artwork.artist,
                 title=f"Artwork bookmarked: {instance.artwork.title}",
                 message=f"{instance.user.get_full_name() or instance.user.username} added your artwork to their bookmarks.",
                 type="favorite",
             )
     ```
   - **Expert Review Published**:
     ```python
     @receiver(post_save, sender='reviews.ExpertReview')
     def notify_on_expert_review(sender, instance, created, **kwargs):
         if not created:
             return
         if instance.artwork.artist != instance.reviewer:
             Notification.objects.create(
                 user=instance.artwork.artist,
                 title=f"Expert Review: {instance.artwork.title}",
                 message=f"{instance.reviewer.get_full_name() or instance.reviewer.username} published an expert critique on your work.",
                 type="review",
             )
     ```
   - **Artwork Added to Curated Exhibition**:
     ```python
     @receiver(post_save, sender='exhibitions.ExhibitionArtwork')
     def notify_on_exhibition_link(sender, instance, created, **kwargs):
         if not created:
             return
         artist = instance.artwork.artist
         organizer = instance.exhibition.organizer
         if artist != organizer:
             Notification.objects.create(
                 user=artist,
                 title=f"Included in Exhibition: {instance.exhibition.title}",
                 message=f"Your artwork '{instance.artwork.title}' was added to '{instance.exhibition.title}' by curator {organizer.get_full_name() or organizer.username}.",
                 type="exhibition",
             )
     ```
2. **Register Signals** in `backend/notifications/apps.py`:
   ```python
   def ready(self):
       import notifications.signals  # noqa: F401
   ```
3. **Add Mark-All-As-Read Action** in `backend/notifications/api_views.py`:
   ```python
   @action(detail=False, methods=['post'], url_path='mark-all-read')
   def mark_all_read(self, request):
       updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
       return Response({'status': 'ok', 'marked_read_count': updated_count}, status=status.HTTP_200_OK)
   ```

### Frontend Changes
1. **Fix `NotificationsCenter.jsx`**:
   Replace the multiple PATCH loop in `markAllAsRead` with a single POST:
   ```javascript
   const markAllAsRead = async () => {
     try {
       await api.post('/notifications/mark-all-read/')
       setNotifications(notifications.map((item) => ({ ...item, is_read: true })))
     } catch (err) {
       console.error('Failed to mark all notifications as read', err)
     }
   }
   ```
   Add a 45-second background interval polling `fetchNotifications()` when user session is active.
2. **Mobile Header Integration** (`frontend/src/components/ui/Header.jsx`):
   Insert `<NotificationsCenter session={session} />` into the Mobile Header Row 1 (`md:hidden`) beside the profile avatar.

---

## Task 6.2: Contact Artist Subsystem (Inquiries & Direct Messaging)

### Objective
Allow gallery visitors and collectors to inquire about an artwork or contact an artist without exposing the artist's private email address.

### Backend Implementation
1. **Create Model** in `backend/accounts/models.py` (or a dedicated `inquiries` app):
   ```python
   class ContactMessage(models.Model):
       INQUIRY_GENERAL = 'general'
       INQUIRY_ACQUISITION = 'acquisition'
       INQUIRY_EXHIBITION = 'exhibition'
       
       INQUIRY_CHOICES = [
           (INQUIRY_ACQUISITION, 'Acquisition / Purchase Inquiry'),
           (INQUIRY_EXHIBITION, 'Exhibition Invitation'),
           (INQUIRY_GENERAL, 'General Inquiry'),
       ]

       id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
       artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_inquiries')
       artwork = models.ForeignKey('artworks.Artwork', on_delete=models.SET_NULL, null=True, blank=True, related_name='inquiries')
       sender_name = models.CharField(max_length=150)
       sender_email = models.EmailField()
       sender_phone = models.CharField(max_length=50, blank=True, default='')
       inquiry_type = models.CharField(max_length=32, choices=INQUIRY_CHOICES, default=INQUIRY_ACQUISITION)
       message = models.TextField()
       created_at = models.DateTimeField(auto_now_add=True)
   ```
2. **Serializer & ViewSet**:
   - `ContactMessageSerializer`: Validates email and message length (>10 characters).
   - `ContactMessageViewSet`:
     - Rate-limited using ScopedRateThrottle (`'contact': '5/hour'` for anonymous).
     - On creation, trigger `send_mail` to `artist.email` from `DEFAULT_FROM_EMAIL`.
     - Create an in-app `Notification` for `artist`.
     - Owner permission: only the recipient `artist` (or staff) can view received messages via `GET /api/accounts/inquiries/`.

### Frontend Implementation
1. Create `ContactArtistModal.jsx` in `frontend/src/components/ui/`.
2. Include fields: Name, Email, Inquiry Type dropdown, Message.
3. Add "Contact Artist / Inquire" button on `ArtworkDetailPage.jsx` and `ArtistProfilePage.jsx`.

---

## Task 6.3: User / Artist Username Slugs for Clean URLs

### Objective
Support clean, human-friendly URLs such as `/artists/:username` or `/@:username` while maintaining backwards-compatibility with UUID-based URLs.

### Backend Implementation
1. Ensure `accounts.User.username` validation requires URL-safe slugs (alphanumeric, underscores, hyphens only).
2. Update `ArtistProfileViewSet`:
   Allow lookup by either `user__username` or `user__id`.
   ```python
   def get_object(self):
       lookup_val = self.kwargs.get('pk')
       queryset = self.filter_queryset(self.get_queryset())
       obj = queryset.filter(Q(user__id=lookup_val) | Q(user__username__iexact=lookup_val)).first()
       if not obj:
           raise Http404("Artist profile not found.")
       self.check_object_permissions(self.request, obj)
       return obj
   ```

### Frontend Implementation
1. In `frontend/src/App.jsx`:
   Update route definition:
   ```jsx
   <Route path="artists/:artistIdentifier" element={<ArtistProfilePage />} />
   ```
2. In `ArtistProfilePage.jsx`:
   Query `/api/accounts/artist-profiles/?user=${artistIdentifier}` or resolve using the combined lookup endpoint.
3. Update all `<Link to="/artists/..." />` across the app to prefer `artwork.artist.username`.

---

## Task 6.4: Artwork Privacy & Draft Access Verification

### Objective
Ensure that unpublished artworks (`status='draft'` or `status='archived'`) are strictly inaccessible to the public and cannot be viewed via direct URL lookup or indexed in views.

### Backend Implementation
In `backend/artworks/api_views.py`:
1. Modify `get_queryset()` in `ArtworkViewSet`:
   ```python
   def get_queryset(self):
       queryset = super().get_queryset()
       user = self.request.user
       
       # Anonymous visitors see ONLY published works
       if not user.is_authenticated:
           return queryset.filter(status=Artwork.STATUS_PUBLISHED)
           
       # Staff and superusers see all
       if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
           return queryset
           
       # Authenticated users see published works PLUS their own drafts/archived works
       return queryset.filter(Q(status=Artwork.STATUS_PUBLISHED) | Q(artist=user))
   ```
2. Modify `analytics/api_views.py`:
   Reject or ignore view logging if the artwork is not published or if viewed by the artwork's owner (prevents analytics inflation).

---

## Task 6.5: Artwork Acquisition & Availability Status Field

### Objective
Indicate whether a piece is available for acquisition, on loan, or part of a private collection, without showing prices.

### Backend Implementation
1. Add field to `backend/artworks/models.py`:
   ```python
   AVAILABILITY_AVAILABLE = 'available'
   AVAILABILITY_NOT_FOR_SALE = 'not_for_sale'
   AVAILABILITY_ON_LOAN = 'on_loan'
   AVAILABILITY_SOLD = 'sold'

   AVAILABILITY_CHOICES = [
       (AVAILABILITY_AVAILABLE, 'Available for acquisition'),
       (AVAILABILITY_NOT_FOR_SALE, 'Not for sale / Private collection'),
       (AVAILABILITY_ON_LOAN, 'On exhibition loan'),
       (AVAILABILITY_SOLD, 'Acquired / Sold'),
   ]

   availability_status = models.CharField(
       max_length=30,
       choices=AVAILABILITY_CHOICES,
       default=AVAILABILITY_AVAILABLE
   )
   ```
2. Expose `availability_status` in `ArtworkSerializer`.

### Frontend Implementation
1. Add availability selector in `ArtworkManagerPage.jsx` (Part 1 specs).
2. Display availability badge on `ArtworkDetailPage.jsx`:
   - Green/Indigo badge for "Available for acquisition" + triggers "Inquire About This Work" button.
   - Subtle slate badge for "Not for sale" or "On exhibition loan".

---

## Task 6.6: Dynamic Social Sharing & Favicon Banner Previews

### Objective
Ensure shared links on WhatsApp, Twitter, LinkedIn, and Facebook render rich cards with the artwork banner, title, and artist name.

### Implementation Pattern
1. Create a lightweight server-rendered HTML template or edge responder in Django:
   Add a Django view `share_artwork_preview` at `/api/artworks/<slug>/share-preview/` or configure an SSR endpoint that returns standard Open Graph tags:
   - `og:title`: `{{ artwork.title }} by {{ artwork.artist.full_name }}`
   - `og:description`: `{{ artwork.description|truncatewords:30 }}`
   - `og:image`: Absolute URL of `artwork.banner_image`
   - `twitter:card`: `summary_large_image`
2. In `ArtworkDetailPage.jsx`:
   Implement dynamic document title and meta tag updates in `useEffect`:
   ```javascript
   useEffect(() => {
     if (artwork) {
       document.title = `${artwork.title} — ${artwork.artist?.full_name || artwork.artist?.username} | LynqArt`
     }
   }, [artwork])
   ```
3. Update `shareQr` to use Web Share API with the full dynamic title and copy link fallback.

---

## Task 6.7: Branded QR Code with Embedded LynqArt Logo

### Objective
Generate physical QR codes with high visual appeal featuring the LynqArt monogram in the center.

### Implementation in `backend/qr/api_views.py`
1. Use `qrcode.constants.ERROR_CORRECT_H` (approx. 30% error correction capability).
2. In `perform_create`:
   ```python
   qr = qrcode.QRCode(
       version=None,
       error_correction=qrcode.constants.ERROR_CORRECT_H,
       box_size=10,
       border=2,
   )
   qr.add_data(f'{frontend_url}/q/{qr_code.qr_slug}')
   qr.make(fit=True)
   qr_img = qr.make_image(fill_color='#0F172A', back_color='white').convert('RGBA')

   # Embed LynqArt circular logo/monogram in center (max 20-22% of QR dimensions)
   logo_size = int(qr_img.size[0] * 0.22)
   # Load logo from static/assets or draw high-contrast rounded monogram:
   logo_box = (
       (qr_img.size[0] - logo_size) // 2,
       (qr_img.size[1] - logo_size) // 2,
       (qr_img.size[0] + logo_size) // 2,
       (qr_img.size[1] + logo_size) // 2,
   )
   # Draw rounded background circle and paste monogram
   ```
3. Maintain the LynqArt gallery placard card wrapping (Title at top, QR in center, LynqArt branding at bottom).

---

## Task 6.8: Artist Profile: "Featured Works" Priority Section

### Objective
Allow artists to choose specific artworks to feature prominently at the top of their profile page, distinct from the global homepage feature.

### Backend Implementation
1. Add `is_artist_featured = models.BooleanField(default=False)` to `backend/artworks/models.py`.
2. Add `is_artist_featured` to `ArtworkSerializer.fields` and `filterset_fields`.

### Frontend Implementation
1. In `ArtworkManagerPage.jsx`, add a checkbox: *"Feature this artwork on my profile page"*.
2. In `ArtistProfilePage.jsx`:
   - Split artworks into `featuredArtworks` (`is_artist_featured === true`) and `portfolioArtworks`.
   - Render "Selected / Featured Works" as an elevated carousel or highlight row at the top.
   - Render the remaining portfolio below.

---

## Task 6.9: Artwork Details Page: "Other Works from this Artist"

### Objective
Keep viewers engaged after scanning a QR code by providing immediate access to the artist's other creations and profile.

### Frontend Implementation
1. In `ArtworkDetailPage.jsx`:
   When `artwork` loads, fetch other works:
   ```javascript
   api.get('/artworks/', {
     params: {
       artist_id: artwork.artist.id,
       status: 'published',
       ordering: '-created_at',
     }
   }).then(({ data }) => {
     const others = (data.results || data || []).filter(item => item.id !== artwork.id).slice(0, 3)
     setOtherArtworks(others)
   })
   ```
2. Render "Other Works by this Artist" section above the footer with cards linking to the corresponding detail pages.
3. Include an "Explore Full Artist Profile" link button.

---

## Task 6.10: Artwork Form: Relabel Description to "About this Work"

### Objective
Clarify the distinction between conversational work synopsis/notes and formal academic artist statements.

### Frontend Implementation
1. In `ArtworkManagerPage.jsx`:
   - Change label from "Short Description / Synopsis" to **"About this work"**.
   - Subtitle: *"Conversational background, technical notes, or informal context about this physical piece."*
2. In `ArtworkDetailPage.jsx`:
   - If `artwork.description` exists, display it as an **"About this work"** section separate from the formal **"Artist Statement"**.

---

## Task 6.11: Threaded Comment Rules: Artist-Only Replies

### Objective
Prevent public comment sections from devolving into unmoderated arguments. Only the artwork's author may reply to comments on their work.

### Backend Implementation
In `backend/comments/api_views.py`:
```python
def perform_create(self, serializer):
    artwork = serializer.validated_data['artwork']
    parent = serializer.validated_data.get('parent_comment')
    
    if not artwork.allow_comments:
        raise ValidationError({'artwork': 'Comments are disabled for this artwork.'})
        
    if parent:
        # Strictly verify that only the artwork artist can reply
        if artwork.artist != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied('Only the artist can reply to visitor comments on this artwork.')

    serializer.save(user=self.request.user)
```

### Frontend Implementation
In `ArtworkDetailPage.jsx`:
- Only show the "Reply" button under a comment if `session.user?.id === artwork.artist?.id`.

---

## Task 6.12: Content Moderation & Reporting Subsystem

### Objective
Provide users and visitors with a safe way to flag inappropriate comments, copyright violations, or abusive content, with a moderation queue for administrators.

### Backend Implementation
1. Create `Report` model in `backend/comments/models.py` (or `accounts/models.py`):
   ```python
   class Report(models.Model):
       REASON_INAPPROPRIATE = 'inappropriate'
       REASON_HARASSMENT = 'harassment'
       REASON_SPAM = 'spam'
       REASON_COPYRIGHT = 'copyright'
       REASON_OTHER = 'other'

       REASON_CHOICES = [
           (REASON_INAPPROPRIATE, 'Inappropriate Content / NSFW'),
           (REASON_HARASSMENT, 'Harassment or Hate Speech'),
           (REASON_SPAM, 'Spam or Advertising'),
           (REASON_COPYRIGHT, 'Copyright or Intellectual Property Infringement'),
           (REASON_OTHER, 'Other Violation'),
       ]

       STATUS_PENDING = 'pending'
       STATUS_REVIEWED = 'reviewed'
       STATUS_DISMISSED = 'dismissed'
       STATUS_ACTIONED = 'actioned'

       STATUS_CHOICES = [
           (STATUS_PENDING, 'Pending Review'),
           (STATUS_REVIEWED, 'Reviewed'),
           (STATUS_DISMISSED, 'Dismissed'),
           (STATUS_ACTIONED, 'Actioned (Content Hidden/Removed)'),
       ]

       id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
       reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
       reporter_ip = models.CharField(max_length=64, blank=True, default='')
       target_comment = models.ForeignKey('comments.Comment', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
       target_artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
       reason = models.CharField(max_length=32, choices=REASON_CHOICES)
       details = models.TextField(blank=True, default='')
       status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
       moderator_notes = models.TextField(blank=True, default='')
       created_at = models.DateTimeField(auto_now_add=True)
   ```
2. Expose `POST /api/comments/reports/` with anonymous IP tracking via `get_client_ip`.
3. Register `Report` in Django admin with filter by `status`, `reason`, and direct actions to hide target content.

### Frontend Implementation
1. Add a small flag icon (`Flag`) on comment items and artwork detail pages.
2. Clicking opens a simple "Report Content" modal with reason radio options.

---

## Task 6.13: Copyright & Provenance Attribution Fields

### Objective
Ensure artists retain explicit legal rights documentation and provenance details for physical artworks.

### Backend Implementation
In `backend/artworks/models.py`:
```python
copyright_holder = models.CharField(max_length=255, blank=True, default='')
license_type = models.CharField(
    max_length=50,
    choices=[
        ('all_rights_reserved', 'All Rights Reserved'),
        ('cc_by_nc_nd', 'Creative Commons BY-NC-ND'),
        ('cc_by_sa', 'Creative Commons BY-SA'),
        ('public_domain', 'Public Domain'),
    ],
    default='all_rights_reserved'
)
provenance = models.TextField(blank=True, default='')
```
Expose in `ArtworkSerializer`.

### Frontend Implementation
1. Include copyright and license dropdown in `ArtworkManagerPage.jsx` (Part 1 specs).
2. In `ArtworkDetailPage.jsx`, display the copyright notice and license badge in the specification panel.

---

## Task 6.14: Mobile Responsiveness & WCAG 2.1 AA Accessibility Audit

### Objective
Ensure flawless usability on physical mobile devices in gallery environments and screen reader compliance.

### Checklist
1. **Tap Target Sizes**: Verify all icon buttons (Heart, Share, QR, Notifications, Header nav links) have a minimum clickable area of 44×44px.
2. **Text Contrast**: Update muted gray text styles in `index.css` and cards from `#71717A` (ratio ~3.2:1) to `#94A3B8` or `#A1A1AA` (ratio > 4.5:1 on `#0D0F14`).
3. **Keyboard & Focus States**:
   Ensure interactive elements possess visible focus rings: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`.
4. **ARIA Roles**:
   Ensure modals have `role="dialog" aria-modal="true"` and buttons have explicit `aria-label` tags.

---

## AI Safeguard Audit & Instruction Tuning

### Audit Finding
In `backend/ai/services/ai_service.py`, `SYSTEM_PROMPT` contains strong anti-hallucination rules. However, the template fallback in `backend/ai/api_views.py` contains canned poetic claims (e.g. `> "The physical artwork acts as an anchor for digital memory..."`).

### Required Adjustment
Update `synthesize_artist_statement` in `backend/ai/api_views.py` so the fallback does not inject unprompted philosophical quotes. It should assemble only the artist's supplied title, medium, and notes into clean, objective paragraphs:
```python
def synthesize_artist_statement(title, medium, concept, tone='contemplative'):
    title_str = title or 'Untitled Work'
    medium_str = medium or 'mixed media'
    concept_str = concept or 'the physical relationships between materials, form, and composition'

    return (
        f"## Artist Statement: *{title_str}*\n\n"
        f"*{title_str}* is created using {medium_str}. "
        f"The work focuses on {concept_str}.\n\n"
        f"### Materials & Approach\n"
        f"Working with {medium_str} provides a direct physical foundation for the piece. "
        f"The arrangement emphasizes balance, texture, and the visual character of the chosen medium."
    )
```

---

## Verification Plan

### Automated DRF Test Suite
Run from `/backend`:
```powershell
python manage.py test accounts artworks comments reviews notifications qr ai
```

### Manual Acceptance Tests
1. **Notifications**: Leave a comment on an artwork as Visitor A $\rightarrow$ Sign in as Artist $\rightarrow$ Check bell icon in desktop and mobile header $\rightarrow$ Click "Mark all as read".
2. **Privacy**: As an anonymous visitor, attempt to load `/api/artworks/<draft-slug>/` $\rightarrow$ Expect 404 Not Found.
3. **Comment Replies**: As a regular viewer, verify the "Reply" button does not appear under comments. As the artwork's artist, verify replies can be posted.
4. **QR Generation**: Generate QR code $\rightarrow$ Verify LynqArt monogram is centered $\rightarrow$ Scan with mobile camera to confirm high-speed resolution.
5. **AI Safeguard**: Open AI assistant modal $\rightarrow$ Request draft $\rightarrow$ Verify statement is loaded into staging $\rightarrow$ Verify database has not modified `ArtworkVersion` until the artist approves and saves Part 2.

