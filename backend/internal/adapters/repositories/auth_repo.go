package repositories

import (
	"context"
	"errors"
	"food_delivery/internal/core/domain"

	"gorm.io/gorm"
)

type AuthRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		// ไม่เจอ record → ไม่ใช่ error จริง ๆ คืน nil, nil
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) FindUserByID(ctx context.Context, id int) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) RegisterUser(ctx context.Context, user *domain.User) error {
	// Repository ทำหน้าที่แค่ persist ข้อมูลที่รับมา ไม่มี business logic
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return err
	}
	return nil
}

func (r *AuthRepository) UpdatePasswordByID(ctx context.Context, userID int, hashedPassword string) error {
	result := r.db.WithContext(ctx).Model(&domain.User{}).Where("id = ?", userID).Update("password", hashedPassword)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *AuthRepository) EditProfileByID(ctx context.Context, user *domain.User) error {
	result := r.db.WithContext(ctx).Model(&domain.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"name":   user.Name,
		"phone":  user.Phone,
		"avatar": user.Avatar,
	})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *AuthRepository) FindProfileByID(ctx context.Context, userID int) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}
