# MarSU Executive Dashboard deployment

The application is split into a Vite frontend and an Express/MongoDB backend.

## Deploy the backend on Render

1. Create a Render Web Service from this repository.
2. Set the service root directory to `backend`.
3. Use:
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/health`
4. Configure these environment variables in Render:
   - `NODE_ENV=production`
   - `MONGO_URI=<your MongoDB Atlas connection string>`
   - `JWT_SECRET=<at least 32 random characters>`
   - `CORS_ORIGINS=https://<your-vercel-domain>,https://<your-custom-domain-if-used>`
   - `TRUST_PROXY=true`
   - Optional: `JWT_EXPIRES_IN=8h`, `RATE_LIMIT_MAX=300`

Do not put MongoDB credentials or `JWT_SECRET` in the repository. The committed
[`backend/.env.example`](backend/.env.example) contains local-development
placeholders only.

After deployment, verify `https://<render-service>.onrender.com/health` returns
JSON with `success: true`.

## Deploy the frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `frontend`.
3. Vercel detects Vite; use `npm run build` and output directory `dist`.
4. Add this environment variable in Vercel for Production (and Preview if
   needed):
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`
5. Redeploy after changing environment variables.

The [`frontend/vercel.json`](frontend/vercel.json) file enables SPA fallback so
direct visits to routes such as `/admin-dashboard` resolve to the React
application.

## CORS rules

The backend reads the comma-separated [`CORS_ORIGINS`](backend/src/app.js:21)
variable. In production, it is required and must contain the exact frontend
origin(s), including `https://` and excluding a trailing slash. Local requests
without an `Origin` header remain allowed for health checks and command-line
tooling.

## Local development

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`, then run
the backend from `backend` with `npm install` and `npm run dev`. The frontend's
[`frontend/.env.development`](frontend/.env.development) points to the local
API. Keep `.env` files out of version control.

## Validation commands

```text
cd backend && npm test
cd backend && npm run check
cd frontend && npm run build
```

The frontend now uses the shared [`API_BASE_URL`](frontend/src/api/axios.js:11),
including login and enrollment dashboard/upload requests, so production builds
do not retain localhost URLs.
