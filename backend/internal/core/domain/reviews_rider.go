package domain

import (
	"time"
)

type ReviewRider struct {
	ID        int       `gorm:"column:id;primaryKey" json:"id"`
	OrderID   int       `gorm:"column:order_id" json:"order_id"`
	RiderID   int       `gorm:"column:rider_id" json:"rider_id"`
	Rating     int64     `gorm:"column:rating" json:"rating"`
	Comment    string    `gorm:"column:comment" json:"comment"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`

	CustomerID int   `gorm:"column:customer_id" json:"customer_id"`
	Customer   *User `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

type RiderStat struct {
	RiderID     int     `json:"rider_id"`
	Name        string  `json:"name"`
	Phone       string  `json:"phone"`
	Avatar      string  `json:"avatar"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"review_count"`
}
