package domain

import (
	"time"
)

type Review struct {
	ID           int       `gorm:"column:id;primaryKey" json:"id"`
	OrderID      int       `gorm:"column:order_id" json:"order_id"`
	CustomerID   int       `gorm:"column:customer_id" json:"customer_id"`
	RestaurantID int       `gorm:"column:restaurant_id" json:"restaurant_id"`
	Rating       int64     `gorm:"column:rating" json:"rating"`
	Comment      string    `gorm:"column:comment" json:"comment"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updated_at"`

	Customer *User `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}
