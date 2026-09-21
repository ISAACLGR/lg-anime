# lg-anime

Anime streaming application with Express backend and React Native frontend.

## Tech Stack

- Backend: Node.js, Express, tRPC
- Frontend: React Native, Expo
- Database: MySQL
- Deployment: Render

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

```
DATABASE_URL=mysql://user:password@localhost:3306/animefire
SCRAPERAPI_KEY=your_api_key
SCRAPERAPI_URL=https://api.scraperapi.com
SCRAPERAPI_DEVICE_TYPE=desktop
SCRAPERAPI_COUNTRY_CODE=br
CACHE_TTL_MS=7200000
IS_LOCAL=false
NODE_ENV=production
PORT=3000
```
