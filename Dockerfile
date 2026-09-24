# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create symlink for Playwright to find Chromium
RUN ln -s /usr/bin/chromium-browser /usr/bin/chromium || true

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm using corepack (works better on Alpine)
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright browsers (skip since using system Chromium)
RUN npx playwright install --with-deps chromium || true

# Copy source code
COPY . .

# Build only the backend (not the web frontend)
RUN pnpm run build:vercel

# Expose port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
