FROM golang:1.21-alpine

WORKDIR /app

RUN apk add --no-cache gcc musl-dev sqlite-dev

COPY go.mod ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o main .

EXPOSE 8080

CMD ["./main"]
