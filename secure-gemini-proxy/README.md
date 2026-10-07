# Hardened Gemini Server-Side Proxy

A hardened, production-ready server-side proxy for Google Gen AI (Gemini) API calls designed for Nature Island Careers.

## Security Guarantees

1. **Zero Browser Key Exposure**: The `GEMINI_API_KEY` lives strictly on the server and is never passed to client bundles or browser localStorage.
2. **Timing-Safe Authentication**: Optional shared secret `APP_TOKEN` checked using `crypto.timingSafeEqual`.
3. **Defense-in-Depth Sanitization**:
   - NFKC Unicode normalization.
   - Strips non-printable ASCII control characters.
   - Strips zero-width unicode characters and bidirectional override characters.
4. **Prompt Injection Heuristic Speed Bumps**: Flags known jailbreak and prompt extraction vectors before reaching the model.
5. **Untrusted Data Isolation**: User inputs are strictly wrapped in `<user_input>` XML tags with high-priority system prompt constraints prohibiting instruction override.
6. **Rate Limiting & Cost Protection**: Express sliding-window rate limiter (15 requests/min per IP) to mitigate denial-of-wallet / abuse.
7. **CORS Allowlist & Helmet Headers**: Restricts origins and applies security headers.
8. **No Stack Trace Leaks**: Generic error handler masks internal exceptions.

## Quick Start

```bash
cd secure-gemini-proxy
npm install
export GEMINI_API_KEY="your-gemini-api-key"
export APP_TOKEN="optional-secure-shared-secret"
export ALLOWED_ORIGINS="http://localhost:3000,https://ais-dev-3zxox7yco7shh2e6igos6w-718276077249.us-east1.run.app"
node server.js
```

## API Endpoint

### `POST /api/chat`
**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <APP_TOKEN>` (if `APP_TOKEN` is configured)

**Request Body**:
```json
{
  "message": "What career opportunities are available in Portsmouth and Roseau?"
}
```

**Response**:
```json
{
  "reply": "..."
}
```
