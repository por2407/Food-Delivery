package main

import (
	"context"
	"fmt"
	"food_delivery/config"
	"food_delivery/pkg/database"
	pkgredis "food_delivery/pkg/redis"
	"food_delivery/pkg/ws"

	"food_delivery/internal/adapters/handlers"
	"food_delivery/internal/adapters/middleware"
	"food_delivery/internal/adapters/repositories"
	"food_delivery/internal/core/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	// ─── Redis ────────────────────────────────────────────────────────
	rdb, err := pkgredis.NewRedisClient(cfg)
	if err != nil {
		fmt.Printf("Error connecting to Redis: %v\n", err)
		return
	}

	// ─── WebSocket Hub ────────────────────────────────────────────────
	hub := ws.NewHub(rdb)
	pendingStore := ws.NewPendingStore(hub)
	// Subscribe Redis patterns สำหรับ multi-instance
	ctx := context.Background()
	hub.SubscribePattern(ctx, ws.ChannelRestaurant+"*")
	hub.Subscribe(ctx, ws.ChannelRiders)
	hub.SubscribePattern(ctx, ws.ChannelCustomer+"*")

	// ─── Repositories ─────────────────────────────────────────────────────
	authRepo := repositories.NewAuthRepository(db)
	restaurantRepo := repositories.NewRestaurantRepository(db)
	menuItemRepo := repositories.NewMenuItemRepository(db)
	addressRepo := repositories.NewAddressRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	reviewRepo := repositories.NewReviewRepository(db)

	// ─── Services ─────────────────────────────────────────────────────
	authService := service.NewAuthService(authRepo, cfg)
	restaurantService := service.NewRestaurantService(restaurantRepo)
	menuItemService := service.NewMenuItemService(menuItemRepo, restaurantRepo)
	addressService := service.NewAddressService(addressRepo)
	orderService := service.NewOrderService(orderRepo, menuItemRepo, restaurantRepo, addressRepo)
	reviewService := service.NewReviewService(reviewRepo, orderRepo, restaurantRepo)

	// ─── Handlers ───────────────────────────────────────────────────────
	authHandler := handlers.NewAuthHandler(authService, cfg)
	restaurantHandler := handlers.NewRestaurantHandler(restaurantService)
	menuItemHandler := handlers.NewMenuHandler(menuItemService)
	addressHandler := handlers.NewAddressHandler(addressService)
	orderHandler := handlers.NewOrdersHandler(orderService, hub, pendingStore, menuItemRepo, restaurantRepo, addressRepo)
	reviewHandler := handlers.NewReviewHandler(reviewService)
	wsHandler := handlers.NewWSHandler(hub)

	app := fiber.New()

	// ─── CORS ─────────────────────────────────────────────────────────
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))
	api := app.Group("/api")
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Hello, World!"})
	})

	// ─── Public routes ────────────────────────────────────────────────
	api.Post("/register", authHandler.Register)
	api.Post("/login", authHandler.Login)
	api.Post("/logout", authHandler.Logout)
	api.Post("/reset-password", authHandler.ResetPassword)
	// Google OAuth
	api.Get("/auth/google/login", authHandler.GoogleLogin)
	api.Get("/auth/google/callback", authHandler.GoogleCallback)

	api.Get("/restaurants", restaurantHandler.GetRestaurantAll)
	// /restaurants/my ต้อง register ก่อน /:id เสมอ ไม่งั้น Fiber match "my" เป็น int ID
	api.Get("/restaurants/my", middleware.AuthRequired(cfg), middleware.RoleRequired("rest"), restaurantHandler.GetMyRestaurant)
	api.Get("/restaurants/:id", restaurantHandler.GetRestaurantByID)
	api.Get("/food-types", restaurantHandler.GetFoodTypes)
	api.Get("/menu/:restaurant_id", middleware.OptionalAuth(cfg), menuItemHandler.GetMenuItemAllByID)
	api.Get("/reviews/restaurant/:restaurant_id", reviewHandler.GetReviewsByRestaurant)
	api.Get("/reviews/riders", reviewHandler.GetRiderStats)
	api.Get("/reviews/rider/user/:rider_id", reviewHandler.GetRiderReviews)
	api.Get("/orders/global/sell-best", orderHandler.GetGlobalSellBest)

	// ─── Protected routes (ต้อง login) ─────────────────────────────────
	auth := api.Group("/", middleware.AuthRequired(cfg))
	auth.Get("/me", authHandler.Me)
	auth.Put("/edit-profile", authHandler.EditProfile)
	auth.Patch("/change-password", authHandler.ChangePassword)
	auth.Get("/profile", authHandler.GetProfile)

	// ─── Address routes (ต้อง login) ──────────────────────────────────
	address := api.Group("/addresses", middleware.AuthRequired(cfg))
	address.Post("/", addressHandler.AddAddress)
	address.Get("/", addressHandler.GetAddresses)
	address.Put("/:id", addressHandler.UpdateAddress)
	address.Delete("/:id", addressHandler.DeleteAddress)
	address.Patch("/:id/default", addressHandler.SetDefault)

	// ─── Restaurant management (role: rest) ───────────────────────────
	restaurant := api.Group("/restaurants", middleware.AuthRequired(cfg), middleware.RoleRequired("rest"))
	restaurant.Post("/", restaurantHandler.CreateRestaurant)
	restaurant.Put("/:id", restaurantHandler.EditRestaurant)
	restaurant.Patch("/close/:id", restaurantHandler.CloseOrOpenRestaurant)

	// ─── Menu management (role: rest) ─────────────────────────────────
	menu := api.Group("/menu", middleware.AuthRequired(cfg), middleware.RoleRequired("rest"))
	menu.Post("/:restaurant_id", menuItemHandler.CreateMenuItem)
	menu.Put("/:restaurant_id/:menu_item_id", menuItemHandler.EditMenuItem)
	menu.Patch("/close/:restaurant_id/:menu_item_id", menuItemHandler.CloseOrOpenMenuItem)

	// ─── Review routes ────────────────────────────────────────────────
	review := api.Group("/reviews", middleware.AuthRequired(cfg), middleware.RoleRequired("user"))
	review.Post("/", reviewHandler.CreateReview)
	review.Put("/:id", reviewHandler.UpdateReview)
	review.Delete("/:id", reviewHandler.DeleteReview)
	review.Post("/rider", reviewHandler.CreateRiderReview)
	auth.Get("/reviews/rider/order/:order_id", reviewHandler.GetRiderReviewByOrder)

	// ─── Order routes ─────────────────────────────────────────────────
	order := api.Group("/orders", middleware.AuthRequired(cfg))
	// Customer
	order.Post("/", middleware.RoleRequired("user"), orderHandler.CreateOrder)
	order.Get("/my", middleware.RoleRequired("user"), orderHandler.GetMyOrders)
	order.Patch("/cancel/:id", middleware.RoleRequired("user"), orderHandler.CancelOrder)
	// Restaurant (ดูออเดอร์เท่านั้น — ไม่มีการเปลี่ยนสถานะ)
	order.Get("/restaurant", middleware.RoleRequired("rest"), orderHandler.GetRestaurantOrders)
	// Rider — ควบคุมสถานะทั้งหมด
	order.Get("/rider/my", middleware.RoleRequired("rider"), orderHandler.GetRiderOrders)
	order.Patch("/at-restaurant/:id", middleware.RoleRequired("rider"), orderHandler.MarkAtRestaurant)
	order.Patch("/delivering/:id", middleware.RoleRequired("rider"), orderHandler.MarkDelivering)
	order.Patch("/delivered/:id", middleware.RoleRequired("rider"), orderHandler.MarkDelivered)
	// Pending orders (รอ rider รับงาน — real-time)
	order.Post("/pending", middleware.RoleRequired("user"), orderHandler.CreatePendingOrder)
	order.Delete("/pending/:pending_id", middleware.RoleRequired("user"), orderHandler.CancelPendingOrder)
	order.Get("/pending/my", middleware.RoleRequired("user"), orderHandler.GetMyPendingOrders)
	order.Get("/pending/all", middleware.RoleRequired("rider"), orderHandler.GetAllPendingOrders)
	order.Post("/pending/:pending_id/accept", middleware.RoleRequired("rider"), orderHandler.AcceptPendingOrder)
	
	// named routes (ต้องอยู่ก่อน /:id)
	order.Get("/sell-best", middleware.RoleRequired("rest"), orderHandler.GetOrderSellBest)
	
	// Detail (ต้องอยู่หลัง named routes ไม่งั้น /:id จะ match ก่อน)
	order.Get("/:id", orderHandler.GetOrderByID)

	// ─── WebSocket routes ─────────────────────────────────────────────
	wsGroup := app.Group("/ws", wsHandler.UpgradeCheck())
	wsGroup.Get("/restaurant/:restaurant_id", wsHandler.RestaurantWS())
	wsGroup.Get("/rider", middleware.AuthRequired(cfg), wsHandler.RiderWS())
	wsGroup.Get("/customer", middleware.AuthRequired(cfg), wsHandler.CustomerWS())

	fmt.Printf("server is running on port %s\n", cfg.App.Port)
	if err := app.Listen(fmt.Sprintf(":%s", cfg.App.Port)); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
