package domain

import (
	"time"
)

// Order statuses
const (
	OrderStatusPending   = "pending"   // ลูกค้าสั่งแล้ว รอร้านกดรับ
	OrderStatusAccepted  = "accepted"  // ร้านกดรับแล้ว
	OrderStatusPreparing = "preparing" // ร้านกำลังทำอาหาร
	OrderStatusReady     = "ready"     // อาหารเสร็จแล้ว รอ rider มารับ
	OrderStatusPickedUp  = "picked_up" // rider รับอาหารแล้ว กำลังไปส่ง
	OrderStatusDelivered = "delivered" // ส่งถึงลูกค้าแล้ว
	OrderStatusCancelled = "cancelled" // ยกเลิก
)

type Order struct {
	ID           int       `gorm:"column:id;primaryKey" json:"id"`
	CustomerID   int       `gorm:"column:customer_id;index" json:"customer_id"`
	RestaurantID int       `gorm:"column:restaurant_id;index" json:"restaurant_id"`
	RiderID      *int      `gorm:"column:rider_id;index" json:"rider_id,omitempty"`
	AddressID    int       `gorm:"column:address_id" json:"address_id"`
	Status       string    `gorm:"column:status;default:'pending';index" json:"status"`
	TotalAmount  float64   `gorm:"column:total_amount" json:"total_amount"`
	DeliveryFee  float64   `gorm:"column:delivery_fee" json:"delivery_fee"`
	Note         string    `gorm:"column:note" json:"note"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updated_at"`
	// relations (preload)
	Items   []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Address *Address    `gorm:"foreignKey:AddressID" json:"address,omitempty"`
}
