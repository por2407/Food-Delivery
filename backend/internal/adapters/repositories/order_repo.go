package repositories

import (
	"context"
	"errors"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"

	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) ports.OrderRepositoryPort {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) DB() *gorm.DB {
	return r.db
}

func (r *OrderRepository) CreateOrder(ctx context.Context, order *domain.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *OrderRepository) FindOrderByID(ctx context.Context, id int) (*domain.Order, error) {
	var order domain.Order
	if err := r.db.WithContext(ctx).Preload("Items").Preload("Address").Preload("Customer").Preload("Rider").Preload("Restaurant").First(&order, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) FindOrdersByCustomerID(ctx context.Context, customerID int) ([]*domain.Order, error) {
	var orders []*domain.Order
	if err := r.db.WithContext(ctx).
		Preload("Items").Preload("Address").Preload("Rider").Preload("Restaurant").
		Preload("Review").Preload("ReviewRider").
		Where("customer_id = ?", customerID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindOrdersByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Order, error) {
	var orders []*domain.Order
	if err := r.db.WithContext(ctx).
		Preload("Items").Preload("Address").Preload("Rider").Preload("Customer").
		Where("restaurant_id = ?", restaurantID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindOrdersByRiderID(ctx context.Context, riderID int) ([]*domain.Order, error) {
	var orders []*domain.Order
	if err := r.db.WithContext(ctx).
		Preload("Items").Preload("Address").Preload("Customer").Preload("Restaurant").
		Where("rider_id = ?", riderID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID int, status string) error {
	result := r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", orderID).Update("status", status)
	if result.RowsAffected == 0 {
		return errors.New("order not found")
	}
	return result.Error
}

func (r *OrderRepository) FindBestSellingItems(ctx context.Context, restaurantID int) ([]*domain.BestSellerItem, error) {
	var results []*domain.BestSellerItem
	
	err := r.db.WithContext(ctx).
		Table("order_items").
		Select("order_items.menu_item_id as menu_item_id, menu_items.name as name, menu_items.image_url as image_url, sum(order_items.quantity) as sales, orders.restaurant_id as restaurant_id, restaurants.image_url as restaurant_image_url").
		Joins("INNER JOIN orders ON orders.id = order_items.order_id").
		Joins("INNER JOIN menu_items ON menu_items.id = order_items.menu_item_id").
		Joins("INNER JOIN restaurants ON restaurants.id = orders.restaurant_id").
		Where("orders.restaurant_id = ?", restaurantID).
		Where("orders.status IN ?", []string{"delivering", "delivered"}).
		Group("order_items.menu_item_id, menu_items.name, menu_items.image_url, orders.restaurant_id, restaurants.image_url").
		Order("sales DESC").
		Limit(5).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r *OrderRepository) FindGlobalBestSellingItems(ctx context.Context, limit int) ([]*domain.BestSellerItem, error) {
	var results []*domain.BestSellerItem

	err := r.db.WithContext(ctx).
		Table("order_items").
		Select("order_items.menu_item_id as menu_item_id, menu_items.name as name, menu_items.image_url as image_url, sum(order_items.quantity) as sales, orders.restaurant_id as restaurant_id, restaurants.image_url as restaurant_image_url").
		Joins("INNER JOIN orders ON orders.id = order_items.order_id").
		Joins("INNER JOIN menu_items ON menu_items.id = order_items.menu_item_id").
		Joins("INNER JOIN restaurants ON restaurants.id = orders.restaurant_id").
		Where("orders.status IN ?", []string{"delivering", "delivered"}).
		Group("order_items.menu_item_id, menu_items.name, menu_items.image_url, orders.restaurant_id, restaurants.image_url").
		Order("sales DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}
	return results, nil
}
