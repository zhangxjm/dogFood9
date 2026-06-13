FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o /api-gateway ./cmd/api-gateway
RUN CGO_ENABLED=1 GOOS=linux go build -o /data-catalog-service ./cmd/data-catalog
RUN CGO_ENABLED=1 GOOS=linux go build -o /auth-service ./cmd/auth-service
RUN CGO_ENABLED=1 GOOS=linux go build -o /audit-service ./cmd/audit-service
RUN CGO_ENABLED=1 GOOS=linux go build -o /exchange-service ./cmd/exchange-service

FROM alpine:3.18

RUN apk add --no-cache ca-certificates sqlite-libs libc6-compat

WORKDIR /app

COPY --from=builder /api-gateway /app/
COPY --from=builder /data-catalog-service /app/
COPY --from=builder /auth-service /app/
COPY --from=builder /audit-service /app/
COPY --from=builder /exchange-service /app/

COPY web/ /app/web/
COPY config/ /app/config/

RUN mkdir -p /app/data

EXPOSE 8080 8081 8082 8083 8084

CMD ["/app/api-gateway"]
