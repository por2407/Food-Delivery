package handlers

import (
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type ReviewHandler struct {
	reviewService ports.ReviewServicePort
}

func NewReviewHandler(reviewService ports.ReviewServicePort) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

// CreateReview — POST /reviews (role: user)
func (h *ReviewHandler) CreateReview(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	review, err := h.reviewService.CreateReview(c.Context(), customerID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Review created", "data": review})
}

// GetReviewsByRestaurant — GET /reviews/restaurant/:restaurant_id (public)
func (h *ReviewHandler) GetReviewsByRestaurant(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid restaurant ID"})
	}
	reviews, err := h.reviewService.GetReviewsByRestaurantID(c.Context(), restaurantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": reviews})
}

// UpdateReview — PUT /reviews/:id (role: user)
func (h *ReviewHandler) UpdateReview(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	reviewID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid review ID"})
	}
	var req ports.UpdateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	review, err := h.reviewService.UpdateReview(c.Context(), customerID, reviewID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Review updated", "data": review})
}

// DeleteReview — DELETE /reviews/:id (role: user)
func (h *ReviewHandler) DeleteReview(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	reviewID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid review ID"})
	}
	if err := h.reviewService.DeleteReview(c.Context(), customerID, reviewID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Review deleted"})
}
