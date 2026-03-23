# VIPLEV Frontend

Vite + React + TypeScript frontend for VIPLEV.

## Backend API configuration

The frontend reads backend API base URL from a Vite environment variable:

- `VITE_API_BASE_URL` (optional)

If omitted, the frontend defaults to `http://localhost`.

### Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` to your backend domain, for example:

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

## Auth storage and security notes

Current implementation stores JWT session data in `localStorage` to satisfy app refresh persistence requirements.

This carries XSS exposure risk (any injected script in origin scope can read `localStorage`). Production hardening should prefer httpOnly secure cookies when backend architecture allows.

Implemented mitigations in this frontend:
- Expired JWTs are rejected during bootstrap and removed from storage.
- API middleware clears persisted session on any `401 Unauthorized`.

Recommended additional mitigations:
- Strict Content Security Policy (CSP) and output escaping to reduce XSS risk.
- Short-lived access tokens with refresh-token rotation.
- Server-side session invalidation and token revocation support.
