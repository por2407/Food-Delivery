package domain

import (
	"time"
)

type User struct {
	ID        int       `gorm:"column:id;primaryKey" json:"id"`
	Name      string    `gorm:"column:name" json:"name"`
	Email     string    `gorm:"column:email" json:"email"`
	Password  string    `gorm:"column:password" json:"-"`
	Role      string    `gorm:"column:role" json:"role"`
	Phone     string    `gorm:"column:phone" json:"phone"`
	Avatar    string    `gorm:"column:avatar" json:"avatar"`
	Status    bool      `gorm:"column:status; default:true" json:"status"`
	Note      string    `gorm:"column:note" json:"note"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}
