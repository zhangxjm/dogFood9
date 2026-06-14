package controllers

import (
	"net/http"
	ws "smart-irrigation/websocket"

	"github.com/gin-gonic/gin"
	gorillaWs "github.com/gorilla/websocket"
)

var upgrader = gorillaWs.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketHandler(hub *ws.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &ws.Client{
			Hub:  hub,
			Conn: conn,
			Send: make(chan []byte, 256),
		}

		hub.Register <- client

		go client.WritePump()
		go client.ReadPump()
	}
}
