package domain

import (
	"time"
)

type Order struct {
	ID                    int       `gorm:"column:id;primaryKey" json:"id"`
	CustomerID            int       `gorm:"column:customer_id" json:"customer_id"`
	RestaurantID          int       `gorm:"column:restaurant_id" json:"restaurant_id"`
	RiderID               *int      `gorm:"column:driver_id" json:"driver_id,omitempty"`
	Status                string    `gorm:"column:status" json:"status"`
	TotalAmount           float64   `gorm:"column:total_amount" json:"total_amount"`
	DeliveryFee           float64   `gorm:"column:delivery_fee" json:"delivery_fee"`
	DeliveryAddress       string    `gorm:"column:delivery_address" json:"delivery_address"`
	Delivery_lat          float64   `gorm:"column:delivery_lat" json:"delivery_lat"`
	Delivery_lng          float64   `gorm:"column:delivery_lng" json:"delivery_lng"`
	Note                  string    `gorm:"column:note" json:"note"`
	StripePaymentIntentID string    `gorm:"column:stripe_payment_intent_id" json:"stripe_payment_intent_id"`
	EstimatedDeliveryTime time.Time `gorm:"column:estimated_delivery_time" json:"estimated_delivery_time"`
	CreatedAt             time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt             time.Time `gorm:"column:updated_at" json:"updated_at"`
}
