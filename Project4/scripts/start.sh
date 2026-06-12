#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

export GOPROXY=https://goproxy.cn,direct

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "============================================"
echo "  Fire Fighting Digital Twin System"
echo "  Rescue Command Platform Startup Script"
echo "============================================"
echo ""

log_info "Checking dependencies..."

if ! command -v go &> /dev/null; then
    log_error "Go is not installed. Please install Go 1.21+ first."
    exit 1
fi
log_ok "Go $(go version | awk '{print $3}')"

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi
log_ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

if ! command -v protoc &> /dev/null; then
    log_warn "protoc not found. Installing via brew..."
    if command -v brew &> /dev/null; then
        HOMEBREW_NO_AUTO_UPDATE=1 brew install protobuf
        log_ok "protoc installed"
    else
        log_error "brew not found. Please install protobuf compiler manually."
        exit 1
    fi
fi
log_ok "protoc $(protoc --version | awk '{print $2}')"

log_info "Installing Go protoc plugins..."
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
log_ok "Go protoc plugins installed"

log_info "Starting Docker containers (Jaeger + Redis)..."
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
log_ok "Docker containers started"

log_info "Waiting for Redis to be ready..."
for i in $(seq 1 30); do
    if docker exec fft-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        log_ok "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warn "Redis not ready after 30s, continuing anyway..."
    fi
    sleep 1
done

log_info "Downloading Go dependencies..."
go mod tidy
log_ok "Dependencies resolved"

log_info "Generating protobuf code..."
export PATH="$PATH:$(go env GOPATH)/bin"
make proto 2>/dev/null || {
    GRPC_GATEWAY_PATH=$(find "$(go env GOPATH)/pkg/mod" -path "*/grpc-gateway@v1*/third_party/googleapis" 2>/dev/null | head -1)
    if [ -n "$GRPC_GATEWAY_PATH" ]; then
        mkdir -p api/gen/firefighting
        protoc \
            --proto_path=api/proto \
            --proto_path="$GRPC_GATEWAY_PATH" \
            --go_out=api/gen/firefighting --go_opt=paths=source_relative \
            --go-grpc_out=api/gen/firefighting --go-grpc_opt=paths=source_relative \
            --grpc-gateway_out=api/gen/firefighting --grpc-gateway_opt=paths=source_relative \
            api/proto/firefighting/firefighting.proto
        if [ -d api/gen/firefighting/firefighting ]; then
            mv api/gen/firefighting/firefighting/*.go api/gen/firefighting/
            rmdir api/gen/firefighting/firefighting
        fi
    else
        log_warn "Could not find grpc-gateway proto files, skipping proto generation"
    fi
}
log_ok "Protobuf code generated"

log_info "Building server..."
CGO_ENABLED=1 go build -o bin/server ./cmd/server/
log_ok "Server binary built"

log_info "Creating data directory..."
mkdir -p data

echo ""
echo "============================================"
echo "  Starting Fire Fighting Twin System"
echo "============================================"
echo ""
echo "  Web UI:       http://localhost:8080"
echo "  gRPC:         localhost:9090"
echo "  Jaeger UI:    http://localhost:16686"
echo "  Redis:        localhost:6379"
echo "  OTLP gRPC:    localhost:4317"
echo "  OTLP HTTP:    localhost:4318"
echo ""
echo "============================================"
echo ""

exec ./bin/server
