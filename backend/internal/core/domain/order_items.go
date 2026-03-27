package domain

type OderItem struct {
	ID         int     `gorm:"column:id;primaryKey" json:"id"`
	OrderID    int     `gorm:"column:order_id" json:"order_id"`
	MenuItemID int     `gorm:"column:menu_item_id" json:"menu_item_id"`
	Quantity   int     `gorm:"column:quantity" json:"quantity"`
	UntilPrice float64 `gorm:"column:unit_price" json:"unit_price"`
	SubTotal   float64 `gorm:"column:sub_total" json:"sub_total"`
}
