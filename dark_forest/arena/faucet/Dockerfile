FROM oven/bun:latest

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./
RUN bun install

# Copy source files and .env
COPY . .

# Build with environment variables available
ARG FAUCET_PRIVATE_KEY
ARG DEFAULT_RPC
ENV FAUCET_PRIVATE_KEY=${FAUCET_PRIVATE_KEY}
ENV DEFAULT_RPC=${DEFAULT_RPC}

RUN bun run build

EXPOSE 3000

CMD ["bun", "build/index.js"]