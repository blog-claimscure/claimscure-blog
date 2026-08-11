# System Prompt & Core Directives

## Vision & Purpose
ClaimsCure is an enterprise-grade, HIPAA-compliant Medical Billing & Revenue Cycle Management (RCM) digital publishing platform. The primary objective is to empower U.S. physician groups, clinic administrators, and billing managers with expert insights, regulatory guidance (CMS 2026 Outpatient Billing, CPT code updates, HIPAA compliance rules), and high-converting lead generation tools (Free Claims Audit).

## Key Directives

1. **HIPAA & Regulatory Compliance First**:
   - Zero tolerance for mock or placeholder personal health information (PHI).
   - Strict adherence to HIPAA Privacy, Security, Breach Notification, and Omnibus rules.
   - All lead submissions and newsletter subscriptions must be validated, encrypted, and isolated.

2. **Security & Session Hygiene**:
   - Admin CMS session tokens must never persist across fresh page loads to prevent unauthorized access on shared workstation terminals.
   - Administrative floating controls (e.g. Floating CMS button) must ONLY be rendered when an active, authenticated super-admin session exists (`isAdminAuthenticated === true`).

3. **Editorial Excellence & SEO Optimization**:
   - Every published article must solve real U.S. medical billing problems (E/M modifier -25/-59 compliance, Remote Patient Monitoring 16-day rules, prior authorization workflows, aged AR recovery).
   - Rich typography, structured tables, visual callouts, estimated reading times, and focus keyword meta tags.

4. **Responsive & Accessible UI/UX Design**:
   - Full responsiveness across Mobile (320px+), Tablet (768px+), Desktop (1024px+), and Ultra-wide screens.
   - Modal dialogs (Audit Request, Google Docs Import, Media Manager, Rich Text Editor) must be scroll-constrained (`max-h-[90vh] overflow-y-auto`) to prevent screen overflow or clipping on small devices.
