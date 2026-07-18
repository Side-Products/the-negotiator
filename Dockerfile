FROM node:20-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# BuildKit cache mount persists npm's tarball cache on the build host, so
# lockfile changes unpack from local cache instead of re-downloading.
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
ENV NODE_ENV=production
ENV PORT=3001
# The build script writes to .next-build (never the dev server's .next). ENV
# persists into the running container, so `next start` reads the same dir.
ENV NEXT_DIST_DIR=.next-build

# No env vars needed at build time: pages are static shells and all DB and
# API-key access happens inside API routes at request time.
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Run as non-root (viraloop pattern). Only the build dir (ISR + image optimizer
# cache) and public/recordings (local recording fallback when Wasabi is unset)
# must be writable at runtime; source and node_modules stay root-owned read-only.
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nextjs && \
    mkdir -p public/recordings && \
    chown -R nextjs:nodejs .next-build public/recordings
USER nextjs

EXPOSE 3001
CMD ["npm", "run", "start"]
