# 🚨 URGENT: Render Environment Configuration Checklist

## Current Status
- ❌ Backend returning **502 Bad Gateway**
- ❌ Reason: `USE_SCRAPERAPI=false` in Render (not configured)
- ✅ Service deployed and running
- ✅ Playwright available
- ✅ ScraperAPI key exists in project

## What Needs to Be Done

### Step 1: Open Render Dashboard
1. Go to: https://dashboard.render.com
2. Select your backend service: **lg-anime-backend** (srv-daq9cfp7lnhs73c6d060)
3. Click on **"Settings"** tab
4. Scroll to **"Environment"** section

### Step 2: Add These 9 Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `USE_PLAYWRIGHT` | `true` | Enable Playwright scraper |
| `USE_SCRAPERAPI` | `true` | **CRITICAL** - Must be `true` |
| `SCRAPERAPI_KEY` | `08d973cbf0af4a48f4f5dbb373475b9d` | From VERCEL_ENV_VARS.txt |
| `SCRAPERAPI_URL` | `https://api.scraperapi.com` | ScraperAPI endpoint |
| `SCRAPERAPI_DEVICE_TYPE` | `desktop` | Device type |
| `SCRAPERAPI_COUNTRY_CODE` | `br` | Brazil region |
| `RETRY_ATTEMPTS` | `3` | Number of retry attempts |
| `IS_LOCAL` | `false` | Production environment |
| `CACHE_ENABLED` | `false` | Keep disabled for now |

### Step 3: Save and Deploy
1. Click **"Save"** button
2. Click **"Redeploy Latest Commit"** button
3. Wait 2-3 minutes for deployment to complete
4. Check the **"Events"** tab for build progress

### Step 4: Verify It's Working
After deployment, test the endpoint:
```bash
# Test anime endpoint
curl https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1

# Should return JSON data, not 502
```

Expected logs after configuration:
```
🔍 Scraping config: USE_PLAYWRIGHT=true, USE_SCRAPERAPI=true, hasScraperKey=true
✅ Using ScraperAPI for enhanced scraping
```

---

## Why This is Critical

1. **AnimeFire Blocking**: AnimeFire uses Cloudflare protection + aggressive rate limiting
2. **Playwright Alone Fails**: Without ScraperAPI, requests get 429 (Too Many Requests) errors
3. **ScraperAPI Solution**: Rotates IPs, handles Cloudflare, provides residential proxies
4. **Cost**: ~$1-2 per million requests (very cheap for this use case)

---

## Troubleshooting

### If still getting 502 after configuration:
1. Check Render logs in **"Events"** tab
2. Look for error messages mentioning ScraperAPI
3. Verify the key is exactly: `08d973cbf0af4a48f4f5dbb373475b9d`
4. Make sure `USE_SCRAPERAPI=true` (not false)

### If deployment fails:
1. Ensure all environment variable values are exactly as listed
2. No extra spaces or quotes
3. Redeploy after checking all values

---

**⏰ ACTION REQUIRED**: Add environment variables to Render and redeploy

Once configured, the backend will automatically:
- Use ScraperAPI for requests to AnimeFire
- Rotate IP addresses to avoid blocking
- Handle Cloudflare challenges automatically
- Fall back to Playwright if ScraperAPI fails
- Retry with exponential backoff (2s → 4s → 8s delays)

