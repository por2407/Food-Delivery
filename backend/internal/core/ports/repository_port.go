package ports

import (
	"context"
	"food_delivery/internal/core/domain"
)

type AuthRepositoryPort interface {
	FindUserByEmail(ctx context.Context, email string) (*domain.User, error)
	FindUserByID(ctx context.Context, id int) (*domain.User, error)
	RegisterUser(ctx context.Context, user *domain.User) error
	EditProfileByID(ctx context.Context, user *domain.User) error
	UpdatePasswordByID(ctx context.Context, userID int, hashedPassword string) error
	FindProfileByID(ctx context.Context, userID int) (*domain.User, error)
}

type RestaurantRepositoryPort interface {
	CreateRestaurant(ctx context.Context, restaurant *domain.Restaurant) error
	FindRestaurantByID(ctx context.Context, id int) (*domain.Restaurant, error)
	FindRestaurantByOwnerID(ctx context.Context, ownerID int) (*domain.Restaurant, error)
	EditRestaurant(ctx context.Context, restaurant *domain.Restaurant) error
	FindAllRestaurants(ctx context.Context) ([]*domain.Restaurant, error)
	UpdateCloseOrOpenStatus(ctx context.Context, restaurantID int, isActive bool) error
}

type MenuItemRepositoryPort interface {
	CreateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error
	FindMenuItemByID(ctx context.Context, menuItemID int, restaurantID int) (*domain.MenuItem, error)
	UpdateMenuItem(ctx context.Context, menuItem *domain.MenuItem) error
	UpdateMenuOpenOrCloseStatus(ctx context.Context, menuItemID int, restaurantID int, isActive bool) error
	FindMenuItemsByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.MenuItem, error)
	FindMenuItemsByRestaurantIDAvailable(ctx context.Context, restaurantID int) ([]*domain.MenuItem, error)
}
