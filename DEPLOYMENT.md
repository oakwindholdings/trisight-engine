# TriSight Deployment Guide

## Quick Start

### 1. First-time Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project to Vercel
vercel link

# Pull environment variables
vercel env pull .env.local
```

### 2. Deploy to Production

```bash
npm run deploy
```

### 3. Deploy Preview

```bash
npm run deploy:preview
```

## Architecture Overview

The TriSight application is now deployed as a serverless architecture on Vercel:

- **Frontend**: React SPA served from Vercel's edge network
- **API**: Serverless functions in `/api` directory
- **Storage**: Supabase for persistent data
- **Report Generation**: Webpack-bundled module running in serverless functions

## Serverless API Endpoints

All API endpoints are now serverless functions:

- `POST /api/reports/generate` - Generate new reports
- `GET /api/reports/list` - List all reports
- `GET /api/reports/status?id={reportId}` - Check report status
- `GET /api/reports/download?id={reportId}` - Download report
- `POST /api/reports/cancel` - Cancel report generation

## Environment Variables

Required environment variables (set in Vercel dashboard):

```bash
REACT_APP_TWELVE_DATA_API_KEY
REACT_APP_ANTHROPIC_API_KEY
REACT_APP_FIRECRAWL_API_KEY
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
FRONTEND_URL
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. Runs tests on every push
2. Deploys preview environments for PRs
3. Deploys to production when merging to main

## Monitoring

View logs and metrics in the Vercel dashboard:

1. Function logs: Vercel Dashboard → Functions
2. Build logs: Vercel Dashboard → Deployments
3. Analytics: Vercel Dashboard → Analytics

## Troubleshooting

### Function Timeouts
If reports are timing out, increase the `maxDuration` in `vercel.json`.

### CORS Issues
Check that `FRONTEND_URL` is set correctly in Vercel environment variables.

### Build Failures
Ensure Node.js version matches local development (20.x).

## MCP Integration

The Model Context Protocol server allows Claude Code to interact with the deployment:

```bash
# Start MCP server locally
node mcp-server.js

# Or set environment variable
TRISIGHT_API_URL=https://trisight.vercel.app/api
```

## Rollback

To rollback to a previous deployment:

```bash
# List deployments
vercel ls

# Promote a specific deployment
vercel rollback [deployment-url]
```