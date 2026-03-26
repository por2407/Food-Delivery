package ports

import (
	"context"
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

type AuthServic interface {
	Register(ctx context.Context, req RegisterRequest) (*RegisterRequest, error)
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	EditProfileByID(ctx context.Context, userID int, req EditProfileRequest) (*InfoResponse, error)
	ChangePassword(ctx context.Context, userID int, req ChangePasswordRequest) error
	ResetPassword(ctx context.Context, req ResetPasswordRequest) error
	GetProfile(ctx context.Context, userID int) (*InfoResponse, error)
}

type CreateRestaurantRequest struct {
	Name        string    `json:"name" validate:"required"`
	Description string    `json:"description"`
	Address     string    `json:"address" validate:"required"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	ImageUrl    string    `json:"image_url"`
	FoodType    string    `json:"food_type"`
	OpenTime    time.Time `json:"open_time"`
	CloseTime   time.Time `json:"close_time"`
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
	OpenTime    time.Time `json:"open_time"`
	CloseTime   time.Time `json:"close_time"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

type EditRestaurantRequest struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Address     string    `json:"address"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	ImageUrl    string    `json:"image_url"`
	FoodType    string    `json:"food_type"`
	OpenTime    time.Time `json:"open_time"`
	CloseTime   time.Time `json:"close_time"`
	IsActive    bool      `json:"is_active"`
}

type RestaurantService interface {
	AddRestaurant(ctx context.Context, ownerID int, req CreateRestaurantRequest) (*RestaurantResponse, error)
	EditRestaurant(ctx context.Context, restaurantID int, ownerID int, req EditRestaurantRequest) (*RestaurantResponse, error)
	GetRestaurantAll(ctx context.Context) ([]*RestaurantResponse, error)
	CloseOrOpenRestaurant(ctx context.Context, restaurantID int, isActive bool) error
}

type CreateMenuItemRequest struct {
	Category     string  `json:"category"`
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	Price        float64 `json:"price"`
	ImageURL     string  `json:"image_url"`
	Stock        int     `json:"stock"`
}


type MenuItemService interface {
	AddMenuItem(ctx context.Context, restaurantID int, req CreateMenuItemRequest) (*domain.MenuItem, error)
}
