package handlers

import (
	"github.com/gofiber/fiber/v2"
)

type OrdersHandler struct {
	// orderService ports.OrderServicePort
}

func NewOrdersHandler() *OrdersHandler {
	return &OrdersHandler{}
}

func (h *OrdersHandler) CreateOrder(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "CreateOrder endpoint - to be implemented",
	})
}
