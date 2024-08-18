# Build stage for web assets
FROM node:20 AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web ./
RUN npm run build

# Build stage for Go application
FROM golang:1.23-bookworm AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=web-builder /app/web/build ./web/build

# Use a shell script to determine the architecture and build accordingly
COPY <<EOF /build.sh
#!/bin/sh
if [ "$(uname -m)" = "aarch64" ]; then
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o kalmia main.go
else
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o kalmia main.go
fi
EOF

RUN chmod +x /build.sh && /build.sh

# Final stage
FROM node:20-slim
WORKDIR /app

# Copy built artifacts
COPY --from=go-builder /app/kalmia .
COPY --from=web-builder /app/web/build ./web/build
COPY config.json .

EXPOSE 2727
CMD ["./kalmia"]
