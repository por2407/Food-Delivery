package service

import (
	"context"
	"errors"
	"fmt"

	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
)

type OrderService struct {
	orderRepo      ports.OrderRepositoryPort
	menuRepo       ports.MenuItemRepositoryPort
	restaurantRepo ports.RestaurantRepositoryPort
	addressRepo    ports.AddressRepositoryPort
}

func NewOrderService(
	orderRepo ports.OrderRepositoryPort,
	menuRepo ports.MenuItemRepositoryPort,
	restaurantRepo ports.RestaurantRepositoryPort,
	addressRepo ports.AddressRepositoryPort,
) *OrderService {
	return &OrderService{
		orderRepo:      orderRepo,
		menuRepo:       menuRepo,
		restaurantRepo: restaurantRepo,
		addressRepo:    addressRepo,
	}
}

// ─── Customer: สร้าง Order ────────────────────────────────────────────
func (s *OrderService) CreateOrder(ctx context.Context, customerID int, req ports.CreateOrderRequest) (*domain.Order, error) {
	// ตรวจร้านอาหาร
	rest, err := s.restaurantRepo.FindRestaurantByID(ctx, req.RestaurantID)
	if err != nil {
		return nil, err
	}
	if rest == nil || !rest.Is_active {
		return nil, errors.New("restaurant not found or closed")
	}

	// ตรวจที่อยู่ว่าเป็นของ customer
	addr, err := s.addressRepo.FindByID(ctx, req.AddressID)
	if err != nil {
		return nil, err
	}
	if addr == nil || addr.UserID != customerID {
		return nil, errors.New("address not found")
	}

	// สร้าง order items + คำนวณราคา
	var items []domain.OrderItem
	var totalAmount float64
	for _, item := range req.Items {
		menuItem, err := s.menuRepo.FindMenuItemByID(ctx, item.MenuItemID, req.RestaurantID)
		if err != nil {
			return nil, err
		}
		if menuItem == nil || !menuItem.Is_available {
			return nil, fmt.Errorf("menu item %d not available", item.MenuItemID)
		}
		sub := menuItem.Price * float64(item.Quantity)
		items = append(items, domain.OrderItem{
			MenuItemID: item.MenuItemID,
			Name:       menuItem.Name,
			Price:      menuItem.Price,
			Quantity:   item.Quantity,
			SubTotal:   sub,
		})
		totalAmount += sub
	}

	order := &domain.Order{
		CustomerID:   customerID,
		RestaurantID: req.RestaurantID,
		AddressID:    req.AddressID,
		Status:       domain.OrderStatusPending,
		TotalAmount:  totalAmount,
		DeliveryFee:  20, // ค่าส่งเริ่มต้น (ทำ dynamic ทีหลัง)
		Note:         req.Note,
		Items:        items,
	}

	if err := s.orderRepo.CreateOrder(ctx, order); err != nil {
		return nil, err
	}

	// reload with preloads
	return s.orderRepo.FindOrderByID(ctx, order.ID)
}

func (s *OrderService) GetOrdersByCustomerID(ctx context.Context, customerID int) ([]*domain.Order, error) {
	return s.orderRepo.FindOrdersByCustomerID(ctx, customerID)
}

func (s *OrderService) GetOrderByID(ctx context.Context, orderID int) (*domain.Order, error) {
	return s.orderRepo.FindOrderByID(ctx, orderID)
}

// GetOrderByIDWithAuth — ตรวจสิทธิ์: customer เห็นของตัวเอง, rest เห็นของร้าน, rider เห็นที่รับ, admin เห็นหมด
func (s *OrderService) GetOrderByIDWithAuth(ctx context.Context, orderID int, userID int, role string) (*domain.Order, error) {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, errors.New("order not found")
	}

	switch role {
	case "admin":
		return order, nil
	case "user":
		if order.CustomerID != userID {
			return nil, errors.New("forbidden: not your order")
		}
	case "rest":
		rest, err := s.restaurantRepo.FindRestaurantByOwnerID(ctx, userID)
		if err != nil {
			return nil, err
		}
		if rest == nil || rest.ID != order.RestaurantID {
			return nil, errors.New("forbidden: not your restaurant's order")
		}
	case "rider":
		if order.RiderID == nil || *order.RiderID != userID {
			return nil, errors.New("forbidden: not your delivery")
		}
	default:
		return nil, errors.New("forbidden")
	}

	return order, nil
}

func (s *OrderService) GetOrdersByRiderID(ctx context.Context, riderID int) ([]*domain.Order, error) {
	return s.orderRepo.FindOrdersByRiderID(ctx, riderID)
}

func (s *OrderService) GetOrdersByRestaurantOwnerID(ctx context.Context, ownerID int) ([]*domain.Order, error) {
	rest, err := s.restaurantRepo.FindRestaurantByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	if rest == nil {
		return nil, errors.New("restaurant not found")
	}
	return s.orderRepo.FindOrdersByRestaurantID(ctx, rest.ID)
}

// ─── Restaurant actions ──────────────────────────────────────────────
func (s *OrderService) updateOrderByOwner(ctx context.Context, ownerID int, orderID int, fromStatus, toStatus string) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}
	// ตรวจว่าเป็นเจ้าของร้าน
	rest, err := s.restaurantRepo.FindRestaurantByID(ctx, order.RestaurantID)
	if err != nil {
		return err
	}
	if rest == nil || rest.OwnerID != ownerID {
		return errors.New("forbidden: not your restaurant")
	}
	if order.Status != fromStatus {
		return fmt.Errorf("order status must be '%s' (current: '%s')", fromStatus, order.Status)
	}
	return s.orderRepo.UpdateOrderStatus(ctx, orderID, toStatus)
}

func (s *OrderService) AcceptOrder(ctx context.Context, ownerID int, orderID int) error {
	return s.updateOrderByOwner(ctx, ownerID, orderID, domain.OrderStatusPending, domain.OrderStatusAccepted)
}

func (s *OrderService) RejectOrder(ctx context.Context, ownerID int, orderID int) error {
	return s.updateOrderByOwner(ctx, ownerID, orderID, domain.OrderStatusPending, domain.OrderStatusCancelled)
}

func (s *OrderService) PrepareOrder(ctx context.Context, ownerID int, orderID int) error {
	return s.updateOrderByOwner(ctx, ownerID, orderID, domain.OrderStatusAccepted, domain.OrderStatusPreparing)
}

func (s *OrderService) ReadyOrder(ctx context.Context, ownerID int, orderID int) error {
	return s.updateOrderByOwner(ctx, ownerID, orderID, domain.OrderStatusPreparing, domain.OrderStatusReady)
}

// ─── Rider actions ───────────────────────────────────────────────────
func (s *OrderService) GetReadyOrders(ctx context.Context) ([]*domain.Order, error) {
	return s.orderRepo.FindOrdersByStatus(ctx, domain.OrderStatusReady)
}

func (s *OrderService) PickUpOrder(ctx context.Context, riderID int, orderID int) error {
	return s.orderRepo.AssignRider(ctx, orderID, riderID)
}

func (s *OrderService) DeliverOrder(ctx context.Context, riderID int, orderID int) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}
	if order.RiderID == nil || *order.RiderID != riderID {
		return errors.New("forbidden: not your order")
	}
	if order.Status != domain.OrderStatusPickedUp {
		return fmt.Errorf("order status must be '%s' (current: '%s')", domain.OrderStatusPickedUp, order.Status)
	}
	return s.orderRepo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusDelivered)
}

// ─── Cancel ──────────────────────────────────────────────────────────
func (s *OrderService) CancelOrder(ctx context.Context, userID int, orderID int) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}
	if order.CustomerID != userID {
		return errors.New("forbidden: not your order")
	}
	if order.Status != domain.OrderStatusPending {
		return errors.New("can only cancel pending orders")
	}
	return s.orderRepo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusCancelled)
}
