# AI Interview Platform — Deployment Guide

## Quick Start (Docker Compose — Recommended)

> **Requires**: Docker Desktop and Docker Compose installed.

### 1. Configure Environment Variables

```bash
# In the server directory, copy the example and fill in your values
cp server/.env.example server/.env
```

**Critical values to set in `server/.env`:**

| Variable | Description |
|---|---|
| `JWT_SECRET` | **Required** — Long crypto-random string (min 48 chars). Generate with `openssl rand -base64 48` |
| `ALLOWED_ORIGINS` | Your frontend domain(s), comma-separated |
| `GEMINI_API_KEY` | Gemini AI API key for LLM evaluation (optional, falls back to ML scoring) |
| `VAPI_API_KEY` | Vapi Voice AI key (optional, for voice interview feature) |
| `ALLOW_DEMO_LOGIN` | Set to `true` for demo/showcase environments |

### 2. Start All Services

```bash
cd major_project-main
docker-compose up --build -d
```

This starts:
- **MongoDB** on port `27017`
- **Express API** on port `5000`
- **React Frontend (Nginx)** on port `3001`

Open → `http://localhost:3001`

### 3. Useful Commands

```bash
# View live logs from all containers
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f server

# Stop all services
docker-compose down

# Stop and wipe the database volume
docker-compose down -v

# Restart with a fresh build
docker-compose down && docker-compose up --build -d
```

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Install dependencies

```bash
cd major_project-main

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server environment (already exists, edit as needed)
# server/.env is pre-configured for localhost development
```

### 3. Seed the database

```bash
cd server && npm run seed
```

### 4. Start the development servers

**Terminal 1 — Backend:**
```bash
cd server && npm run dev
# → Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client && npm run dev
# → Running on http://localhost:3001
```

---

## Cloud Platform Deployment

### Option A: Railway (Easiest — One-Click)

1. Push your code to GitHub.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Add a **MongoDB** plugin from the Railway dashboard.
4. Set environment variables in Railway's Variables tab.
5. Railway auto-detects Dockerfile and deploys both services.

### Option B: Render

1. Create a **Web Service** pointing to `server/` with Docker build.
2. Create a **Static Site** pointing to `client/` — run `npm run build`, publish `dist/`.
3. Set `VITE_API_URL` to your Render server URL for the client build.

### Option C: Docker (Any VPS — DigitalOcean, Linode, EC2)

```bash
# On your VPS
git clone <your-repo-url>
cd major_project-main

# Set environment variables
cp server/.env.example server/.env
nano server/.env  # Fill in production values

# Deploy
docker-compose -f docker-compose.yml up --build -d
```

### Option D: Monolith Deployment (Single Server)

Set `SERVE_STATIC=true` in `server/.env` — the Express server will serve the React build from `../client/dist` directly. Then only start the server:

```bash
cd client && npm run build
cd ../server && npm start
```

---

## Nginx + SSL Reverse Proxy (Production HTTPS)

Place this config in `/etc/nginx/sites-available/ai-interview`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

**Enable and get SSL certificate:**
```bash
sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo nginx -s reload
```

---

## Production Security Checklist

- [ ] `JWT_SECRET` is a strong, unique, 48+ character random string
- [ ] `NODE_ENV=production` is set
- [ ] `.env` file is in `.gitignore` and never committed
- [ ] MongoDB is NOT exposed to the internet (only accessible from server container)
- [ ] `ALLOW_DEMO_LOGIN=false` for real production (not for demos)
- [ ] HTTPS/SSL is configured via Nginx or cloud load balancer
- [ ] Regular MongoDB backups configured
- [ ] Rate limiting is active (`/api/health` probe confirms this)

---

## Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AI Interview Platform API",
  "environment": "production",
  "database": { "status": "connected" },
  "uptimeSeconds": 123,
  "memoryUsageMb": { "rss": "85.2", "heapUsed": "52.1" }
}
```
