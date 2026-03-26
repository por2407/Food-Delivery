package main

import (
	"fmt"
	"food_delivery/config"
	"food_delivery/pkg/database"

	"food_delivery/internal/adapters/handlers"
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/adapters/repositories"
	"food_delivery/internal/core/service"

	"github.com/gofiber/fiber/v2"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		return
	}

	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		return
	}

	authRepo := repositories.NewAuthRepository(db)
	authService := service.NewAuthService(authRepo, cfg)
	authHandler := handlers.NewAuthHandler(authService, cfg)

	restaurantRepo := repositories.NewRestaurantRepository(db)
	restaurantService := service.NewRestaurantService(restaurantRepo)
	restaurantHandler := handlers.NewRestaurantHandler(restaurantService)

	app := fiber.New()
	api := app.Group("/api")
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Hello, World!",
		})
	})

	// Public routes (ไม่ต้อง login)
	api.Post("/register", authHandler.Register)
	api.Post("/login", authHandler.Login)
	api.Post("/logout", authHandler.Logout)
	api.Post("/reset-password", authHandler.ResetPassword) // ลืมรหัสผ่าน

	api.Get("/restaurants", restaurantHandler.GetRestaurantAll) // ดูข้อมูลร้านอาหาร (เปิดสาธารณะ ไม่ต้อง login)

	// Protected routes (ต้อง login → มี access_token cookie)
	auth := api.Group("/", middleware.AuthRequired(cfg))
	auth.Get("/me", authHandler.Me)
	auth.Put("/edit-profile", authHandler.EditProfile)
	auth.Patch("/change-password", authHandler.ChangePassword)
	auth.Get("/profile", authHandler.GetProfile)

	// Restaurant routes (ต้อง login + role = "rest" หรือ "admin")
	restaurant := api.Group("/restaurants", middleware.AuthRequired(cfg), middleware.RoleRequired("rest", "admin"))
	restaurant.Post("/", restaurantHandler.CreateRestaurant)          //เพิ่มร้านอาหารใหม่ 1ร้าน ต่อ 1 user
	restaurant.Put("/:id", restaurantHandler.EditRestaurant)          // แก้ไขข้อมูลร้านอาหาร (เฉพาะเจ้าของร้านหรือ admin เท่านั้น)
	restaurant.Patch("/close/:id", restaurantHandler.CloseOrOpenRestaurant) // ปิดร้านอาหาร (เฉพาะเจ้าของร้านหรือ admin เท่านั้น)

	fmt.Printf("server is running on port %s\n", cfg.App.Port)
	if err := app.Listen(fmt.Sprintf(":%s", cfg.App.Port)); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
