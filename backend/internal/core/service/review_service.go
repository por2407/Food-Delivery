package service

import (
	"context"
	"errors"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type ReviewService struct {
	reviewRepo     ports.ReviewRepositoryPort
	orderRepo      ports.OrderRepositoryPort
	restaurantRepo ports.RestaurantRepositoryPort
}

func NewReviewService(
	reviewRepo ports.ReviewRepositoryPort,
	orderRepo ports.OrderRepositoryPort,
	restaurantRepo ports.RestaurantRepositoryPort,
) *ReviewService {
	return &ReviewService{
		reviewRepo:     reviewRepo,
		orderRepo:      orderRepo,
		restaurantRepo: restaurantRepo,
	}
}

// CreateReview — ลูกค้ารีวิวได้เฉพาะ order ที่ delivered แล้ว และยังไม่เคยรีวิว
func (s *ReviewService) CreateReview(ctx context.Context, customerID int, req ports.CreateReviewRequest) (*domain.Review, error) {
	// ตรวจว่า order มีจริง + เป็นของ customer + status delivered
	order, err := s.orderRepo.FindOrderByID(ctx, req.OrderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, errors.New("order not found")
	}
	if order.CustomerID != customerID {
		return nil, errors.New("forbidden: not your order")
	}
	if order.Status != domain.OrderStatusDelivered {
		return nil, errors.New("can only review delivered orders")
	}

	// ตรวจว่ายังไม่เคยรีวิว order นี้
	existing, _ := s.reviewRepo.FindByOrderID(ctx, req.OrderID)
	if existing != nil {
		return nil, errors.New("you already reviewed this order")
	}

	review := &domain.Review{
		OrderID:      req.OrderID,
		CustomerID:   customerID,
		RestaurantID: order.RestaurantID,
		Rating:       req.Rating,
		Comment:      req.Comment,
	}

	if err := s.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}
	return review, nil
}

// GetReviewsByRestaurantID — public ดูรีวิวร้าน
func (s *ReviewService) GetReviewsByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Review, error) {
	return s.reviewRepo.FindByRestaurantID(ctx, restaurantID)
}

// UpdateReview — ลูกค้าแก้ไขรีวิวของตัวเอง
func (s *ReviewService) UpdateReview(ctx context.Context, customerID int, reviewID int, req ports.UpdateReviewRequest) (*domain.Review, error) {
	review, err := s.reviewRepo.FindByID(ctx, reviewID)
	if err != nil {
		return nil, err
	}
	if review == nil || review.CustomerID != customerID {
		return nil, errors.New("review not found")
	}
	review.Rating = req.Rating
	review.Comment = req.Comment
	if err := s.reviewRepo.Update(ctx, review); err != nil {
		return nil, err
	}
	return review, nil
}

// DeleteReview — ลูกค้าลบรีวิวของตัวเอง
func (s *ReviewService) DeleteReview(ctx context.Context, customerID int, reviewID int) error {
	return s.reviewRepo.Delete(ctx, reviewID, customerID)
}
