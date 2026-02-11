# Verification API Contract (expected by this UI)

This UI expects your existing `jobappid-api` to expose **two endpoints**.

## 1) Health
**GET** `/verify/health`

Headers:
- `X-VERIFY-KEY: <office_access_key>`

Response (200):
```json
{ "ok": true }
```

## 2) Search
**POST** `/verify/search`

Headers:
- `X-VERIFY-KEY: <office_access_key>`

Body:
```json
{
  "first_name": "Richard",
  "last_name": "Reed",
  "badge_last4": "1234",
  "badge_token": "badge_demo_123",
  "patron_code": "1234",
  "reason": "unemployment"
}
```

Rules (recommended):
- Allow search only if **token+PIN** OR **name+last4**
- Always write an audit log row for each search
- Return **minimal, verification-only** data (no resume download)

Response (200):
```json
{
  "patron": { "id": "uuid", "first_name": "Richard", "last_name": "Reed", "badge_last4": "1234" },
  "applications": [
    {
      "id": "uuid",
      "submitted_at": "2026-02-10T01:23:45.000Z",
      "status": "new",
      "business_name": "McDonald's",
      "store_number": "102",
      "position_title": "Crew Member"
    }
  ]
}
```

Errors
Return 4xx with a JSON body like:
```json
{ "error": { "code": "unauthorized", "message": "Invalid verify key" } }
```

---

If you want, we can keep these routes in a new file: `src/verifyRoutes.ts` in your API.
