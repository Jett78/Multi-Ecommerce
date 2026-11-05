# Production Deployment Guide

## Overview
This guide covers deploying the ecommerce application with proper cookie handling for authentication across Vercel (frontend) and Render (backend).

## Architecture
- **Frontend:** Next.js on Vercel (`https://ecommerce-boilerplate-web.vercel.app`)
- **Backend:** NestJS on Render (`https://ecommerce-boilerplate-api.onrender.com`)
- **Cookie Strategy:** Same-origin proxy via Next.js rewrites (cookies stored on Vercel domain)

## Environment Variables

### Vercel (Frontend)

Navigate to: Project Settings → Environment Variables

Add the following for **all environments** (Production, Preview, Development):

```bash
# For Next.js rewrites (server-side only)
API_URL=https://ecommerce-boilerplate-api.onrender.com

# Fallback for server actions
NEXT_PUBLIC_API_URL=https://ecommerce-boilerplate-api.onrender.com

# Frontend URL reference
FRONTEND_URL=https://ecommerce-boilerplate-web.vercel.app
```

**Important:** After adding these variables, trigger a new deployment (redeploy or push to Git).

### Render (Backend)

Navigate to: Service → Environment

Add/update the following environment variables:

```bash
# Critical: Enable production cookie mode (__Secure- prefix)
NODE_ENV=production

# Better Auth URL is the FRONTEND (where auth endpoints are reached via proxy)
BETTER_AUTH_URL=https://ecommerce-boilerplate-web.vercel.app

# Frontend URL for CORS/redirects
FRONTEND_URL=https://ecommerce-boilerplate-web.vercel.app

# Keep existing
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
PORT=4000

# Email settings (existing)
MAIL_HOST=mail.samriddhi.com.np
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=no-reply@samriddhi.com.np
MAIL_PASSWORD=No-Reply@2026
MAIL_FROM=Nextjs Boilerplate <no-reply@samriddhi.com.np>
```

**Important:** After updating, manually trigger a deploy on Render.

## Local Development

Your `apps/web/.env` should contain:

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
API_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"
```

Your `apps/api/.env` should contain:

```bash
DATABASE_URL=postgresql://...
PORT=4000
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=1234567890
FRONTEND_URL=http://localhost:3000
# ... email settings
```

## Deployment Order

1. **Deploy Backend First:**
   - Update environment variables on Render
   - Trigger manual deploy or push to trigger auto-deploy
   - Wait for deploy to complete

2. **Deploy Frontend:**
   - Update environment variables on Vercel
   - Push code changes to Git (or redeploy from Vercel dashboard)
   - Vercel will build and deploy with new rewrites

3. **Verify:**
   - Clear browser cookies for `vercel.app` domain
   - Navigate to `https://ecommerce-boilerplate-web.vercel.app/admin`
   - Login with admin credentials
   - Open DevTools → Application → Cookies → `vercel.app` domain
   - Verify presence of `__Secure-better-auth.session_token` and `user_role`
   - Navigate to `/dashboard` - should load successfully

## How It Works

### Before (Cross-Origin - Broken)
```
Browser → https://api.onrender.com/api/auth/sign-in
         ← Set-Cookie: session_token (for onrender.com domain)
         ✗ Third-party cookie blocked by browser
         ✗ Only user_role appears (set via document.cookie)
         ✗ Dashboard fails (no session token)
```

### After (Same-Origin - Fixed)
```
Browser → https://vercel.app/api/auth/sign-in
         ↓ Next.js rewrite
Vercel  → https://onrender.com/api/auth/sign-in
         ← Set-Cookie: session_token
Vercel  → Forwards Set-Cookie to browser
Browser ← Set-Cookie: session_token (for vercel.app domain)
         ✓ First-party cookie stored
         ✓ Cookie sent on subsequent requests
         ✓ Dashboard loads successfully
```

## Rewrite Rules

The following rewrites in `next.config.js` proxy browser requests to the backend:

| Browser Path | Backend Path | Purpose |
|--------------|--------------|---------|
| `/api/auth/*` | `/api/auth/*` | Better Auth endpoints |
| `/api/account/*` | `/auth/*` | Custom AuthController |
| `/api/*` | `/*` | All other endpoints |

## Troubleshooting

### Cookie Still Not Set

1. Check Vercel deployment logs for rewrite errors
2. Verify `API_URL` is set correctly on Vercel
3. Confirm `NODE_ENV=production` on Render
4. Clear browser cache and cookies
5. Test in incognito/private window

### Dashboard Redirect Loop

1. Check middleware `proxy.ts` is reading cookies correctly
2. Verify `/api/account/profile` returns 200 (not 401)
3. Check Network tab for cookie being sent with requests

### CORS Errors

1. Should NOT see CORS errors with same-origin proxy
2. If seeing CORS, browser might be hitting `onrender.com` directly
3. Verify rewrites are active (check Vercel build logs)

### Local Dev Not Working

1. Verify `API_URL=http://localhost:4000` in `apps/web/.env`
2. Both servers must be running (`npm run dev` in both apps)
3. Check ports 3000 and 4000 are not in use

## OAuth Setup (Future)

If you add Google/GitHub OAuth:

1. Update OAuth callback URLs in provider settings:
   - From: `https://ecommerce-boilerplate-api.onrender.com/api/auth/callback/google`
   - To: `https://ecommerce-boilerplate-web.vercel.app/api/auth/callback/google`

2. Better Auth will redirect through the proxy, setting cookies on the frontend domain.

## Notes

- **Render Cold Starts:** Free tier may have 30s+ cold starts on first request after idle. Consider health check pinger or paid tier.
- **Vercel Rewrites:** No additional cost or limits for proxy rewrites.
- **Cookie Security:** `__Secure-` prefix requires HTTPS (automatic on Vercel/Render).
- **SameSite:** Now using `Lax` (safer than `None` and works for same-origin).

## Support

For issues:
1. Check Vercel deployment logs
2. Check Render application logs
3. Review browser DevTools Network + Console tabs
4. Verify environment variables are set correctly on both platforms
