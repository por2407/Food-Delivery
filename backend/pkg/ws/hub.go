package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/redis/go-redis/v9"
)

// Event ที่ส่งผ่าน WebSocket + Redis
type Event struct {
	Type    string      `json:"type"` // e.g. "new_order", "order_accepted", "order_ready", "order_picked_up", "order_delivered"
	OrderID int         `json:"order_id"`
	Data    interface{} `json:"data,omitempty"`
}

const (
	ChannelRestaurant = "ws:restaurant:" // + restaurant_id
	ChannelRiders     = "ws:riders"      // broadcast ให้ rider ทุกคน
	ChannelCustomer   = "ws:customer:"   // + customer_id
)

// ─── Hub จัดการ WebSocket connections ─────────────────────────────────
type Hub struct {
	mu          sync.RWMutex
	connections map[string]map[*websocket.Conn]bool // channel -> set of conns
	rdb         *redis.Client
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{
		connections: make(map[string]map[*websocket.Conn]bool),
		rdb:         rdb,
	}
}

// Register เพิ่ม connection เข้า channel
func (h *Hub) Register(channel string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.connections[channel] == nil {
		h.connections[channel] = make(map[*websocket.Conn]bool)
	}
	h.connections[channel][conn] = true
	log.Printf("[WS] registered to channel %s (total: %d)", channel, len(h.connections[channel]))
}

// Unregister ลบ connection ออกจาก channel
func (h *Hub) Unregister(channel string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conns, ok := h.connections[channel]; ok {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.connections, channel)
		}
	}
	log.Printf("[WS] unregistered from channel %s", channel)
}

// broadcastLocal ส่ง event ให้ทุก connection ใน channel ของ instance นี้
func (h *Hub) broadcastLocal(channel string, data []byte) {
	h.mu.RLock()
	conns := h.connections[channel]
	h.mu.RUnlock()

	for conn := range conns {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("[WS] write error: %v", err)
			conn.Close()
			h.Unregister(channel, conn)
		}
	}
}

// Publish ส่ง event ผ่าน Redis Pub/Sub → ทุก server instance จะได้รับ
func (h *Hub) Publish(ctx context.Context, channel string, event Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	// ส่ง local ด้วย (กรณี instance เดียวกัน)
	h.broadcastLocal(channel, data)
	// ส่งผ่าน Redis Pub/Sub (กรณี multi-instance)
	return h.rdb.Publish(ctx, channel, data).Err()
}

// Subscribe ฟัง Redis Pub/Sub channel แล้ว broadcast ไปหา local connections
func (h *Hub) Subscribe(ctx context.Context, channels ...string) {
	sub := h.rdb.Subscribe(ctx, channels...)
	go func() {
		defer sub.Close()
		for msg := range sub.Channel() {
			h.broadcastLocal(msg.Channel, []byte(msg.Payload))
		}
	}()
	log.Printf("[WS] Redis subscribed to channels: %v", channels)
}

// SubscribePattern ฟัง Redis Pub/Sub แบบ pattern เช่น ws:restaurant:*
func (h *Hub) SubscribePattern(ctx context.Context, pattern string) {
	sub := h.rdb.PSubscribe(ctx, pattern)
	go func() {
		defer sub.Close()
		for msg := range sub.Channel() {
			h.broadcastLocal(msg.Channel, []byte(msg.Payload))
		}
	}()
	log.Printf("[WS] Redis psubscribed to pattern: %s", pattern)
}
