# Smart Grid Reactive Power Compensation Control System - Port List

| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| 8080 | HTTP | Spring Boot Web | Web dashboard & REST API |
| 9090 | TCP | Netty Server | Grid device communication (Protobuf) |
| 6379 | TCP | Redis | Distributed lock & cache |
