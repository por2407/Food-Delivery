package repositories

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type MenuItemRepository struct {
	db *gorm.DB
}

func NewMenuItemRepository(db *gorm.DB) ports.MenuItemRepositoryPort {
	return &MenuItemRepository{db: db}
}

func (r *MenuItemRepository) CreateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error {
	if err := r.db.WithContext(ctx).Create(menuItem).Error; err != nil {
		return err
	}
	return nil
}

func (r *MenuItemRepository) FindMenuItemByID(ctx context.Context, menuItemID int, restaurantID int) (*domain.MenuItem, error) {
	var menuItem domain.MenuItem
	if err := r.db.WithContext(ctx).Where("id = ? AND restaurant_id = ?", menuItemID, restaurantID).First(&menuItem).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &menuItem, nil
}

func (r *MenuItemRepository) UpdateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error {
	if err := r.db.WithContext(ctx).Save(&menuItem).Error; err != nil {
		return err
	}
	return nil
}

func (r *MenuItemRepository) UpdateMenuOpenOrCloseStatus(ctx context.Context, menuItemID int, restaurantID int, is_available bool) error {
	result := r.db.WithContext(ctx).Model(&domain.MenuItem{}).Where("id = ? AND restaurant_id = ?", menuItemID, restaurantID).Update("is_available", is_available)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("menu item not found")
	}
	return nil
}

func (r *MenuItemRepository) FindMenuItemsByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.MenuItem, error) {
	var menuItems []*domain.MenuItem
	if err := r.db.WithContext(ctx).
		Select("menu_items.*, "+
			"(SELECT COALESCE(AVG(reviews.rating), 0)::double precision FROM reviews INNER JOIN order_items ON order_items.order_id = reviews.order_id WHERE order_items.menu_item_id = menu_items.id) as rating, "+
			"(SELECT COUNT(reviews.id) FROM reviews INNER JOIN order_items ON order_items.order_id = reviews.order_id WHERE order_items.menu_item_id = menu_items.id) as review_count").
		Where("restaurant_id = ?", restaurantID).
		Find(&menuItems).Error; err != nil {
		return nil, err
	}
	return menuItems, nil
}

func (r *MenuItemRepository) FindMenuItemsByRestaurantIDAvailable(ctx context.Context, restaurantID int) ([]*domain.MenuItem, error) {
	var menuItems []*domain.MenuItem
	if err := r.db.WithContext(ctx).
		Select("menu_items.*, "+
			"(SELECT COALESCE(AVG(reviews.rating), 0)::double precision FROM reviews INNER JOIN order_items ON order_items.order_id = reviews.order_id WHERE order_items.menu_item_id = menu_items.id) as rating, "+
			"(SELECT COUNT(reviews.id) FROM reviews INNER JOIN order_items ON order_items.order_id = reviews.order_id WHERE order_items.menu_item_id = menu_items.id) as review_count").
		Where("restaurant_id = ? AND is_available = true", restaurantID).
		Find(&menuItems).Error; err != nil {
		return nil, err
	}
	return menuItems, nil
}
