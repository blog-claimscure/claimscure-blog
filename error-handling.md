# Error Handling & Resiliency Protocol

## API Error Response Format
All Express endpoints return standard structured JSON error responses with HTTP status codes:

```json
{
  "error": "Error title or code",
  "message": "Human-readable description of what went wrong",
  "details": []
}
```

## Common Status Codes
- `400 Bad Request`: Missing required request body parameters (e.g., email missing in subscriber opt-in).
- `401 Unauthorized`: Missing or invalid admin Bearer token.
- `404 Not Found`: Requested article ID or category slug does not exist.
- `500 Internal Server Error`: Server exception during processing (logged to console, sanitized response returned to client).

## Client-Side Error Resiliency
- **Graceful Fallbacks**: If API requests fail due to network glitches, client components display friendly retry states rather than crashing the application.
- **Form Error Feedback**: Contact, Audit, and Newsletter forms show inline alert messages for invalid inputs (e.g. invalid email format) and disable action buttons during pending submission.
- **Modal Overflow Protection**: Modals employ CSS scroll boundaries (`max-h-[90vh] overflow-y-auto`) so tall content or error messages do not extend outside viewport bounds.
