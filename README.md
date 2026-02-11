# JobAppID Verification Portal (Front-End)

This is a **read-only** web UI intended for public aid / unemployment offices (or other authorized agencies) to verify whether an applicant has applied and where.

## What you get in this download
- A small Vite + React app
- Login screen (office name + access key)
- Applicant lookup screen (Name + Badge last4 OR Badge token + PIN)
- Results table (submitted date, business, store, position, status)

## API expectations (you will implement on the API side)
The UI calls these endpoints on your JobAppID API server:

- `GET /verify/health`
  - Requires header `X-VERIFY-KEY: <access key>`
  - Returns `{ ok: true }`

- `POST /verify/search`
  - Requires header `X-VERIFY-KEY: <access key>`
  - Body:
    ```json
    {
      "first_name": "...",
      "last_name": "...",
      "badge_last4": "1234",
      "badge_token": "badge_xxx",
      "patron_code": "1234",
      "reason": "unemployment"
    }
    ```
  - Returns:
    ```json
    {
      "patron": { "id": "...", "first_name": "...", "last_name": "...", "badge_last4": "1234" },
      "applications": [
        {
          "id": "...",
          "submitted_at": "2026-02-10T01:23:45.000Z",
          "status": "new",
          "business_name": "...",
          "store_number": "...",
          "position_title": "..."
        }
      ]
    }
    ```

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set:
   ```
   VITE_API_BASE_URL=https://YOUR_API_DOMAIN
   ```

4. Run:
   ```bash
   npm run dev
   ```

## Deploy
- Build:
  ```bash
  npm run build
  ```
- Deploy the `dist/` folder to Cloudflare Pages (or your preferred static host).

---

### Security note
This front-end assumes your API enforces:
- `X-VERIFY-KEY` validation
- audit logging on every lookup
- rate limiting
- strict read-only responses (no resumes, no contact info)
