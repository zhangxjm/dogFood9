package handlers

import (
	"backend/internal/machine_learning"
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"math/rand"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WebSocketUpgrader WebSocket升级配置
var WebSocketUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// WebSocketClient WebSocket客户端连接
type WebSocketClient struct {
	ID     string
	Conn   *websocket.Conn
	Send   chan interface{}
	DeviceID *uint
}

// WebSocketHub WebSocket连接管理器
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan interface{}
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	mu         sync.RWMutex
}

// GlobalHub 全局WebSocket Hub
var GlobalHub = NewWebSocketHub()

// NewWebSocketHub 创建WebSocket Hub
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		clients:    make(map[*WebSocketClient]bool),
		broadcast:  make(chan interface{}, 256),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
	}
}

// Run 运行WebSocket Hub
func (hub *WebSocketHub) Run() {
	utils.AppLogger.Info("WebSocket Hub已启动")
	for {
		select {
		case client := <-hub.register:
			hub.mu.Lock()
			hub.clients[client] = true
			hub.mu.Unlock()
			utils.AppLogger.Infof("WebSocket客户端连接：%s，当前连接数：%d", client.ID, hub.ClientCount())

		case client := <-hub.unregister:
			hub.mu.Lock()
			if _, ok := hub.clients[client]; ok {
				delete(hub.clients, client)
				close(client.Send)
			}
			hub.mu.Unlock()
			utils.AppLogger.Infof("WebSocket客户端断开：%s，当前连接数：%d", client.ID, hub.ClientCount())

		case message := <-hub.broadcast:
			hub.mu.RLock()
			for client := range hub.clients {
				select {
				case client.Send <- message:
				default:
					hub.mu.RUnlock()
					hub.mu.Lock()
					delete(hub.clients, client)
					close(client.Send)
					hub.mu.Unlock()
					hub.mu.RLock()
				}
			}
			hub.mu.RUnlock()
		}
	}
}

// ClientCount 获取当前客户端数量
func (hub *WebSocketHub) ClientCount() int {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	return len(hub.clients)
}

// BroadcastMessage 广播消息
func (hub *WebSocketHub) BroadcastMessage(msgType string, data interface{}) {
	message := gin.H{
		"type":      msgType,
		"timestamp": time.Now().Format(time.RFC3339),
		"data":      data,
	}
	hub.broadcast <- message
}

// readPump 读取客户端消息
func (client *WebSocketClient) readPump() {
	defer func() {
		GlobalHub.unregister <- client
		client.Conn.Close()
	}()

	for {
		_, _, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				utils.AppLogger.Warnf("WebSocket读取错误：%v", err)
			}
			break
		}
	}
}

// writePump 向客户端写入消息
func (client *WebSocketClient) writePump() {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := client.Conn.WriteJSON(message); err != nil {
				utils.AppLogger.Warnf("WebSocket写入错误：%v", err)
				return
			}
		}
	}
}

// WebSocketHandler WebSocket连接处理
func WebSocketHandler(c *gin.Context) {
	conn, err := WebSocketUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		utils.AppLogger.Errorf("WebSocket升级失败：%v", err)
		return
	}

	clientID := "client-" + strconv.FormatInt(time.Now().UnixNano(), 10)
	client := &WebSocketClient{
		ID:   clientID,
		Conn: conn,
		Send: make(chan interface{}, 256),
	}

	if deviceIDStr := c.Query("device_id"); deviceIDStr != "" {
		if id, err := strconv.ParseUint(deviceIDStr, 10, 32); err == nil {
			uid := uint(id)
			client.DeviceID = &uid
		}
	}

	GlobalHub.register <- client

	go client.writePump()
	go client.readPump()

	client.Send <- gin.H{
		"type":      "connected",
		"timestamp": time.Now().Format(time.RFC3339),
		"data": gin.H{
			"client_id": clientID,
			"message":   "连接成功",
		},
	}
}

// StartDataSimulator 启动设备数据模拟器（定时推送模拟数据）
func StartDataSimulator() {
	utils.AppLogger.Info("设备数据模拟器已启动")
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		simulateAndPushData()
	}
}

// simulateAndPushData 模拟并推送设备数据
func simulateAndPushData() {
	var devices []models.Device
	database.DB.Where("status = ?", "运行中").Find(&devices)

	if len(devices) == 0 {
		return
	}

	for _, device := range devices {
		data := models.DeviceData{
			DeviceID:  device.ID,
			Timestamp: time.Now(),
			Temp:      40 + rand.Float64()*40,
			Vibration: 1 + rand.Float64()*5,
			Pressure:  0.5 + rand.Float64()*1.0,
			Current:   5 + rand.Float64()*8,
			Runtime:   float64(rand.Intn(1000)),
		}

		select {
		case database.DataBuffer <- &data:
		default:
			database.DB.Create(&data)
		}

		var history []models.DeviceData
		database.DB.Where("device_id = ?", device.ID).
			Order("timestamp ASC").
			Limit(20).
			Find(&history)

		var prediction models.PredictionResult
		if len(history) >= 5 {
			prediction = machine_learning.GlobalPredictor.PredictDeviceFault(device.ID, data, history)
		} else {
			prediction = machine_learning.GlobalPredictor.PredictDeviceFault(device.ID, data, []models.DeviceData{data})
		}

		GlobalHub.BroadcastMessage("device_data", gin.H{
			"device":     device,
			"data":       data,
			"prediction": prediction,
		})

		if prediction.FaultProbability > 60 {
			level := "警告"
			if prediction.FaultProbability > 80 {
				level = "危险"
			}

			alert := models.FaultAlert{
				DeviceID:   device.ID,
				AlertType:  "综合异常",
				Level:      level,
				Message:    "AI预测设备故障风险较高",
				Value:      prediction.FaultProbability,
				Threshold:  60,
				Timestamp:  time.Now(),
				IsResolved: false,
			}
			database.DB.Create(&alert)

			GlobalHub.BroadcastMessage("new_alert", alert)
		}
	}
}
