package service

import (
	"context"
	"errors"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type AddressService struct {
	addressRepo ports.AddressRepositoryPort
}

func NewAddressService(addressRepo ports.AddressRepositoryPort) *AddressService {
	return &AddressService{addressRepo: addressRepo}
}

func (s *AddressService) AddAddress(ctx context.Context, userID int, req ports.CreateAddressRequest) (*domain.Address, error) {
	addr := &domain.Address{
		UserID:  userID,
		Label:   req.Label,
		Address: req.Address,
		Lat:     req.Lat,
		Lng:     req.Lng,
		Note:    req.Note,
	}

	// ถ้ายังไม่มีที่อยู่เลย → ตั้งเป็น default อัตโนมัติ
	existing, _ := s.addressRepo.FindAllByUserID(ctx, userID)
	if len(existing) == 0 {
		addr.IsDefault = true
	}

	if err := s.addressRepo.Create(ctx, addr); err != nil {
		return nil, err
	}
	return addr, nil
}

func (s *AddressService) GetAddresses(ctx context.Context, userID int) ([]*domain.Address, error) {
	return s.addressRepo.FindAllByUserID(ctx, userID)
}

func (s *AddressService) UpdateAddress(ctx context.Context, userID int, addressID int, req ports.CreateAddressRequest) (*domain.Address, error) {
	addr, err := s.addressRepo.FindByID(ctx, addressID)
	if err != nil {
		return nil, err
	}
	if addr == nil || addr.UserID != userID {
		return nil, errors.New("address not found")
	}

	addr.Label = req.Label
	addr.Address = req.Address
	addr.Lat = req.Lat
	addr.Lng = req.Lng
	addr.Note = req.Note

	if err := s.addressRepo.Update(ctx, addr); err != nil {
		return nil, err
	}
	return addr, nil
}

func (s *AddressService) DeleteAddress(ctx context.Context, userID int, addressID int) error {
	return s.addressRepo.Delete(ctx, addressID, userID)
}

func (s *AddressService) SetDefault(ctx context.Context, userID int, addressID int) error {
	addr, err := s.addressRepo.FindByID(ctx, addressID)
	if err != nil {
		return err
	}
	if addr == nil || addr.UserID != userID {
		return errors.New("address not found")
	}
	// ลบ default เก่า
	if err := s.addressRepo.ClearDefault(ctx, userID); err != nil {
		return err
	}
	addr.IsDefault = true
	return s.addressRepo.Update(ctx, addr)
}
