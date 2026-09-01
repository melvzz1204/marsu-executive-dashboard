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
settings listed below. After editing the Blueprint, deploy it with **Manual
Deploy > Clear build cache & deploy** (or Blueprint > Sync) so the new service
settings take effect.

> **Trust proxy:** the app enables Express `trust proxy` automatically whenever
> `NODE_ENV=production`. Render always sets `X-Forwarded-For`, and
> `express-rate-limit` v8 rejects requests when that header is present but trust
> proxy is disabled (`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`). Do not set
> `TRUST_PROXY=false` in production — it would re-introduce that crash.

### Required settings

| Setting        | Value              |
| -------------- | ------------------ |
| Branch         | `security-testing` |
| Root Directory | `backend`          |
| Build Command  | `npm ci`           |
| Start Command  | `npm start`        |
| Health Check   | `/health`          |

### Environment variables

Set these as **secrets** (`sync: false` in `render.yaml` — never commit them):

| Key          | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `MONGO_URI`  | The complete MongoDB Atlas URI                             |
| `JWT_SECRET` | A random value containing at least 32 characters           |
| `AI_API_KEY` | The AI provider API key (Z.ai / OpenAI / Google AI Studio) |

The Blueprint sets the following non-secret values automatically. For an
existing service not managed by the Blueprint, add them manually:

```text
NODE_ENV=production
TRUST_PROXY=true
CORS_ORIGINS=https://marsu-executive-dashbaord.vercel.app
JWT_EXPIRES_IN=8h
RATE_LIMIT_MAX=300

# Empower AI Chatbot
AI_PROVIDER=glm
AI_MODEL=glm-5.3
AI_BASE_URL=https://agentrouter.org/v1
AI_MAX_TOOL_HOPS=5
AI_MAX_OUTPUT_TOKENS=4000
AI_TEMPERATURE=0.2
AI_TIMEOUT_MS=60000
AI_USER_AGENT=roo-code/1.0
CHAT_RATE_LIMIT_MAX=20
```

If `AI_BASE_URL` points to a proxy router such as `agentrouter.org`, keep
`AI_USER_AGENT=roo-code/1.0` — the router whitelists clients by User-Agent and
rejects the OpenAI SDK's default UA.

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
4. The production URL is committed in `frontend/.env.production`. If Vercel also
   defines `VITE_API_URL`, set it to this exact value. You may also set the
   optional timeout shown below for clarity; the frontend defaults to 60
   seconds:

```text
VITE_API_URL=https://marsu-executive-dashbaord.onrender.com/api/v1
VITE_API_TIMEOUT_MS=60000
```

The `/api/v1` suffix is required. Without it, login targets `/auth/login`, but
the backend route is `/api/v1/auth/login`. 5. Deploy with **Use existing Build
Cache** disabled. 6. Redeploy Render so the latest CORS allowlist is active.

The SPA fallback is already configured in `frontend/vercel.json`.

### Vercel requesting localhost

If browser developer tools show a request to `http://localhost:5000/api/v1`, the
deployed frontend was built without the production API value. In Vercel, open
**Settings > Environment Variables**, set `VITE_API_URL` for **Production** to
the Render URL above, then redeploy with **Use existing Build Cache** disabled.
A production browser request must target `onrender.com`, never `localhost`.

## Local development

The local setup does not change when Render or Vercel settings change:

1. Keep local secrets and MongoDB settings in `backend/.env` and set
   `NODE_ENV=development`.
2. Keep `VITE_API_URL=http://localhost:5000/api/v1` in
   `frontend/.env.development`.
3. From `backend`, run `npm run dev`.
4. From `frontend`, run `npm run dev`.

In development, the backend accepts `localhost` and `127.0.0.1` frontend origins
on any port. Production accepts the deployed Vercel origin built into the app
and any additional exact origins listed in Render's `CORS_ORIGINS`.

Use `backend/.env.example` and `frontend/.env.example` as templates only. Never
commit the real `.env` files.

## Future branch setup

For the simplest long-term workflow, merge `security-testing` into `main`, then
change Render and Vercel back to the `main` production branch. Until that merge
happens, both services must deploy `security-testing` or they will continue to
serve the older application.
