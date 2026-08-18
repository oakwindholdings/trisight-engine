# Dockerfile — trisight-engine on Railway
# Single bun image: builds the CRA frontend (credential-free bundle — no vendor keys exist in the
# browser anymore) and runs the Express server, which serves the build, the market proxy, the data
# API, and self-provisions the Postgres schema at boot.

# Build with node (CRA's terser minifier crashes under bun's worker_threads —
# resourceLimits unimplemented); runtime stays bun.
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci || npm install
COPY . .
ENV NODE_ENV=production
RUN CI=false npm run build

FROM oven/bun:1.2
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY --from=build /app/build ./build
COPY server ./server
COPY api ./api
COPY db ./db
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "server/index.js"]
