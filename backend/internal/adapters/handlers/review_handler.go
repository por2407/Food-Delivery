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

// ─── Rider Reviews ──────────────────────────────────────────────────

// CreateRiderReview — POST /reviews/rider
func (h *ReviewHandler) CreateRiderReview(c *fiber.Ctx) error {
	customerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateRiderReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	review, err := h.reviewService.CreateRiderReview(c.Context(), customerID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Rider review created", "data": review})
}

// GetRiderReviews — GET /reviews/rider/:rider_id
func (h *ReviewHandler) GetRiderReviews(c *fiber.Ctx) error {
	riderID, err := c.ParamsInt("rider_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid rider ID"})
	}
	reviews, err := h.reviewService.GetRiderReviewsByRiderID(c.Context(), riderID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": reviews})
}

// GetRiderReviewByOrder — GET /reviews/rider/order/:order_id
func (h *ReviewHandler) GetRiderReviewByOrder(c *fiber.Ctx) error {
	orderID, err := c.ParamsInt("order_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid order ID"})
	}
	review, err := h.reviewService.GetRiderReviewByOrderID(c.Context(), orderID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": review})
}

// GetRiderStats — GET /reviews/riders
func (h *ReviewHandler) GetRiderStats(c *fiber.Ctx) error {
	stats, err := h.reviewService.GetAllRiderStats(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": stats})
}
