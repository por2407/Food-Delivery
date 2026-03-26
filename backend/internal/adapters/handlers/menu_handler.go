package handlers

import (
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type MenuHandler struct {
	menuService ports.MenuService
}

func NewMenuHandler(menuService ports.MenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

func (s *MenuHandler) CreateMenuItem(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}
	var req ports.CreateMenuItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	menuItem, err := s.menuService.CreateMenuItem(c.Context(), restaurantID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Menu item created successfully",
		"data":    menuItem,
	})
}