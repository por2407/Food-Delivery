package handlers

import (
	"fmt"
	"log"

	"food_delivery/internal/adapters/middleware"
	"food_delivery/pkg/ws"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

type WSHandler struct {
	hub *ws.Hub
}

func NewWSHandler(hub *ws.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

// UpgradeCheck → middleware ก่อนเข้า websocket handler
func (h *WSHandler) UpgradeCheck() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	}
}

// RestaurantWS → WebSocket สำหรับเจ้าของร้าน
// เชื่อมต่อที่ /ws/restaurant/:restaurant_id
// ร้านจะได้รับ event เช่น new_order เมื่อมีลูกค้าสั่ง
func (h *WSHandler) RestaurantWS() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		restaurantID := c.Params("restaurant_id")
		channel := ws.ChannelRestaurant + restaurantID

		h.hub.Register(channel, c)
		defer h.hub.Unregister(channel, c)

		log.Printf("[WS] Restaurant %s connected", restaurantID)

		// keep alive loop — อ่าน message จาก client (ping/pong)
		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				log.Printf("[WS] Restaurant %s disconnected: %v", restaurantID, err)
				break
			}
		}
	})
}

// RiderWS → WebSocket สำหรับ rider ทุกคน
// เชื่อมต่อที่ /ws/rider
// rider จะได้รับ event เช่น order_ready เมื่อมีออเดอร์พร้อมให้ไปรับ
func (h *WSHandler) RiderWS() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		userID, _ := c.Locals(middleware.LocalUserID).(int)
		channel := ws.ChannelRiders

		h.hub.Register(channel, c)
		defer h.hub.Unregister(channel, c)

		log.Printf("[WS] Rider %d connected", userID)

		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				log.Printf("[WS] Rider %d disconnected: %v", userID, err)
				break
			}
		}
	})
}

// CustomerWS → WebSocket สำหรับลูกค้า
// เชื่อมต่อที่ /ws/customer
// ลูกค้าจะได้รับ event เช่น order_picked_up, order_delivered
func (h *WSHandler) CustomerWS() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		userID, _ := c.Locals(middleware.LocalUserID).(int)
		channel := fmt.Sprintf("%s%d", ws.ChannelCustomer, userID)

		h.hub.Register(channel, c)
		defer h.hub.Unregister(channel, c)

		log.Printf("[WS] Customer %d connected", userID)

		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				log.Printf("[WS] Customer %d disconnected: %v", userID, err)
				break
			}
		}
	})
}
