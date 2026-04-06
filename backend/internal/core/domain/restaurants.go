package domain

import (
	"time"
)

type Restaurant struct {
	ID          int       `gorm:"column:id;primaryKey" json:"id"`
	OwnerID     int       `gorm:"column:owner_id" json:"owner_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Description string    `gorm:"column:description" json:"description"`
	Address     string    `gorm:"column:address" json:"address"`
	Lat         float64   `gorm:"column:lat" json:"lat"`
	Lng         float64   `gorm:"column:lng" json:"lng"`
	Image_url   string    `gorm:"column:image_url" json:"image_url"`
	Food_type   string    `gorm:"column:food_type" json:"food_type"`
	Rating      float64   `gorm:"column:rating" json:"-"` // Hidden from JSON to use calculated one instead
	AverageRating float64 `gorm:"-" json:"rating"`       // Calculated on the fly
	Is_active   bool      `gorm:"column:is_active;default:true" json:"is_active"`
	Status      string    `gorm:"column:status;default:Y" json:"status"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updated_at"`
}
