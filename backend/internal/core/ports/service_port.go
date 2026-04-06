package ports

import (
	"context"
	"food_delivery/internal/core/domain"
	"time"
)

type RegisterRequest struct {
	Name     string `json:"name" validate:"required, min=2 max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Phone    string `json:"phone" validate:"required,min=10,max=10,numeric"`
	Role     string `json:"role" validate:"required,oneof=user rest admin rider"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type InfoResponse struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Phone  string `json:"phone"`
	Avatar string `json:"avatar"`
}

type LoginResponse struct {
	AccessToken string       `json:"access_token"`
	Info        InfoResponse `json:"info"`
}

type EditProfileRequest struct {
	Name   string `json:"name" validate:"required, min=2 max=100"`
	Phone  string `json:"phone" validate:"required"`
	Avatar string `json:"avatar" validate:"required,url"`
	// ดึงจาก JWT Locals โดย handler ไม่รับจาก client body
	Email string `json:"-"`
	Role  string `json:"-"`
}

// ChangePasswordRequest → ใช้เมื่อ login อยู่แล้ว ต้องยืนยันรหัสเก่า
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required,min=6"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

// ResetPasswordRequest → ใช้เมื่อ login ไม่ได้ ต้องยืนยัน email + เบอร์โทร
type ResetPasswordRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Phone       string `json:"phone" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

type AuthServicePort interface {
	Register(ctx context.Context, req RegisterRequest) (*RegisterRequest, error)
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	EditProfileByID(ctx context.Context, userID int, req EditProfileRequest) (*InfoResponse, error)
	ChangePassword(ctx context.Context, userID int, req ChangePasswordRequest) error
	ResetPassword(ctx context.Context, req ResetPasswordRequest) error
	GetProfile(ctx context.Context, userID int) (*InfoResponse, error)
	// Google OAuth
	GoogleLogin(ctx context.Context) (string, error)
	GoogleCallback(ctx context.Context, code string) (*LoginResponse, error)
}

type CreateRestaurantRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Address     string  `json:"address" validate:"required"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	ImageUrl    string  `json:"image_url"`
	FoodType    string  `json:"food_type"`
}

type RestaurantResponse struct {
	ID          int       `json:"id"`
	OwnerID     int       `json:"owner_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Address     string    `json:"address"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	ImageUrl    string    `json:"image_url"`
	FoodType    string    `json:"food_type"`
	IsActive    bool      `json:"is_active"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type EditRestaurantRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Address     string  `json:"address"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	ImageUrl    string  `json:"image_url"`
	FoodType    string  `json:"food_type"`
}

type RestaurantServicePort interface {
	AddRestaurant(ctx context.Context, ownerID int, req CreateRestaurantRequest) (*RestaurantResponse, error)
	EditRestaurant(ctx context.Context, restaurantID int, ownerID int, req EditRestaurantRequest) (*RestaurantResponse, error)
	GetRestaurantAll(ctx context.Context, page int, limit int, foodType string) ([]*RestaurantResponse, int64, error)
	GetRestaurantByID(ctx context.Context, restaurantID int) (*RestaurantResponse, error)
	GetRestaurantByOwnerID(ctx context.Context, ownerID int) (*RestaurantResponse, error)
	CloseOrOpenRestaurant(ctx context.Context, restaurantID int, isActive bool) error
}

type CreateMenuItemRequest struct {
	Category    string  `json:"category"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ImageURL    string  `json:"image_url"`
}

type MenuItemServicePort interface {
	CreateMenuItem(ctx context.Context, ownerID int, restaurantID int, req CreateMenuItemRequest) (*domain.MenuItem, error)
	EditMenuItem(ctx context.Context, ownerID int, menuItemID int, restaurantID int, req CreateMenuItemRequest) (*domain.MenuItem, error)
	CloseOrOpenMenuItem(ctx context.Context, ownerID int, menuItemID int, restaurantID int, isActive bool) error
	// requesterID = 0 หมายถึงไม่ได้ login, ถ้าเป็นเจ้าของร้านจะเห็นเมนูที่ปิดด้วย
	GetMenuItemAllByID(ctx context.Context, restaurantID int, requesterID int) ([]*domain.MenuItem, error)
}

// ─── Address ──────────────────────────────────────────────────────────
type CreateAddressRequest struct {
	Label   string  `json:"label" validate:"required"`
	Address string  `json:"address" validate:"required"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
	Note    string  `json:"note"`
}

type AddressServicePort interface {
	AddAddress(ctx context.Context, userID int, req CreateAddressRequest) (*domain.Address, error)
	GetAddresses(ctx context.Context, userID int) ([]*domain.Address, error)
	UpdateAddress(ctx context.Context, userID int, addressID int, req CreateAddressRequest) (*domain.Address, error)
	DeleteAddress(ctx context.Context, userID int, addressID int) error
	SetDefault(ctx context.Context, userID int, addressID int) error
}

// ─── Order ──────────────────────────────────────────────────────────
type OrderItemRequest struct {
	MenuItemID int `json:"menu_item_id" validate:"required"`
	Quantity   int `json:"quantity" validate:"required,min=1"`
}

type CreateOrderRequest struct {
	RestaurantID int                `json:"restaurant_id" validate:"required"`
	AddressID    int                `json:"address_id" validate:"required"`
	Items        []OrderItemRequest `json:"items" validate:"required,min=1"`
	Note         string             `json:"note"`
}

type OrderServicePort interface {
	CreateOrder(ctx context.Context, customerID int, req CreateOrderRequest) (*domain.Order, error)
	CreateOrderDirect(ctx context.Context, order *domain.Order) error // บันทึก order ที่สร้างแล้วตรงๆ (ใช้ตอน rider accept pending)
	GetOrderByID(ctx context.Context, orderID int) (*domain.Order, error)
	GetOrderByIDWithAuth(ctx context.Context, orderID int, userID int, role string) (*domain.Order, error)
	GetOrdersByCustomerID(ctx context.Context, customerID int) ([]*domain.Order, error)
	GetOrdersByRestaurantOwnerID(ctx context.Context, ownerID int) ([]*domain.Order, error)
	// Rider actions — Rider ควบคุมสถานะทั้งหมด
	GetOrdersByRiderID(ctx context.Context, riderID int) ([]*domain.Order, error)
	MarkAtRestaurant(ctx context.Context, riderID int, orderID int) error // picking_up → at_restaurant
	MarkDelivering(ctx context.Context, riderID int, orderID int) error   // at_restaurant → delivering (ร้านได้เงิน)
	MarkDelivered(ctx context.Context, riderID int, orderID int) error    // delivering → delivered (rider ได้เงิน)
	// Cancel
	CancelOrder(ctx context.Context, userID int, orderID int) error

	// เมนูขายดีที่สุด by ร้านค้า (Aggregation)
	GetBestSellingItems(ctx context.Context, ownerID int) ([]*domain.BestSellerItem, error)
	GetGlobalBestSellingItems(ctx context.Context, limit int) ([]*domain.BestSellerItem, error)
}

// ─── Review ───────────────────────────────────────────────────────────

type CreateReviewRequest struct {
	OrderID int    `json:"order_id" validate:"required"`
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type UpdateReviewRequest struct {
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type CreateRiderReviewRequest struct {
	OrderID int    `json:"order_id" validate:"required"`
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type ReviewServicePort interface {
	CreateReview(ctx context.Context, customerID int, req CreateReviewRequest) (*domain.Review, error)
	GetReviewsByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Review, error)
	UpdateReview(ctx context.Context, customerID int, reviewID int, req UpdateReviewRequest) (*domain.Review, error)
	DeleteReview(ctx context.Context, customerID int, reviewID int) error

	// Rider Reviews
	CreateRiderReview(ctx context.Context, customerID int, req CreateRiderReviewRequest) (*domain.ReviewRider, error)
	GetRiderReviewsByRiderID(ctx context.Context, riderID int) ([]*domain.ReviewRider, error)
	GetRiderReviewByOrderID(ctx context.Context, orderID int) (*domain.ReviewRider, error)
	GetAllRiderStats(ctx context.Context) ([]*domain.RiderStat, error)
}
