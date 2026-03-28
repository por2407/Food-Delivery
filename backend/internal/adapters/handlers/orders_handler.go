package handlers

import (
	"fmt"

	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"
	"food_delivery/pkg/ws"

	"github.com/gofiber/fiber/v2"
)

type OrdersHandler struct {
	orderService ports.OrderServicePort
	hub          *ws.Hub
}

func NewOrdersHandler(orderService ports.OrderServicePort, hub *ws.Hub) *OrdersHandler {
	return &OrdersHandler{orderService: orderService, hub: hub}
}

// ─── Customer: สร้างออเดอร์ ───────────────────────────────────────────
func (h *OrdersHandler) CreateOrder(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	order, err := h.orderService.CreateOrder(c.Context(), customerID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// WebSocket → แจ้งร้านอาหารว่ามีออเดอร์ใหม่
	h.hub.Publish(c.Context(), fmt.Sprintf("%s%d", ws.ChannelRestaurant, order.RestaurantID), ws.Event{
		Type:    "new_order",
		OrderID: order.ID,
		Data:    order,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Order created", "data": order})
}

// ─── Customer: ดูออเดอร์ของตัวเอง ────────────────────────────────────
func (h *OrdersHandler) GetMyOrders(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	orders, err := h.orderService.GetOrdersByCustomerID(c.Context(), customerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": orders})
}

// ─── ดู Order เดียว (ทุก role) ────────────────────────────────────────
func (h *OrdersHandler) GetOrderByID(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	role := c.Locals(middleware.LocalRole).(string)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	order, err := h.orderService.GetOrderByIDWithAuth(c.Context(), orderID, userID, role)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": order})
}

// ─── Customer: ยกเลิกออเดอร์ ─────────────────────────────────────────
func (h *OrdersHandler) CancelOrder(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.CancelOrder(c.Context(), userID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Order cancelled"})
}

// ─── Restaurant: ดูออเดอร์ของร้าน ────────────────────────────────────
func (h *OrdersHandler) GetRestaurantOrders(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)
	orders, err := h.orderService.GetOrdersByRestaurantOwnerID(c.Context(), ownerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": orders})
}

// ─── Restaurant: กดรับออเดอร์ ─────────────────────────────────────────
func (h *OrdersHandler) AcceptOrder(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.AcceptOrder(c.Context(), ownerID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	h.notifyCustomer(c, orderID, "order_accepted")
	return c.JSON(fiber.Map{"message": "Order accepted"})
}

// ─── Restaurant: ปฏิเสธออเดอร์ ───────────────────────────────────────
func (h *OrdersHandler) RejectOrder(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.RejectOrder(c.Context(), ownerID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	h.notifyCustomer(c, orderID, "order_rejected")
	return c.JSON(fiber.Map{"message": "Order rejected"})
}

// ─── Restaurant: กดกำลังทำ ───────────────────────────────────────────
func (h *OrdersHandler) PrepareOrder(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.PrepareOrder(c.Context(), ownerID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	h.notifyCustomer(c, orderID, "order_preparing")
	return c.JSON(fiber.Map{"message": "Order preparing"})
}

// ─── Restaurant: กดเสร็จ → แจ้ง Rider ────────────────────────────────
func (h *OrdersHandler) ReadyOrder(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.ReadyOrder(c.Context(), ownerID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// WebSocket → แจ้ง Rider ทุกคนว่ามีออเดอร์พร้อมให้ไปรับ
	h.hub.Publish(c.Context(), ws.ChannelRiders, ws.Event{
		Type:    "order_ready",
		OrderID: orderID,
	})
	h.notifyCustomer(c, orderID, "order_ready")

	return c.JSON(fiber.Map{"message": "Order ready for pickup"})
}

// ─── Rider: ดูออเดอร์ที่พร้อม ────────────────────────────────────────
func (h *OrdersHandler) GetReadyOrders(c *fiber.Ctx) error {
	orders, err := h.orderService.GetReadyOrders(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": orders})
}

// ─── Rider: ดูออเดอร์ที่รับเอง (กำลังส่ง + ประวัติ) ──────────────────
func (h *OrdersHandler) GetRiderOrders(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orders, err := h.orderService.GetOrdersByRiderID(c.Context(), riderID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": orders})
}

// ─── Rider: กดรับงาน (ป้องกัน race condition) ──────────────────────────
func (h *OrdersHandler) PickUpOrder(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.PickUpOrder(c.Context(), riderID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	h.notifyCustomer(c, orderID, "order_picked_up")
	return c.JSON(fiber.Map{"message": "Order picked up"})
}

// ─── Rider: กดส่งแล้ว → แจ้ง Customer ─────────────────────────────────
func (h *OrdersHandler) DeliverOrder(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.DeliverOrder(c.Context(), riderID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// WebSocket → แจ้ง Customer ว่าอาหารถึงแล้ว
	h.notifyCustomer(c, orderID, "order_delivered")

	return c.JSON(fiber.Map{"message": "Order delivered"})
}

// ─── helper: notify customer ─────────────────────────────────────────
func (h *OrdersHandler) notifyCustomer(c *fiber.Ctx, orderID int, eventType string) {
	order, err := h.orderService.GetOrderByID(c.Context(), orderID)
	if err != nil || order == nil {
		return
	}
	channel := fmt.Sprintf("%s%d", ws.ChannelCustomer, order.CustomerID)
	h.hub.Publish(c.Context(), channel, ws.Event{
		Type:    eventType,
		OrderID: orderID,
		Data:    order,
	})
}
