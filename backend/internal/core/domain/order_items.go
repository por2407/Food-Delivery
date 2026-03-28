package domain

type OrderItem struct {
	ID         int     `gorm:"column:id;primaryKey" json:"id"`
	OrderID    int     `gorm:"column:order_id;index" json:"order_id"`
	MenuItemID int     `gorm:"column:menu_item_id" json:"menu_item_id"`
	Name       string  `gorm:"column:name" json:"name"`   // snapshot ชื่อเมนูตอนสั่ง
	Price      float64 `gorm:"column:price" json:"price"` // snapshot ราคาตอนสั่ง
	Quantity   int     `gorm:"column:quantity" json:"quantity"`
	SubTotal   float64 `gorm:"column:sub_total" json:"sub_total"`
}
