package handlers

import (
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type MenuHandler struct {
	menuService ports.MenuItemServicePort
}

func NewMenuHandler(menuService ports.MenuItemServicePort) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

func (s *MenuHandler) CreateMenuItem(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}
	ownerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateMenuItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	menuItem, err := s.menuService.CreateMenuItem(c.Context(), ownerID, restaurantID, req)
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

func (h *MenuHandler) EditMenuItem(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}
	menuItemID, err := c.ParamsInt("menu_item_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid menu item ID",
		})
	}
	ownerID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateMenuItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	menuItem, err := h.menuService.EditMenuItem(c.Context(), ownerID, menuItemID, restaurantID, req)
	if err != nil {
		switch err.Error() {
		case "restaurant not found", "menu item not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		case "forbidden: you are not the owner of this restaurant":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Menu item updated successfully",
		"data":    menuItem,
	})
}

func (h *MenuHandler) CloseOrOpenMenuItem(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}
	menuItemID, err := c.ParamsInt("menu_item_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid menu item ID",
		})
	}
	ownerID := c.Locals(middleware.LocalUserID).(int)

	var req struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	if err := h.menuService.CloseOrOpenMenuItem(c.Context(), ownerID, menuItemID, restaurantID, req.IsActive); err != nil {
		switch err.Error() {
		case "restaurant not found", "menu item not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		case "forbidden: you are not the owner of this restaurant":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}
	txtStatus := "closed"
	if req.IsActive {
		txtStatus = "opened"
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Menu item " + txtStatus + " successfully",
	})
}

func (h *MenuHandler) GetMenuItemAllByID(c *fiber.Ctx) error {
	restaurantID, err := c.ParamsInt("restaurant_id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid restaurant ID",
		})
	}
	// requesterID = 0 ถ้าไม่ได้ login (OptionalAuth)
	requesterID, _ := c.Locals(middleware.LocalUserID).(int)
	menuItems, err := h.menuService.GetMenuItemAllByID(c.Context(), restaurantID, requesterID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Get menu items successfully",
		"data":    menuItems,
	})
}
