# MarSU Executive Dashboard deployment

Local and hosted settings are separate. Never edit local `.env` files when
deploying:

| Environment | Backend settings   | Frontend settings            |
| ----------- | ------------------ | ---------------------------- |
| Local       | `backend/.env`     | `frontend/.env.development`  |
| Hosted      | Render Environment | Vercel Environment Variables |

Both local files remain ignored by Git, so production changes cannot overwrite
local configuration.

## Current Render 404 fix

Render is currently deploying `main`, but the `/health` endpoint is on
`security-testing`. The old `main` branch prints `Server received...` and
`404 Unmatched request...`, which identifies the wrong deployment.

For the existing Render service:

1. Open **Settings**.
2. Set **Branch** to `security-testing`.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `npm ci`.
5. Set **Start Command** to `npm start`.
6. Set **Health Check Path** to `/health`.
7. Save, then select **Manual Deploy > Clear build cache & deploy**.

A correct deployment logs `MarSU API <commit> is running on port <port>` and
`Health check available at /health`. It does not log `404 Unmatched request` for
`/health`.

## Render backend

The repository's `render.yaml` contains the non-secret service configuration.
Create a Render Blueprint from the repository, or use the existing Web Service
settings listed above. Add only these secret values in Render:

- `MONGO_URI`: the complete MongoDB Atlas URI
- `JWT_SECRET`: a random value containing at least 32 characters
- `CORS_ORIGINS`: the exact Vercel URL, for example
  `https://marsu-dashboard.vercel.app`

Do not set `PORT`; Render supplies it. Do not add `:10000` to public URLs.
Render's public health URL is:

```text
https://marsu-executive-dashbaord.onrender.com/health
```

Expected response:

```json
{ "success": true, "status": "ok" }
```

## Vercel frontend

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Keep the detected **Framework Preset** as Vite.
4. Add one production variable:

```text
VITE_API_URL=https://marsu-executive-dashbaord.onrender.com/api/v1
```

5. Deploy.
6. Copy the final Vercel origin into Render's `CORS_ORIGINS` and redeploy
   Render.

The SPA fallback is already configured in `frontend/vercel.json`.

## Local development

The local setup does not change when Render or Vercel settings change:

1. Keep local secrets and MongoDB settings in `backend/.env`.
2. Keep `VITE_API_URL=http://localhost:5000/api/v1` in
   `frontend/.env.development`.
3. From `backend`, run `npm run dev`.
4. From `frontend`, run `npm run dev`.

Use `backend/.env.example` and `frontend/.env.example` as templates only. Never
commit the real `.env` files.

## Future branch setup

For the simplest long-term workflow, merge `security-testing` into `main`, then
change Render and Vercel back to the `main` production branch. Until that merge
happens, both services must deploy `security-testing` or they will continue to
serve the older application.
