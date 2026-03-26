package repositories

import (
	"context"

	"gorm.io/gorm"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type MenuItemRepository struct {
	db *gorm.DB
}

func NewMenuItemRepository(db *gorm.DB) ports.MenuItemRepository {
	return &MenuItemRepository{db: db}
}

func (r *MenuItemRepository) CreateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error {
	if err := r.db.WithContext(ctx).Create(menuItem).Error; err != nil {
		return err
	}
	return nil
}