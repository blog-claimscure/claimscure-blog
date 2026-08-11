# Security & Compliance Protocol

## 1. Session & Access Control
- **Automatic Logout on Page Load**: To ensure zero unauthorized session persistence on shared healthcare workstation terminals, all admin authentication tokens stored in client memory/storage are invalidated when the app reloads.
- **Conditional Floating CMS Button**: The floating CMS portal quick-button is strictly hidden when no active admin session exists (`isAdminAuthenticated === false`).
- **Bearer Token Authorization**: All protected endpoints (`/api/admin/*`, `/api/articles` write methods, `/api/leads` read methods) require a valid `Authorization: Bearer <token>` header verified by `requireAdmin` Express middleware.
- **PBKDF2 Password Hashing**: Administrative credentials are saved as PBKDF2 hashes derived with 100,000 iterations and 16-byte random salts.

## 2. HIPAA Data Protection & Compliance
- **Zero PHI Exposure**: Public articles, forms, and tools strictly contain general industry guidance and anonymized benchmarks. No Protected Health Information (PHI) is ever accepted or stored.
- **Lead Data Isolation**: Prospective clinic lead requests ("Free Claims Audit") are transmitted over TLS 1.3 encrypted connections and accessible solely to authenticated administrators.
- **Business Associate Agreements (BAA)**: All backend communications and third-party integrations (Cloudinary, Google Workspace) adhere to HIPAA BAA protocols.

## 3. Input Validation & XSS Prevention
- HTML content rendered in rich article views is sanitized and structured with safe Tailwind typography wrappers.
- API endpoints strictly validate email formats, string lengths, and required metadata fields before execution.
