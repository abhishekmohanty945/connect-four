# This Dockerfile is necessary because DigitalOcean's node buildpack does not
# support pnpm (only npm/yarn); to work around this, we must containerize the
# application ourselves, which allows us to install pnpm without issue

# Base image
FROM node:18-alpine
RUN apk update && apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set up project
WORKDIR /usr/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY ./ ./
RUN pnpm build

# Copy bundle.js into dist folder
RUN mkdir -p ./dist/scripts
COPY scripts/bundle.js ./dist/scripts/bundle.js

# Start server
EXPOSE 8080
ENV NODE_ENV production
CMD ["pnpm", "start"]
