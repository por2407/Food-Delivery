package handlers

import (
	"fmt"

	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
	"food_delivery/pkg/ws"

	"github.com/gofiber/fiber/v2"
)

type OrdersHandler struct {
	orderService   ports.OrderServicePort
	hub            *ws.Hub
	pendingStore   *ws.PendingStore
	menuRepo       ports.MenuItemRepositoryPort
	restaurantRepo ports.RestaurantRepositoryPort
	addressRepo    ports.AddressRepositoryPort
}

func NewOrdersHandler(
	orderService ports.OrderServicePort,
	hub *ws.Hub,
	pendingStore *ws.PendingStore,
	menuRepo ports.MenuItemRepositoryPort,
	restaurantRepo ports.RestaurantRepositoryPort,
	addressRepo ports.AddressRepositoryPort,
) *OrdersHandler {
	return &OrdersHandler{
		orderService:   orderService,
		hub:            hub,
		pendingStore:   pendingStore,
		menuRepo:       menuRepo,
		restaurantRepo: restaurantRepo,
		addressRepo:    addressRepo,
	}
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

// ═══════════════════════════════════════════════════════════════════════
// Rider actions — Rider ควบคุมสถานะทั้งหมด
// ═══════════════════════════════════════════════════════════════════════

// ─── Rider: ดูออเดอร์ที่รับเอง (กำลังส่ง + ประวัติ) ──────────────────
func (h *OrdersHandler) GetRiderOrders(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orders, err := h.orderService.GetOrdersByRiderID(c.Context(), riderID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": orders})
}

// ─── Rider: กดเปลี่ยนสถานะเป็น "ถึงร้านแล้ว" ──────────────────────────
func (h *OrdersHandler) MarkAtRestaurant(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.MarkAtRestaurant(c.Context(), riderID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// แจ้ง Customer + Restaurant
	h.notifyCustomer(c, orderID, "order_at_restaurant")
	h.notifyRestaurant(c, orderID, "order_at_restaurant")

	return c.JSON(fiber.Map{"message": "Status updated: Rider arrived at restaurant"})
}

// ─── Rider: กดเปลี่ยนสถานะเป็น "กำลังส่งของ" → ร้านได้เงิน ──────────
func (h *OrdersHandler) MarkDelivering(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.MarkDelivering(c.Context(), riderID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// แจ้ง Customer + Restaurant
	h.notifyCustomer(c, orderID, "order_delivering")
	h.notifyRestaurant(c, orderID, "order_delivering")

	return c.JSON(fiber.Map{"message": "Status updated to delivering — restaurant paid"})
}

// ─── Rider: กดเปลี่ยนสถานะเป็น "เสร็จสิ้น" → rider ได้เงิน ──────────
func (h *OrdersHandler) MarkDelivered(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	orderID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	if err := h.orderService.MarkDelivered(c.Context(), riderID, orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// แจ้ง Customer
	h.notifyCustomer(c, orderID, "order_delivered")

	return c.JSON(fiber.Map{"message": "Order delivered — rider paid"})
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

// ─── helper: notify restaurant ───────────────────────────────────────
func (h *OrdersHandler) notifyRestaurant(c *fiber.Ctx, orderID int, eventType string) {
	order, err := h.orderService.GetOrderByID(c.Context(), orderID)
	if err != nil || order == nil {
		return
	}
	channel := fmt.Sprintf("%s%d", ws.ChannelRestaurant, order.RestaurantID)
	h.hub.Publish(c.Context(), channel, ws.Event{
		Type:    eventType,
		OrderID: orderID,
		Data:    order,
	})
}

// ═══════════════════════════════════════════════════════════════════════
// Pending Order — ยังไม่บันทึก DB, รอ Rider รับงาน (real-time)
// ═══════════════════════════════════════════════════════════════════════

// CreatePendingOrder — Customer สร้าง pending order (เก็บใน memory + broadcast ให้ riders)
func (h *OrdersHandler) CreatePendingOrder(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// validate restaurant
	rest, err := h.restaurantRepo.FindRestaurantByID(c.Context(), req.RestaurantID)
	if err != nil || rest == nil || !rest.Is_active {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "restaurant not found or closed"})
	}

	// validate address
	addr, err := h.addressRepo.FindByID(c.Context(), req.AddressID)
	if err != nil || addr == nil || addr.UserID != customerID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "address not found"})
	}

	// build items + total
	var items []ws.PendingOrderItem
	var totalAmount float64
	for _, ri := range req.Items {
		menuItem, err := h.menuRepo.FindMenuItemByID(c.Context(), ri.MenuItemID, req.RestaurantID)
		if err != nil || menuItem == nil || !menuItem.Is_available {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("menu item %d not available", ri.MenuItemID)})
		}
		sub := menuItem.Price * float64(ri.Quantity)
		items = append(items, ws.PendingOrderItem{
			MenuItemID: ri.MenuItemID,
			Name:       menuItem.Name,
			Price:      menuItem.Price,
			Quantity:   ri.Quantity,
			SubTotal:   sub,
			ImageURL:   menuItem.ImageURL,
		})
		totalAmount += sub
	}

	// ค่าส่ง = 10% ของราคาอาหาร (rider ได้รับส่วนแบ่ง 10% ไม่ผูกกับ GPS)
	deliveryFee := ws.CalculateDeliveryFee(totalAmount)

	po := &ws.PendingOrder{
		CustomerID:     customerID,
		RestaurantID:   rest.ID,
		RestaurantName: rest.Name,
		AddressID:      addr.ID,
		AddressLabel:   addr.Label,
		Items:          items,
		TotalAmount:    totalAmount,
		DeliveryFee:    deliveryFee,
		Note:           req.Note,
	}

	h.pendingStore.Add(c.Context(), po)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Pending order created, waiting for rider",
		"data":    po,
	})
}

// CancelPendingOrder — Customer ยกเลิก pending order
func (h *OrdersHandler) CancelPendingOrder(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	pendingID := c.Params("pending_id")
	if pendingID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing pending_id"})
	}
	if err := h.pendingStore.Remove(c.Context(), pendingID, customerID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Pending order cancelled"})
}

// GetMyPendingOrders — Customer ดู pending orders ที่ยังรอ rider
func (h *OrdersHandler) GetMyPendingOrders(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	list := h.pendingStore.GetByCustomer(customerID)
	if list == nil {
		list = []*ws.PendingOrder{}
	}
	return c.JSON(fiber.Map{"data": list})
}

// GetAllPendingOrders — Rider ดูรายการ pending orders ทั้งหมดที่รอ rider รับ
func (h *OrdersHandler) GetAllPendingOrders(c *fiber.Ctx) error {
	list := h.pendingStore.GetAll()
	if list == nil {
		list = []*ws.PendingOrder{}
	}
	return c.JSON(fiber.Map{"data": list})
}

// AcceptPendingOrder — Rider กดรับงาน → บันทึก Order ลง DB status=picking_up → แจ้ง Customer + Restaurant
func (h *OrdersHandler) AcceptPendingOrder(c *fiber.Ctx) error {
	riderID := c.Locals(middleware.LocalUserID).(int)
	pendingID := c.Params("pending_id")
	if pendingID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing pending_id"})
	}

	po, err := h.pendingStore.Accept(c.Context(), pendingID, riderID)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
	}

	// Convert PendingOrder → domain.Order แล้วบันทึกลง DB
	var orderItems []domain.OrderItem
	for _, item := range po.Items {
		orderItems = append(orderItems, domain.OrderItem{
			MenuItemID: item.MenuItemID,
			Name:       item.Name,
			Price:      item.Price,
			Quantity:   item.Quantity,
			SubTotal:   item.SubTotal,
		})
	}

	order := &domain.Order{
		CustomerID:   po.CustomerID,
		RestaurantID: po.RestaurantID,
		RiderID:      &riderID,
		AddressID:    po.AddressID,
		Status:       domain.OrderStatusPickingUp, // เริ่มต้นที่ "กำลังไปรับของ"
		TotalAmount:  po.TotalAmount,
		DeliveryFee:  po.DeliveryFee,
		Note:         po.Note,
		Items:        orderItems,
	}

	if err := h.orderService.CreateOrderDirect(c.Context(), order); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save order: " + err.Error()})
	}

	// Reload with preloads
	savedOrder, _ := h.orderService.GetOrderByID(c.Context(), order.ID)

	// Notify restaurant
	h.hub.Publish(c.Context(), fmt.Sprintf("%s%d", ws.ChannelRestaurant, order.RestaurantID), ws.Event{
		Type:    "new_order",
		OrderID: order.ID,
		Data:    savedOrder,
	})

	// Notify customer ว่ามี rider รับงานแล้ว + order ถูกสร้างใน DB แล้ว
	h.hub.Publish(c.Context(), fmt.Sprintf("%s%d", ws.ChannelCustomer, po.CustomerID), ws.Event{
		Type: "rider_accepted",
		Data: map[string]interface{}{
			"pending_id": pendingID,
			"rider_id":   riderID,
			"order":      savedOrder,
		},
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Order accepted and created",
		"data":    savedOrder,
	})
}

// เมนูขายดีที่สุด by ร้านค้า (Aggregation)
func (h *OrdersHandler) GetOrderSellBest(c *fiber.Ctx) error {
	ownerID := c.Locals(middleware.LocalUserID).(int)

	items, err := h.orderService.GetBestSellingItems(c.Context(), ownerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get best selling items: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Top 5 best selling items",
		"data":    items,
	})
}
// เมนูขายดีที่สุด GLOBALLY (Aggregation)
func (h *OrdersHandler) GetGlobalSellBest(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 1)
	items, err := h.orderService.GetGlobalBestSellingItems(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get global best selling items: " + err.Error()})
	}
	return c.JSON(fiber.Map{
		"data": items,
	})
}
