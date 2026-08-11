# System Architecture Overview

## Architecture Stack

ClaimsCure is structured as a full-stack Node.js + Express application integrated with Vite and React 18 in TypeScript.

```
+-----------------------------------------------------------------------+
|                            Browser Client                             |
|  - React 18 + Vite SPA                                                |
|  - Tailwind CSS for responsive styling                                |
|  - Lucide Icons for vector icon system                                |
|  - Full Public Article View, Audit Lead Modal, Search Modal, Footer  |
|  - Secure CMS Admin Portal (/admin)                                   |
+-----------------------------------------------------------------------+
                                   |
                         HTTP / REST API Requests
                                   v
+-----------------------------------------------------------------------+
|                          Express API Backend                          |
|  - Runs on port 3000 (0.0.0.0 ingress)                                 |
|  - Middleware: JSON parser, Auth header validator, CORS, Static       |
|  - Endpoints: /api/articles, /api/categories, /api/leads, /api/auth   |
|  - Google Workspace Integration (Docs Import API)                     |
|  - Cloudinary / Media CDN proxy handlers                              |
+-----------------------------------------------------------------------+
                                   |
                       In-Memory / File Storage & Sync
                                   v
+-----------------------------------------------------------------------+
|                         Persistence Engine                            |
|  - LowDB JSON File Persistence (`data/db.json`)                       |
|  - Automatic MongoDB Cloud Atlas Synchronization (Optional Sync Driver)|
|  - Migration hooks for seed data hydration & data cleanup             |
+-----------------------------------------------------------------------+
```

## Directory Structure
- `/server.ts` - Express backend server entry point, API router, authentication middleware, and static production serving.
- `/src/App.tsx` - Main React application wrapper handling state, routes (`/`, `/admin`, `/article/:slug`), and global modals.
- `/src/lib/api.ts` - Unified API client wrapping fetch requests, bearer token headers, and error handling.
- `/src/server/db.ts` - Persistence engine managing LowDB initialization, initial seed content, and optional MongoDB auto-sync.
- `/src/components/` - Public UI components (`Header`, `Footer`, `ArticleDetail`, `SearchModal`, `AuditModal`).
- `/src/components/admin/` - Secure Admin CMS components (`AdminLayout`, `AdminLogin`, `ArticleEditor`, `MediaManager`, `SubscribersManager`, `LeadsManager`, `SettingsManager`).
