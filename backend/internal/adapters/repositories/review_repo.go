package repositories

import (
	"context"
	"errors"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"

	"gorm.io/gorm"
)

type ReviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ports.ReviewRepositoryPort {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) Create(ctx context.Context, review *domain.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *ReviewRepository) FindByID(ctx context.Context, id int) (*domain.Review, error) {
	var review domain.Review
	if err := r.db.WithContext(ctx).First(&review, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &review, nil
}

func (r *ReviewRepository) FindByOrderID(ctx context.Context, orderID int) (*domain.Review, error) {
	var review domain.Review
	if err := r.db.WithContext(ctx).Where("order_id = ?", orderID).First(&review).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &review, nil
}

func (r *ReviewRepository) FindByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Review, error) {
	var reviews []*domain.Review
	if err := r.db.WithContext(ctx).
		Where("restaurant_id = ?", restaurantID).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}

func (r *ReviewRepository) Update(ctx context.Context, review *domain.Review) error {
	return r.db.WithContext(ctx).Save(review).Error
}

func (r *ReviewRepository) Delete(ctx context.Context, id int, customerID int) error {
	result := r.db.WithContext(ctx).Where("id = ? AND customer_id = ?", id, customerID).Delete(&domain.Review{})
	if result.RowsAffected == 0 {
		return errors.New("review not found")
	}
	return result.Error
}
