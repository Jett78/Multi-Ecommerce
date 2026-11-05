# Cookie Fix Summary - Same-Origin Proxy Solution

## Problem
Better-auth session cookie was **not being set** in production because:
- Frontend: `https://ecommerce-boilerplate-web.vercel.app`
- Backend: `https://ecommerce-boilerplate-api.onrender.com`
- Different domains = **cross-site** = third-party cookie context
- Modern browsers block third-party cookies by default → cookie never stored
- Only `user_role` cookie appeared (set client-side via `document.cookie`)
- Dashboard login failed with "Access denied. Admin credentials required."

## Solution
Route all browser API traffic through Next.js rewrites → cookies set on frontend domain → first-party → stored and sent.

## Changes Made

### 1. `apps/web/next.config.js`
Added 3 rewrites with env-based `API_URL`:
- `/api/auth/*` → `${API_URL}/api/auth/*` (better-auth)
- `/api/account/*` → `${API_URL}/auth/*` (custom auth - renamed to avoid collision)
- `/api/*` → `${API_URL}/*` (all other endpoints)

### 2. `apps/web/config/api-routes.ts`
Split browser vs server logic:
- **Browser:** Uses `/api` prefix (same-origin, proxied)
- **Server:** Uses absolute `API_URL` (direct to Render)
- Custom auth: browser `/api/account` → Render `/auth`
- Better auth: browser `/api/auth` → Render `/api/auth`

### 3. `apps/web/lib/auth-client.ts`
Removed absolute `baseURL` → defaults to relative `/api/auth` (same-origin)

### 4. Client Components (7 files)
Replaced hardcoded `process.env.NEXT_PUBLIC_API_URL` with `API_ROUTES`:
- `app/admin/page.tsx`
- `components/auth/login-form.tsx`
- `app/auth/callback/page.tsx`
- `app/verify-email/page.tsx`
- `components/checkout/checkout-view.tsx`
- `components/dashboard/blog-form.tsx`

### 5. `apps/api/src/lib/auth.ts`
Simplified cookie config (removed `SameSite=none`):
- Now uses `SameSite=Lax` (better-auth default, safer)
- Kept `useSecureCookies: true` for `__Secure-` prefix in production

### 6. `apps/web/.env`
Added `API_URL="http://localhost:4000"` for rewrites

### 7. `DEPLOYMENT.md`
Created comprehensive deployment guide with:
- Environment variables for Vercel and Render
- Deployment order and verification steps
- Troubleshooting guide
- Architecture explanation

## Files Changed
- `apps/api/src/lib/auth.ts` (7 lines removed)
- `apps/web/next.config.js` (+12 lines)
- `apps/web/config/api-routes.ts` (+12/-5 lines)
- `apps/web/lib/auth-client.ts` (-1 line)
- `apps/web/app/admin/page.tsx` (+2/-4 lines)
- `apps/web/components/auth/login-form.tsx` (+2/-4 lines)
- `apps/web/app/auth/callback/page.tsx` (+2/-4 lines)
- `apps/web/app/verify-email/page.tsx` (+3/-2 lines)
- `apps/web/components/checkout/checkout-view.tsx` (-2 lines)
- `apps/web/components/dashboard/blog-form.tsx` (+4/-1 lines)
- `apps/web/.env` (+1 line)
- `DEPLOYMENT.md` (new, 234 lines)

**Total:** 10 files changed, 36 insertions, 30 deletions

## Next Steps - Production Deployment

### 1. Update Render (Backend) Environment Variables
Go to Render dashboard → Service → Environment:
```bash
NODE_ENV=production
BETTER_AUTH_URL=https://ecommerce-boilerplate-web.vercel.app
FRONTEND_URL=https://ecommerce-boilerplate-web.vercel.app
```
Trigger manual deploy or push to Git.

### 2. Update Vercel (Frontend) Environment Variables
Go to Vercel dashboard → Project Settings → Environment Variables:
```bash
API_URL=https://ecommerce-boilerplate-api.onrender.com
NEXT_PUBLIC_API_URL=https://ecommerce-boilerplate-api.onrender.com
FRONTEND_URL=https://ecommerce-boilerplate-web.vercel.app
```
Add for all environments (Production, Preview, Development).

### 3. Deploy Code Changes
```bash
git add .
git commit -m "Fix: Implement same-origin proxy for cross-site cookie support"
git push
```
Vercel will auto-deploy. Wait for build to complete.

### 4. Verify Fix
1. Clear browser cookies for `vercel.app` domain
2. Go to `https://ecommerce-boilerplate-web.vercel.app/admin`
3. Login with admin credentials
4. Open DevTools → Application → Cookies → `vercel.app`
5. **Expected:** `__Secure-better-auth.session_token` + `user_role` both present
6. Navigate to `/dashboard` - should load successfully

### 5. Expected Network Behavior
- POST `/api/auth/sign-in/email` → Status 200, same-origin (vercel.app)
- Response Headers → `Set-Cookie: __Secure-better-auth.session_token=...; Domain=vercel.app`
- GET `/api/account/profile` → Status 200, Request Cookies include session token
- Middleware reads cookie → allows dashboard access

## Verification Checklist
- [ ] Render env vars updated (NODE_ENV, BETTER_AUTH_URL, FRONTEND_URL)
- [ ] Vercel env vars updated (API_URL, NEXT_PUBLIC_API_URL)
- [ ] Code pushed to Git and deployed to Vercel
- [ ] Local dev still works (`npm run dev` in both apps)
- [ ] Production login sets `__Secure-better-auth.session_token` cookie on vercel.app
- [ ] Dashboard accessible after login (no redirect loop)
- [ ] Profile fetch returns 200 (not 401)
- [ ] Logout clears cookie

## Rollback Plan
If issues occur:
1. Revert Git commit: `git revert HEAD`
2. Push: `git push`
3. Vercel auto-deploys reverted code
4. Restore previous Render env vars if needed

## Technical Notes
- **Vercel rewrites** forward response headers including Set-Cookie
- **Cookie domain:** Set by browser for the origin that served the response (vercel.app)
- **CORS:** No longer needed for browser requests (same-origin)
- **Server actions:** Continue using absolute URLs with manual Cookie forwarding (unchanged)
- **Cold starts:** Render free tier may have 30s delay on first request after idle

## References
- Better Auth docs: https://www.better-auth.com
- Next.js rewrites: https://nextjs.org/docs/api-reference/next.config.js/rewrites
- Third-party cookie deprecation: https://developers.google.com/privacy-sandbox/3pcd

---
Generated: 2026-11-05
