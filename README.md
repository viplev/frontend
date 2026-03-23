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
