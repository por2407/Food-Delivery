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
	if err := r.db.WithContext(ctx).
		Select("restaurants.*, (SELECT COALESCE(AVG(reviews.rating), 0)::double precision FROM reviews WHERE reviews.restaurant_id = restaurants.id) as average_rating").
		First(&restaurant, id).Error; err != nil {
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
	// ใช้ Model(&domain.Restaurant{}) และ Updates(map) เพื่อให้ GORM อัปเดตทุกฟีลด์รวมถึงค่าที่เป็น Zero values (เช่น 0, false, "")
	updates := map[string]interface{}{
		"name":        restaurant.Name,
		"description": restaurant.Description,
		"address":     restaurant.Address,
		"lat":         restaurant.Lat,
		"lng":         restaurant.Lng,
		"image_url":   restaurant.Image_url,
		"food_type":   restaurant.Food_type,
	}

	result := r.db.WithContext(ctx).Model(&domain.Restaurant{}).Where("id = ?", restaurant.ID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("restaurant not found")
	}
	return nil
}

func (r *RestaurantRepository) FindAllRestaurants(ctx context.Context, page int, limit int, foodType string) ([]*domain.Restaurant, int64, error) {
	var restaurants []*domain.Restaurant
	var total int64
	query := r.db.WithContext(ctx).Model(&domain.Restaurant{}).Where("is_active = ?", true)

	if foodType != "" {
		query = query.Where("food_type = ?", foodType)
	}

	// Count total records before pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.
		Select("restaurants.*, (SELECT COALESCE(AVG(reviews.rating), 0)::double precision FROM reviews WHERE reviews.restaurant_id = restaurants.id) as average_rating").
		Offset(offset).Limit(limit).Find(&restaurants).Error; err != nil {
		return nil, 0, err
	}

	return restaurants, total, nil
}

func (r *RestaurantRepository) UpdateCloseOrOpenStatus(ctx context.Context, restaurantID int, isActive bool) error {
	result := r.db.WithContext(ctx).Model(&domain.Restaurant{}).Where("id = ?", restaurantID).Update("is_active", isActive)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("restaurant not found")
	}
	return nil
}
