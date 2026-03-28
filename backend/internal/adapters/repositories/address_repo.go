package repositories

import (
	"context"
	"errors"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"

	"gorm.io/gorm"
)

type AddressRepository struct {
	db *gorm.DB
}

func NewAddressRepository(db *gorm.DB) ports.AddressRepositoryPort {
	return &AddressRepository{db: db}
}

func (r *AddressRepository) Create(ctx context.Context, addr *domain.Address) error {
	return r.db.WithContext(ctx).Create(addr).Error
}

func (r *AddressRepository) FindByID(ctx context.Context, id int) (*domain.Address, error) {
	var addr domain.Address
	if err := r.db.WithContext(ctx).First(&addr, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &addr, nil
}

func (r *AddressRepository) FindAllByUserID(ctx context.Context, userID int) ([]*domain.Address, error) {
	var addrs []*domain.Address
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("is_default DESC, id ASC").Find(&addrs).Error; err != nil {
		return nil, err
	}
	return addrs, nil
}

func (r *AddressRepository) Update(ctx context.Context, addr *domain.Address) error {
	return r.db.WithContext(ctx).Save(addr).Error
}

func (r *AddressRepository) Delete(ctx context.Context, id int, userID int) error {
	result := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&domain.Address{})
	if result.RowsAffected == 0 {
		return errors.New("address not found")
	}
	return result.Error
}

func (r *AddressRepository) ClearDefault(ctx context.Context, userID int) error {
	return r.db.WithContext(ctx).Model(&domain.Address{}).Where("user_id = ?", userID).Update("is_default", false).Error
}
