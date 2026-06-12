.PHONY: proto build run clean docker-up docker-down

PROTO_DIR = api/proto/firefighting
GEN_DIR = api/gen/firefighting
GO_PKG = fire-fighting-twin/api/gen/firefighting
GRPC_GATEWAY_PATH = $(shell go env GOPATH)/pkg/mod/github.com/grpc-ecosystem/grpc-gateway@v1.16.0/third_party/googleapis

proto:
	@mkdir -p $(GEN_DIR)
	protoc \
		--proto_path=api/proto \
		--proto_path=$(GRPC_GATEWAY_PATH) \
		--go_out=$(GEN_DIR) --go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) --go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=$(GEN_DIR) --grpc-gateway_opt=paths=source_relative \
		$(PROTO_DIR)/firefighting.proto
	@if [ -d $(GEN_DIR)/firefighting ]; then \
		mv $(GEN_DIR)/firefighting/*.go $(GEN_DIR)/; \
		rmdir $(GEN_DIR)/firefighting; \
	fi

build:
	CGO_ENABLED=1 go build -o bin/server ./cmd/server/

run: build
	./bin/server

clean:
	rm -rf bin/ data/

docker-up:
	docker compose up -d

docker-down:
	docker compose down

tidy:
	go mod tidy

all: proto build
