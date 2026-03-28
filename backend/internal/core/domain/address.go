package domain

import "time"

type Address struct {
	ID        int       `gorm:"column:id;primaryKey" json:"id"`
	UserID    int       `gorm:"column:user_id;index" json:"user_id"`
	Label     string    `gorm:"column:label" json:"label"`     // เช่น "บ้าน", "ที่ทำงาน", "คอนโด"
	Address   string    `gorm:"column:address" json:"address"` // ที่อยู่แบบเต็ม
	Lat       float64   `gorm:"column:lat" json:"lat"`
	Lng       float64   `gorm:"column:lng" json:"lng"`
	Note      string    `gorm:"column:note" json:"note"`                           // หมายเหตุเพิ่มเติม เช่น "ตึก A ชั้น 5"
	IsDefault bool      `gorm:"column:is_default;default:false" json:"is_default"` // ที่อยู่เริ่มต้น
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}
