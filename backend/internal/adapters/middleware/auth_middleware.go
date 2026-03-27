package middleware

import (
	"food_delivery/config"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// ชื่อ key สำหรับเก็บใน Fiber locals ใช้ได้ทั้ง project
const (
	LocalUserID = "user_id"
	LocalEmail  = "email"
	LocalRole   = "role"
)

func AuthRequired(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ดึง access_token จาก Cookie
		tokenStr := c.Cookies("access_token")
		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing access token",
			})
		}

		// Parse และ validate JWT
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			// ตรวจว่าใช้ signing method ถูกต้อง
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWT.Secret), nil
		})
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired access token",
			})
		}

		// ดึง claims แล้วเก็บลง Locals เพื่อให้ handler ถัดไปใช้ได้
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token claims",
			})
		}

		c.Locals(LocalUserID, int(claims["user_id"].(float64)))
		c.Locals(LocalEmail, claims["email"].(string))
		c.Locals(LocalRole, claims["role"].(string))

		return c.Next()
	}
}

// OptionalAuth → ถ้ามี token ก็ parse แล้วเก็บ locals, ถ้าไม่มีก็ผ่านได้เลย (ไม่ block)
func OptionalAuth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenStr := c.Cookies("access_token")
		if tokenStr == "" {
			return c.Next()
		}
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWT.Secret), nil
		})
		if err != nil || !token.Valid {
			// token ไม่ valid ก็ผ่านได้เลย (ถือว่าไม่ได้ login)
			return c.Next()
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if ok {
			c.Locals(LocalUserID, int(claims["user_id"].(float64)))
			c.Locals(LocalEmail, claims["email"].(string))
			c.Locals(LocalRole, claims["role"].(string))
		}
		return c.Next()
	}
}

// RoleRequired → ตรวจว่า role ตรงกับที่อนุญาตใช้หลัง AuthRequired
// ตัวอย่าง: middleware.RoleRequired("rest", "admin")
func RoleRequired(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals(LocalRole).(string)
		if !ok || userRole == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden: no role found",
			})
		}
		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "forbidden: insufficient permissions",
		})
	}
}
