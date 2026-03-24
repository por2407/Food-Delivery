package domain

import (
	"time"
)

type MenuItem struct {
	ID           int        `gorm:"column:id;primaryKey" json:"id"`
	RestaurantID int        `gorm:"column:restaurant_id" json:"restaurant_id"`
	Category     string     `gorm:"column:category" json:"category"`
	Name         string     `gorm:"column:name" json:"name"`
	Description  string     `gorm:"column:description" json:"description"`
	Price        float64    `gorm:"column:price" json:"price"`
	ImageURL     string     `gorm:"column:image_url" json:"image_url"`
	Is_available bool       `gorm:"column:is_available" json:"is_available"`
	Stock        int        `gorm:"column:stock" json:"stock"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"deleted_at,omitempty"`
}
