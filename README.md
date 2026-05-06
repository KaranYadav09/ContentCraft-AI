# ContentAI — AI Content Generator & Scheduler

A full-stack MERN application for generating platform-optimized social media content using AI, with scheduling and analytics.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite, React Router, Recharts, date-fns |
| Backend  | Node.js, Express 4, Passport.js (JWT + OAuth) |
| Database | MongoDB + Mongoose  |
| Scheduler| node-cron |
| Auth     | JWT + Twitter OAuth2 + LinkedIn OAuth2 |

## Project Structure

```
ai-content-scheduler/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── editor/        # PromptForm, ContentEditor, PlatformPreview
│       │   ├── scheduler/     # ContentCalendar, ScheduleModal, PostCard
│       │   ├── analytics/     # Dashboard, PlatformChart
│       │   └── auth/          # Login, OAuthConnect
│       ├── hooks/             # useGenerate, useScheduler
│       ├── context/           # AuthContext
│       ├── pages/             # Generate, Calendar, History, Analytics, Settings
│       └── utils/             # api.js (Axios), platformLimits.js
└── server/                    # Node.js + Express
    ├── config/                # db.js, passport.js
    ├── models/                # User, Content, ScheduledPost
    ├── routes/                # auth, generate, posts, analytics
    ├── services/              # openaiService (Claude), twitterService, linkedinService, schedulerService
    ├── middleware/            # auth (JWT), rateLimiter
    └── jobs/                  # postPublisher (node-cron)
```

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd ai-content-scheduler
npm run install:all
```

### 2. Start MongoDB

```bash
mongod --dbpath /data/db
```

### 3. Run Development Servers

```bash
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5000
```

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile/preferences |
| GET | `/api/auth/twitter` | Start Twitter OAuth |
| GET | `/api/auth/linkedin` | Start LinkedIn OAuth |
| DELETE | `/api/auth/disconnect/:platform` | Disconnect social account |

### Content Generation
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/generate` | Generate content (standard) |
| POST | `/api/generate/stream` | Generate content (SSE streaming) |
| GET | `/api/generate` | List user's content |
| PATCH | `/api/generate/:id` | Edit generated content |
| DELETE | `/api/generate/:id` | Delete content |

### Scheduler
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/posts/schedule` | Schedule a post |
| GET | `/api/posts` | List scheduled/published posts |
| GET | `/api/posts/calendar` | Calendar view (grouped by day) |
| PATCH | `/api/posts/:id/reschedule` | Change scheduled time |
| POST | `/api/posts/:id/publish-now` | Publish immediately |
| DELETE | `/api/posts/:id` | Cancel & delete |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics` | Full dashboard stats |
| GET | `/api/analytics/upcoming` | Next 7 days posts |

## Features

- **AI Content Generation**: Claude-powered content with real-time streaming
- **Platform Optimization**: Twitter/X, LinkedIn, Instagram, Facebook, Blog
- **5 Tone Options**: Professional, Casual, Witty, Inspirational, Educational
- **Content Types**: Post, Thread, Caption, Article Intro, Newsletter
- **Live Preview**: Platform-specific visual previews
- **Smart Scheduling**: node-cron scheduler with retry logic (3 attempts)
- **Calendar View**: Monthly calendar with color-coded posts
- **Direct Publishing**: Twitter API v2 + LinkedIn UGC API
- **Analytics**: Platform breakdown, tone stats, daily activity charts
- **JWT Auth** + Twitter/LinkedIn OAuth2
- **Rate Limiting**: Global + AI-specific limits

## Deployment

### Production Build
```bash
npm run build          # Builds React app to client/dist
```

### Environment
Set `NODE_ENV=production` and serve `client/dist` via Express static files or a CDN.

### MongoDB Atlas
Replace `MONGODB_URI` with your Atlas connection string.
