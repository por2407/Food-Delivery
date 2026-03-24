package handlers

import (
	"food_delivery/config"
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/core/ports"
	"time"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	service ports.AuthServic
	cfg     *config.Config
}

func NewAuthHandler(service ports.AuthServic, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		service: service,
		cfg:     cfg,
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req ports.RegisterRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	user, err := h.service.Register(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"message": "registration successful",
		"data":    user,
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req ports.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	result, err := h.service.Login(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Access token → HttpOnly Cookie อายุ 7 วัน
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    result.AccessToken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   h.cfg.App.Env == "prod", // เปลี่ยนเป็น true บน production (HTTPS)
		SameSite: "Lax",
	})

	// Refresh token → ส่งใน response body เป็น Bearer
	return c.JSON(fiber.Map{
		"message": "login successful",
		"info":    result.Info,
	})
}

func (h *AuthHandler) EditProfile(c *fiber.Ctx) error {
	var req ports.EditProfileRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	userID := c.Locals(middleware.LocalUserID).(int)
	// เติม email + role จาก JWT Locals (ไม่รับจาก client เพื่อความปลอดภัย)
	req.Email = c.Locals(middleware.LocalEmail).(string)
	req.Role = c.Locals(middleware.LocalRole).(string)

	updatedInfo, err := h.service.EditProfileByID(c.Context(), userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// ส่งข้อมูลที่อัปเดตแล้วกลับไปให้ client อัปเดต UI ได้เลย
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "profile updated successfully",
		"data":    updatedInfo,
	})
}

// Me ดึงข้อมูล user จาก JWT ที่ middleware parse ไว้แล้ว
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals(middleware.LocalUserID)
	email := c.Locals(middleware.LocalEmail)
	role := c.Locals(middleware.LocalRole)

	return c.JSON(fiber.Map{
		"user_id": userID,
		"email":   email,
		"role":    role,
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// ลบ cookie โดยตั้งค่าให้หมดอายุทันที
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour), // ตั้งให้หมดอายุในอดีต
		HTTPOnly: true,
		Secure:   h.cfg.App.Env == "prod",
		SameSite: "Lax",
	})
	return c.JSON(fiber.Map{
		"message": "logout successful",
	})
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	var req ports.ChangePasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	// ดึง userID จาก JWT cookie ผ่าน middleware
	userID := c.Locals(middleware.LocalUserID).(int)

	if err := h.service.ChangePassword(c.Context(), userID, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "password changed successfully",
	})
}

// ResetPassword → สำหรับคนที่ login ไม่ได้ ยืนยันด้วย email + เบอร์โทร
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req ports.ResetPasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if err := h.service.ResetPassword(c.Context(), req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "password reset successfully",
	})
}
