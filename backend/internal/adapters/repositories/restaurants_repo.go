package repositories

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"food_delivery/internal/core/domain"
)

type RestaurantRepository struct {
	db *gorm.DB
}

func NewRestaurantRepository(db *gorm.DB) *RestaurantRepository {
	return &RestaurantRepository{db: db}
}

func (r *RestaurantRepository) CreateRestaurant(ctx context.Context, restaurant *domain.Restaurant) error {
	if err := r.db.WithContext(ctx).Create(restaurant).Error; err != nil {
		return err
	}
	return nil
}

func (r *RestaurantRepository) FindRestaurantByID(ctx context.Context, id int) (*domain.Restaurant, error) {
	var restaurant domain.Restaurant
	if err := r.db.WithContext(ctx).First(&restaurant, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &restaurant, nil
}

func (r *RestaurantRepository) FindRestaurantByOwnerID(ctx context.Context, ownerID int) (*domain.Restaurant, error) {
	var restaurant domain.Restaurant
	if err := r.db.WithContext(ctx).Where("owner_id = ?", ownerID).First(&restaurant).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &restaurant, nil
}

func (r *RestaurantRepository) EditRestaurant(ctx context.Context, restaurant *domain.Restaurant) error {
	result := r.db.WithContext(ctx).Model(&domain.Restaurant{}).Where("id = ?", restaurant.ID).Updates(map[string]interface{}{
		"name":        restaurant.Name,
		"description": restaurant.Description,
		"address":     restaurant.Address,
		"lat":         restaurant.Lat,
		"lng":         restaurant.Lng,
		"image_url":   restaurant.Image_url,
		"food_type":   restaurant.Food_type,
		"open_time":   restaurant.Open_time,
		"close_time":  restaurant.Close_time,
		"is_active":   restaurant.Is_active,
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("restaurant not found")
	}
	return nil
}

func (r *RestaurantRepository) FindAllRestaurants(ctx context.Context) ([]*domain.Restaurant, error) {
	var restaurants []*domain.Restaurant
	if err := r.db.WithContext(ctx).Where("status = ?", "Y").Find(&restaurants).Error; err != nil {
		return nil, err
	}

	return restaurants, nil
}
