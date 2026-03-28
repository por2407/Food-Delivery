package service

import (
	"context"
	"errors"
	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type RestaurantService struct {
	restaurantRepo ports.RestaurantRepositoryPort
}

func NewRestaurantService(restaurantRepo ports.RestaurantRepositoryPort) *RestaurantService {
	return &RestaurantService{restaurantRepo: restaurantRepo}
}

func (s *RestaurantService) AddRestaurant(ctx context.Context, ownerID int, req ports.CreateRestaurantRequest) (*ports.RestaurantResponse, error) {
	existing, err := s.restaurantRepo.FindRestaurantByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("you have already registered a restaurant")
	}

	restaurant := &domain.Restaurant{
		OwnerID:     ownerID,
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
		Lat:         req.Lat,
		Lng:         req.Lng,
		Image_url:   req.ImageUrl,
		Food_type:   req.FoodType,
		Open_time:   req.OpenTime,
		Close_time:  req.CloseTime,
		Is_active:   true,
	}

	if err := s.restaurantRepo.CreateRestaurant(ctx, restaurant); err != nil {
		return nil, err
	}

	return toRestaurantResponse(restaurant), nil
}

func (s *RestaurantService) EditRestaurant(ctx context.Context, restaurantID int, ownerID int, req ports.EditRestaurantRequest) (*ports.RestaurantResponse, error) {
	// ตรวจสอบว่าร้านนี้มีอยู่จริง
	existing, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("restaurant not found")
	}

	// ตรวจว่าเป็นเจ้าของร้านคนเดียวกัน (owner เท่านั้น)
	if existing.OwnerID != ownerID {
		return nil, errors.New("forbidden: you are not the owner of this restaurant")
	}

	updated := &domain.Restaurant{
		ID:          restaurantID,
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
		Lat:         req.Lat,
		Lng:         req.Lng,
		Image_url:   req.ImageUrl,
		Food_type:   req.FoodType,
		Open_time:   req.OpenTime,
		Close_time:  req.CloseTime,
		Is_active:   req.IsActive,
	}

	if err := s.restaurantRepo.EditRestaurant(ctx, updated); err != nil {
		return nil, err
	}

	// ประกอบ response จากข้อมูลที่แก้ไข (ไม่ query DB อีกรอบ)
	updated.OwnerID = existing.OwnerID
	updated.CreatedAt = existing.CreatedAt
	return toRestaurantResponse(updated), nil
}

func (s *RestaurantService) GetRestaurantAll(ctx context.Context, page int, limit int, foodType string) ([]*ports.RestaurantResponse, int64, error) {
	restaurants, total, err := s.restaurantRepo.FindAllRestaurants(ctx, page, limit, foodType)
	if err != nil {
		return nil, 0, err
	}

	response := make([]*ports.RestaurantResponse, len(restaurants))
	for i, r := range restaurants {
		response[i] = toRestaurantResponse(r)
	}
	return response, total, nil
}

func (s *RestaurantService) GetRestaurantByID(ctx context.Context, restaurantID int) (*ports.RestaurantResponse, error) {
	restaurant, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
	if err != nil {
		return nil, err
	}
	if restaurant == nil {
		return nil, errors.New("restaurant not found")
	}
	return toRestaurantResponse(restaurant), nil
}

// helper map domain → response
func toRestaurantResponse(r *domain.Restaurant) *ports.RestaurantResponse {
	return &ports.RestaurantResponse{
		ID:          r.ID,
		OwnerID:     r.OwnerID,
		Name:        r.Name,
		Description: r.Description,
		Address:     r.Address,
		Lat:         r.Lat,
		Lng:         r.Lng,
		ImageUrl:    r.Image_url,
		FoodType:    r.Food_type,
		OpenTime:    r.Open_time,
		CloseTime:   r.Close_time,
		IsActive:    r.Is_active,
		CreatedAt:   r.CreatedAt,
	}
}

func (s *RestaurantService) CloseOrOpenRestaurant(ctx context.Context, restaurantID int, isActive bool) error {
	existing, err := s.restaurantRepo.FindRestaurantByID(ctx, restaurantID)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("restaurant not found")
	}
	return s.restaurantRepo.UpdateCloseOrOpenStatus(ctx, restaurantID, isActive)
}
