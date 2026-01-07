# zenloop CSV Importer - Session Log

**Last Updated:** 2026-01-07
**GitHub Repo:** https://github.com/virnaha/zenloop-csv-importer

---

## What Was Built

A Next.js web app that lets team members bulk import survey responses to zenloop via CSV upload. Replaces the manual IEx console commands with a drag-and-drop interface.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Papa Parse (CSV parsing)
- React Dropzone (file upload)
- NextAuth (Google OAuth)

## Features Implemented

- [x] Drag-and-drop CSV upload
- [x] Survey hash ID input
- [x] Pre-upload CSV validation
  - Header validation (NPS column required)
  - NPS score validation (0-10)
  - Date format validation (DD.MM.YYYY HH:MM)
  - Invisible character stripping
- [x] "Proceed Anyway" option for validation errors
- [x] Real-time progress tracking
- [x] Downloadable CSV template
- [x] Google OAuth authentication
- [x] Optional email domain restriction
- [x] Vercel deployment ready

## File Structure

```
csv-uploader/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   │   └── zenloop/
│   │   │       ├── answer/route.ts           # POST main answer
│   │   │       ├── questions/route.ts        # GET additional questions
│   │   │       └── additional-answer/route.ts # POST additional answers
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Main upload UI
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── ProgressDisplay.tsx
│   │   └── Providers.tsx                     # NextAuth SessionProvider
│   ├── lib/
│   │   ├── csv-processor.ts                  # CSV validation & parsing
│   │   └── zenloop-client.ts                 # API client functions
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts                         # Auth middleware
├── .env.example
├── .env.local                                # Local credentials (not in git)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## Environment Variables

### Local Development (.env.local)
```
ZENLOOP_API_URL=https://api.zenloop.com
ZENLOOP_API_USER=csv_importer_api
ZENLOOP_API_PASSWORD=<password>

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated secret>

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Optional: restrict to company domain
ALLOWED_EMAIL_DOMAIN=zenloop.com
```

### Vercel Production
Same variables, but:
- `NEXTAUTH_URL` = your Vercel app URL

## Pending Setup

### Google OAuth (required for auth to work)
1. Go to https://console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. Configure OAuth consent screen
4. Create OAuth client ID (Web application)
5. Add redirect URI: `https://<your-vercel-url>/api/auth/callback/google`
6. Copy Client ID & Secret to Vercel env vars

## Commands

```bash
# Development
cd csv-uploader
npm install
npm run dev          # http://localhost:3000

# Build
npm run build

# The app is already deployed to Vercel
# Pushes to main auto-deploy
```

## API Flow

1. User uploads CSV → parsed client-side (Papa Parse)
2. Validation runs → shows errors or proceeds
3. For each row:
   - POST `/api/zenloop/answer` → gets answer_id
   - GET `/api/zenloop/questions` → fetch additional questions
   - POST `/api/zenloop/additional-answer` → submit each additional answer
4. Progress updates in real-time

## Git Commits

1. `0dda7db` - Initial app with all CSV import functionality
2. `654aa84` - Added Google OAuth authentication

---

*Use this log to resume work in future Claude sessions.*
