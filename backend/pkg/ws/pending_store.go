package ws

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ─── PendingOrder — ออเดอร์ที่รอ rider รับ (เก็บใน memory ไม่ลง DB) ──────

type PendingOrderItem struct {
	MenuItemID int     `json:"menu_item_id"`
	Name       string  `json:"name"`
	Price      float64 `json:"price"`
	Quantity   int     `json:"quantity"`
	SubTotal   float64 `json:"sub_total"`
	ImageURL   string  `json:"image_url"`
}

type PendingOrder struct {
	ID             string             `json:"id"` // UUID-like key: "pending_<timestamp>_<customerID>"
	CustomerID     int                `json:"customer_id"`
	RestaurantID   int                `json:"restaurant_id"`
	RestaurantName string             `json:"restaurant_name"`
	AddressID      int                `json:"address_id"`
	AddressLabel   string             `json:"address_label"`
	Items          []PendingOrderItem `json:"items"`
	TotalAmount    float64            `json:"total_amount"`
	DeliveryFee    float64            `json:"delivery_fee"`
	Note           string             `json:"note"`
	CreatedAt      time.Time          `json:"created_at"`
}

// ─── PendingStore — thread-safe in-memory store ──────────────────────

type PendingStore struct {
	mu     sync.RWMutex
	orders map[string]*PendingOrder // key = PendingOrder.ID
	hub    *Hub
}

func NewPendingStore(hub *Hub) *PendingStore {
	return &PendingStore{
		orders: make(map[string]*PendingOrder),
		hub:    hub,
	}
}

// Add เพิ่ม pending order แล้ว broadcast ให้ riders
func (s *PendingStore) Add(ctx context.Context, po *PendingOrder) {
	s.mu.Lock()
	po.ID = fmt.Sprintf("pending_%d_%d", time.Now().UnixMilli(), po.CustomerID)
	po.CreatedAt = time.Now()
	s.orders[po.ID] = po
	s.mu.Unlock()

	// Broadcast ให้ rider ทุกคน
	s.hub.Publish(ctx, ChannelRiders, Event{
		Type: "new_pending_order",
		Data: po,
	})

	// Notify customer ว่า pending order ถูกสร้างแล้ว
	s.hub.Publish(ctx, fmt.Sprintf("%s%d", ChannelCustomer, po.CustomerID), Event{
		Type: "pending_order_created",
		Data: po,
	})
}

// Remove ลบ pending order (ลูกค้ายกเลิก) แล้ว broadcast
func (s *PendingStore) Remove(ctx context.Context, pendingID string, customerID int) error {
	s.mu.Lock()
	po, ok := s.orders[pendingID]
	if !ok {
		s.mu.Unlock()
		return fmt.Errorf("pending order not found")
	}
	if po.CustomerID != customerID {
		s.mu.Unlock()
		return fmt.Errorf("forbidden: not your order")
	}
	delete(s.orders, pendingID)
	s.mu.Unlock()

	// Broadcast ให้ riders ว่า pending order ถูกยกเลิก
	s.hub.Publish(ctx, ChannelRiders, Event{
		Type: "pending_order_cancelled",
		Data: map[string]string{"id": pendingID},
	})

	// Notify customer ว่ายกเลิกสำเร็จ
	s.hub.Publish(ctx, fmt.Sprintf("%s%d", ChannelCustomer, customerID), Event{
		Type: "pending_order_cancelled",
		Data: map[string]string{"id": pendingID},
	})

	return nil
}

// Accept — rider กดรับงาน (race-safe: ใครเร็วกว่าได้)
// คืน *PendingOrder ถ้ารับได้, error ถ้าถูกคนอื่นรับไปแล้ว
func (s *PendingStore) Accept(ctx context.Context, pendingID string, riderID int) (*PendingOrder, error) {
	s.mu.Lock()
	po, ok := s.orders[pendingID]
	if !ok {
		s.mu.Unlock()
		return nil, fmt.Errorf("pending order not found or already taken")
	}
	// ลบออกจาก store ทันที (ใครเร็วกว่าได้)
	delete(s.orders, pendingID)
	s.mu.Unlock()

	// Broadcast ให้ riders ว่า pending order ถูกรับแล้ว
	s.hub.Publish(ctx, ChannelRiders, Event{
		Type: "pending_order_accepted",
		Data: map[string]interface{}{
			"id":       pendingID,
			"rider_id": riderID,
		},
	})

	return po, nil
}

// GetAll คืนรายการ pending orders ทั้งหมด (สำหรับ rider เปิดหน้ามาครั้งแรก)
func (s *PendingStore) GetAll() []*PendingOrder {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*PendingOrder, 0, len(s.orders))
	for _, po := range s.orders {
		list = append(list, po)
	}
	return list
}

// GetByCustomer คืนรายการ pending orders ของลูกค้าคนนี้
func (s *PendingStore) GetByCustomer(customerID int) []*PendingOrder {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var list []*PendingOrder
	for _, po := range s.orders {
		if po.CustomerID == customerID {
			list = append(list, po)
		}
	}
	return list
}

// ─── Delivery Fee ───────────────────────────────────────────────────

// CalculateDeliveryFee คำนวณค่าส่ง = 10% ของราคาอาหาร
// rider ได้รับส่วนแบ่ง 10% จากราคาอาหาร (ไม่ผูกกับ GPS ป้องกันการโกง)
func CalculateDeliveryFee(totalAmount float64) float64 {
	return totalAmount * 0.10
}
