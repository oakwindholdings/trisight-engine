# Vercel Deployment Guide

This guide covers deploying the TriSight application to Vercel with serverless functions.

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repository connected to Vercel
3. Required API keys and credentials

## Environment Variables Setup

### Local Development (.env.local)

```bash
# API Keys
REACT_APP_TWELVE_DATA_API_KEY=your_twelve_data_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key
REACT_APP_FIRECRAWL_API_KEY=your_firecrawl_key

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```bash
# Production & Preview
REACT_APP_TWELVE_DATA_API_KEY
REACT_APP_ANTHROPIC_API_KEY
REACT_APP_FIRECRAWL_API_KEY
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
FRONTEND_URL

# Vercel-specific (auto-generated)
VERCEL_URL
VERCEL_ENV
```

### GitHub Secrets Setup

For CI/CD pipeline, add these secrets in your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:

```bash
VERCEL_TOKEN          # Get from Vercel account settings
VERCEL_ORG_ID         # Get from Vercel project settings
VERCEL_PROJECT_ID     # Get from Vercel project settings
TWELVE_DATA_API_KEY
ANTHROPIC_API_KEY
FIRECRAWL_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
CODECOV_TOKEN         # Optional, for coverage reports
```

## Deployment Process

### Initial Setup

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

### Manual Deployment

1. Build and deploy to preview:
   ```bash
   vercel
   ```

2. Deploy to production:
   ```bash
   vercel --prod
   ```

### Automatic Deployment

With the GitHub Actions workflow configured, deployments happen automatically:

- **Pull Requests**: Deploy to preview environment
- **Main branch**: Deploy to production

## Serverless Functions

The API endpoints are now serverless functions located in `/api`:

- `/api/reports/generate` - Generate new reports
- `/api/reports/list` - List all reports
- `/api/reports/status` - Check report status
- `/api/reports/download` - Download reports
- `/api/reports/cancel` - Cancel report generation

### Function Configuration

Each function has these settings in `vercel.json`:

```json
{
  "functions": {
    "api/reports/*.ts": {
      "maxDuration": 60,    // Maximum execution time (seconds)
      "memory": 1024        // Memory allocation (MB)
    }
  }
}
```

## Monitoring and Logs

1. **Function Logs**: View in Vercel dashboard → Functions tab
2. **Build Logs**: View in Vercel dashboard → Deployments tab
3. **Analytics**: Enable in Vercel dashboard → Analytics tab

## Troubleshooting

### Common Issues

1. **Function Timeout**: Increase `maxDuration` in vercel.json (max 60s for Pro plan)
2. **CORS Errors**: Check `FRONTEND_URL` environment variable
3. **API Key Issues**: Verify all keys are set in Vercel environment
4. **Build Failures**: Check Node version matches local (20.x)

### Debug Commands

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs [deployment-url]

# Redeploy with clean cache
vercel --force

# Check environment variables
vercel env ls
```

## Performance Optimization

1. **Edge Functions**: Consider converting lightweight endpoints to Edge Functions
2. **Caching**: Implement caching headers for static responses
3. **Database Connections**: Use connection pooling for Supabase
4. **Bundle Size**: Monitor and optimize client bundle size

## Security Best Practices

1. Never commit `.env` files
2. Use different API keys for development/production
3. Enable Vercel's DDoS protection
4. Implement rate limiting for API endpoints
5. Regular security audits with `npm audit`

## Cost Optimization

1. Monitor function invocations in Vercel dashboard
2. Implement caching to reduce API calls
3. Use ISR (Incremental Static Regeneration) where possible
4. Optimize function memory allocation based on usage

## Rollback Procedure

If issues occur after deployment:

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"
4. Or use CLI: `vercel rollback [deployment-url]`