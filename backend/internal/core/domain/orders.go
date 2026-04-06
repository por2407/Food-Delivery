package domain

import (
	"time"
)

// Order statuses — Rider ควบคุมทั้งหมด
const (
	OrderStatusPickingUp    = "picking_up"  // rider กำลังไปรับของที่ร้าน
	OrderStatusAtRestaurant = "at_restaurant" // rider ถึงร้านแล้ว รออาหาร
	OrderStatusDelivering   = "delivering"  // rider รับของแล้ว กำลังส่งให้ลูกค้า (ร้านได้เงินตอนนี้)
	OrderStatusDelivered    = "delivered"   // ส่งถึงลูกค้าแล้ว เสร็จสิ้น (rider ได้เงินตอนนี้)
	OrderStatusCancelled    = "cancelled"   // ยกเลิก
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
	Items      []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Address    *Address    `gorm:"foreignKey:AddressID" json:"address,omitempty"`
	Customer   *User       `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Rider      *User       `gorm:"foreignKey:RiderID" json:"rider,omitempty"`
	Restaurant *Restaurant `gorm:"foreignKey:RestaurantID" json:"restaurant,omitempty"`

	Review      *Review      `gorm:"foreignKey:OrderID" json:"review,omitempty"`
	ReviewRider *ReviewRider `gorm:"foreignKey:OrderID" json:"review_rider,omitempty"`
}

type BestSellerItem struct {
	MenuItemID         int    `gorm:"column:menu_item_id" json:"menu_item_id"`
	Name               string `gorm:"column:name" json:"name"`
	ImageURL           string `gorm:"column:image_url" json:"image_url"`
	Sales              int    `gorm:"column:sales" json:"sales"`
	RestaurantID       int    `gorm:"column:restaurant_id" json:"restaurant_id"`
	RestaurantImageURL string `gorm:"column:restaurant_image_url" json:"restaurant_image_url"`
}
