package service

import (
	"context"
	"errors"
	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type MenuService struct {
	menuItemRepo   ports.MenuItemRepositoryPort
	restaurantRepo ports.RestaurantRepositoryPort
}

func NewMenuItemService(menuItemRepo ports.MenuItemRepositoryPort, restaurantRepo ports.RestaurantRepositoryPort) *MenuService {
	return &MenuService{menuItemRepo: menuItemRepo, restaurantRepo: restaurantRepo}
}

func (s *MenuService) CreateMenuItem(ctx context.Context, ownerID int, restaurantID int, req ports.CreateMenuItemRequest) (*domain.MenuItem, error) {
	// ตรวจว่าร้านนี้มีอยู่จริง
	restaurant, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}
	if restaurant == nil {
		return nil, errors.New("restaurant not found")
	}
	// ตรวจว่าเป็นเจ้าของร้าน
	if restaurant.OwnerID != ownerID {
		return nil, errors.New("forbidden: you are not the owner of this restaurant")
	}

	menuItem := &domain.MenuItem{
		RestaurantID: restaurantID,
		Name:         req.Name,
		Description:  req.Description,
		Category:     req.Category,
		Price:        req.Price,
		ImageURL:     req.ImageURL,
	}
	if err := s.menuItemRepo.CreateMenuItem(ctx, menuItem); err != nil {
		return nil, err
	}
	return menuItem, nil
}

// checkOwner ตรวจว่า ownerID เป็นเจ้าของร้าน restaurantID
func (s *MenuService) checkOwner(ctx context.Context, ownerID int, restaurantID int) error {
	restaurant, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
	if err != nil {
		return err
	}
	if restaurant == nil {
		return errors.New("restaurant not found")
	}
	if restaurant.OwnerID != ownerID {
		return errors.New("forbidden: you are not the owner of this restaurant")
	}
	return nil
}

func (s *MenuService) EditMenuItem(ctx context.Context, ownerID int, menuItemID int, restaurantID int, req ports.CreateMenuItemRequest) (*domain.MenuItem, error) {
	if err := s.checkOwner(ctx, ownerID, restaurantID); err != nil {
		return nil, err
	}

	existing, err := s.menuItemRepo.FindMenuItemByID(ctx, menuItemID, restaurantID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("menu item not found")
	}
	existing.Category = req.Category
	existing.Name = req.Name
	existing.Description = req.Description
	existing.Price = req.Price
	existing.ImageURL = req.ImageURL

	if err := s.menuItemRepo.UpdateMenuItem(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *MenuService) CloseOrOpenMenuItem(ctx context.Context, ownerID int, menuItemID int, restaurantID int, isAvailable bool) error {
	if err := s.checkOwner(ctx, ownerID, restaurantID); err != nil {
		return err
	}
	return s.menuItemRepo.UpdateMenuOpenOrCloseStatus(ctx, menuItemID, restaurantID, isAvailable)
}

// GetMenuItemAllByID → ถ้า requesterID เป็นเจ้าของร้านจะเห็นทุกเมนู (รวม is_available=false)
// ถ้าไม่ใช่เจ้าของ (หรือไม่ได้ login) เห็นเฉพาะ is_available=true
func (s *MenuService) GetMenuItemAllByID(ctx context.Context, restaurantID int, requesterID int) ([]*domain.MenuItem, error) {
	if requesterID > 0 {
		restaurant, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
		if err != nil {
			return nil, err
		}
		if restaurant != nil && restaurant.OwnerID == requesterID {
			// เจ้าของร้าน → เห็นทุกเมนู
			return s.menuItemRepo.FindMenuItemsByRestaurantID(ctx, restaurantID)
		}
	}
	// ไม่ใช่เจ้าของ → เห็นเฉพาะที่เปิดอยู่
	return s.menuItemRepo.FindMenuItemsByRestaurantIDAvailable(ctx, restaurantID)
}
