package ports

import (
	"context"
	"food_delivery/internal/core/domain"
)

type AuthRepository interface {
	FindUserByEmail(ctx context.Context, email string) (*domain.User, error)
	FindUserByID(ctx context.Context, id int) (*domain.User, error)
	RegisterUser(ctx context.Context, user *domain.User) error
	EditProfileByID(ctx context.Context, user *domain.User) error
	UpdatePasswordByID(ctx context.Context, userID int, hashedPassword string) error
	FindProfileByID(ctx context.Context, userID int) (*domain.User, error)
}

type RestaurantRepository interface {
	CreateRestaurant(ctx context.Context, restaurant *domain.Restaurant) error
	FindRestaurantByID(ctx context.Context, id int) (*domain.Restaurant, error)
	FindRestaurantByOwnerID(ctx context.Context, ownerID int) (*domain.Restaurant, error)
	EditRestaurant(ctx context.Context, restaurant *domain.Restaurant) error
	FindAllRestaurants(ctx context.Context) ([]*domain.Restaurant, error)
	UpdateCloseOrOpenStatus(ctx context.Context, restaurantID int, isActive bool) error
}

type MenuItemRepository interface {
	CreateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error
}
