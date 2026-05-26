FROM node:20-slim

# ffmpeg is required by the STT pipeline to convert WebM/MP4 audio to WAV
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
