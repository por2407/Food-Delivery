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
}
