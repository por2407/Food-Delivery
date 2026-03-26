package service

import (
	"context"
	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type MenuService struct {
	menuItemRepo ports.MenuItemRepository
}

func NewMenuService(menuItemRepo ports.MenuItemRepository) *MenuService {
	return &MenuService{menuItemRepo: menuItemRepo}
}

func (s *MenuService) CreateMenuItem(ctx context.Context, restaurantID int, req ports.CreateMenuItemRequest) (*domain.MenuItem, error) {
	menuItem := &domain.MenuItem{
		RestaurantID: restaurantID,
		Name:         req.Name,
		Description:  req.Description,
		Price:        req.Price,
		ImageUrl:    req.ImageURL,
		Stock:        req.Stock,
	}
	return s.menuItemRepo.Create(ctx, menuItem)
}