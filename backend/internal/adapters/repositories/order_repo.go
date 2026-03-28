package repositories

import (
	"context"
	"errors"
	"fmt"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
	if err := r.db.WithContext(ctx).Preload("Items").Preload("Address").First(&order, id).Error; err != nil {
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
		Preload("Items").Preload("Address").
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
		Preload("Items").Preload("Address").
		Where("restaurant_id = ?", restaurantID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindOrdersByStatus(ctx context.Context, status string) ([]*domain.Order, error) {
	var orders []*domain.Order
	if err := r.db.WithContext(ctx).
		Preload("Items").Preload("Address").
		Where("status = ?", status).
		Order("created_at ASC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindOrdersByRiderID(ctx context.Context, riderID int) ([]*domain.Order, error) {
	var orders []*domain.Order
	if err := r.db.WithContext(ctx).
		Preload("Items").Preload("Address").
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

// AssignRider ใช้ SELECT ... FOR UPDATE เพื่อป้องกัน 2 rider กดรับพร้อมกัน
func (r *OrderRepository) AssignRider(ctx context.Context, orderID int, riderID int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order domain.Order
		// lock row
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			return fmt.Errorf("order not found")
		}
		if order.Status != domain.OrderStatusReady {
			return fmt.Errorf("order is not ready for pickup (current: %s)", order.Status)
		}
		if order.RiderID != nil {
			return fmt.Errorf("order already assigned to another rider")
		}
		order.RiderID = &riderID
		order.Status = domain.OrderStatusPickedUp
		return tx.Save(&order).Error
	})
}
