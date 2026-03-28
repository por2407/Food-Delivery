package ports

import (
	"context"
	"food_delivery/internal/core/domain"

	"gorm.io/gorm"
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
	FindAllRestaurants(ctx context.Context, page int, limit int, foodType string) ([]*domain.Restaurant, int64, error)
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

type AddressRepositoryPort interface {
	Create(ctx context.Context, addr *domain.Address) error
	FindByID(ctx context.Context, id int) (*domain.Address, error)
	FindAllByUserID(ctx context.Context, userID int) ([]*domain.Address, error)
	Update(ctx context.Context, addr *domain.Address) error
	Delete(ctx context.Context, id int, userID int) error
	ClearDefault(ctx context.Context, userID int) error // ลบ is_default ทุกแถวของ user
}

type OrderRepositoryPort interface {
	CreateOrder(ctx context.Context, order *domain.Order) error
	FindOrderByID(ctx context.Context, id int) (*domain.Order, error)
	FindOrdersByCustomerID(ctx context.Context, customerID int) ([]*domain.Order, error)
	FindOrdersByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Order, error)
	FindOrdersByRiderID(ctx context.Context, riderID int) ([]*domain.Order, error)
	FindOrdersByStatus(ctx context.Context, status string) ([]*domain.Order, error)
	UpdateOrderStatus(ctx context.Context, orderID int, status string) error
	// AssignRider ใช้ transaction ป้องกัน 2 rider กดพร้อมกัน
	AssignRider(ctx context.Context, orderID int, riderID int) error
	DB() *gorm.DB
}

type ReviewRepositoryPort interface {
	Create(ctx context.Context, review *domain.Review) error
	FindByID(ctx context.Context, id int) (*domain.Review, error)
	FindByOrderID(ctx context.Context, orderID int) (*domain.Review, error)
	FindByRestaurantID(ctx context.Context, restaurantID int) ([]*domain.Review, error)
	Update(ctx context.Context, review *domain.Review) error
	Delete(ctx context.Context, id int, customerID int) error
}
