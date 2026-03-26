package handlers

import (
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type RestaurantHandler struct {
	restaurantService ports.RestaurantService
}

func NewRestaurantHandler(restaurantService ports.RestaurantService) *RestaurantHandler {
	return &RestaurantHandler{restaurantService: restaurantService}
}

func (h *RestaurantHandler) CreateRestaurant(c *fiber.Ctx) error {
	var req ports.CreateRestaurantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	// ดึง ownerID จาก JWT Locals
	ownerID := c.Locals(middleware.LocalUserID).(int)

	result, err := h.restaurantService.AddRestaurant(c.Context(), ownerID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Restaurant created successfully",
		"data":    result,
	})
}

func (h *RestaurantHandler) EditRestaurant(c *fiber.Ctx) error {
	// ดึง restaurant ID จาก URL param :id
	restaurantID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}

	var req ports.EditRestaurantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	// ดึง ownerID จาก JWT Locals
	ownerID := c.Locals(middleware.LocalUserID).(int)

	result, err := h.restaurantService.EditRestaurant(c.Context(), restaurantID, ownerID, req)
	if err != nil {
		if err.Error() == "restaurant not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "forbidden: you are not the owner of this restaurant" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Restaurant updated successfully",
		"data":    result,
	})
}

func (h *RestaurantHandler) GetRestaurantAll(c *fiber.Ctx) error {
	result, err := h.restaurantService.GetRestaurantAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"message": "Get all restaurants successfully",
		"data":    result,
	})
}

func (h *RestaurantHandler) CloseOrOpenRestaurant(c *fiber.Ctx) error {
	var req struct {
	IsActive bool `json:"is_active"`
	}
	// ดึง restaurant ID จาก URL param :id
	restaurantID, err := c.ParamsInt("id")
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})

	}

	if err := h.restaurantService.CloseOrOpenRestaurant(c.Context(), restaurantID, req.IsActive); err != nil {
		if err.Error() == "restaurant not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	txtStatus := "closed"
	if req.IsActive {
		txtStatus = "opened"
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Restaurant " + txtStatus + " successfully",
	})
}
