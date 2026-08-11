# Database & Schema Specifications

## Data Architecture
ClaimsCure uses a lightweight, highly reliable file-based database powered by LowDB (`data/db.json`) on the local filesystem, with optional MongoDB Atlas auto-synchronization (`autoSyncMongoCollection`).

## Core Collections

### 1. `articles`
- `id`: Unique string (`art-101`, etc.)
- `title`: Article title
- `slug`: URL-friendly slug
- `excerpt`: Short summary for cards and meta tags
- `content`: HTML formatted body content with tables, callouts, and subheadings
- `categoryId`: Foreign key to `categories`
- `tagIds`: Array of tag IDs
- `authorId`: Foreign key to `authors`
- `coverImage`: Image URL
- `imageAlt`: Alt text for accessibility and SEO
- `publishedAt` / `updatedAt`: ISO timestamp
- `readingTime`: Estimated minutes
- `status`: `'draft'` | `'published'`
- `isFeatured`: Boolean
- `seoTitle` / `seoDescription` / `focusKeyword`: SEO metadata
- `views` / `shares`: Analytics counters

### 2. `categories` & `tags`
- `categories`: `id`, `name`, `slug`, `description`
- `tags`: `id`, `name`, `slug`

### 3. `leads`
- `id`: Unique ID (`lead-<timestamp>`)
- `name`: Contact name
- `workEmail`: Business email
- `phone`: Phone number
- `clinicName`: Practice / Healthcare organization name
- `estimatedOutstandingDenials`: Denied claim volume range
- `billingIssues`: Description of RCM challenges
- `createdAt`: ISO timestamp
- `status`: `'new'` | `'contacted'` | `'converted'` | `'archived'`
- `notes`: Internal admin notes

### 4. `subscribers`
- `id`: Unique ID (`sub-<timestamp>`)
- `email`: Subscriber email
- `subscribedAt`: ISO timestamp
- `source`: Opt-in location (`Footer`, `Article Modal`, `Audit Form`)
- `status`: `'active'` | `'unsubscribed'`

### 5. `media`
- `id`: Unique ID
- `url` / `publicId`: Asset location
- `filename`: Original filename
- `altText` / `caption`: Media accessibility metadata
- `width` / `height` / `bytes` / `format`: File properties
- `createdAt`: ISO timestamp
