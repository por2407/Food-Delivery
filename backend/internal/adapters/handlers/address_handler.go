package handlers

import (
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type AddressHandler struct {
	addressService ports.AddressServicePort
}

func NewAddressHandler(addressService ports.AddressServicePort) *AddressHandler {
	return &AddressHandler{addressService: addressService}
}

func (h *AddressHandler) AddAddress(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	var req ports.CreateAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	addr, err := h.addressService.AddAddress(c.Context(), userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Address created", "data": addr})
}

func (h *AddressHandler) GetAddresses(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	addrs, err := h.addressService.GetAddresses(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": addrs})
}

func (h *AddressHandler) UpdateAddress(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	addressID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid address ID"})
	}
	var req ports.CreateAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	addr, err := h.addressService.UpdateAddress(c.Context(), userID, addressID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Address updated", "data": addr})
}

func (h *AddressHandler) DeleteAddress(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	addressID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid address ID"})
	}
	if err := h.addressService.DeleteAddress(c.Context(), userID, addressID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Address deleted"})
}

func (h *AddressHandler) SetDefault(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID).(int)
	addressID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid address ID"})
	}
	if err := h.addressService.SetDefault(c.Context(), userID, addressID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Default address set"})
}
