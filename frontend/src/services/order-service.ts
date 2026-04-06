import { api } from "../lib/api";

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  price: number;
  sub_total: number;
}

export interface Order {
  id: number;
  customer_id: number;
  restaurant_id: number;
  rider_id?: number;
  address_id: number;
  status: string;
  total_amount: number;
  delivery_fee: number;
  note: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  address?: {
    id: number;
    label: string;
    address: string;
    lat: number;
    lng: number;
    note: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  review?: any;
  review_rider?: any;
}

export interface BestSellerItem {
  menu_item_id: number;
  name: string;
  image_url: string;
  sales: number;
  restaurant_id: number;
  restaurant_image_url: string;
}

export interface PendingOrderItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  sub_total: number;
  image_url: string;
}

export interface PendingOrder {
  id: string;
  customer_id: number;
  restaurant_id: number;
  restaurant_name: string;
  address_id: number;
  address_label: string;
  items: PendingOrderItem[];
  total_amount: number;
  delivery_fee: number;
  note: string;
  created_at: string;
}

export interface CreateOrderRequest {
  restaurant_id: number;
  address_id: number;
  items: {
    menu_item_id: number;
    quantity: number;
  }[];
  note: string;
}

export const orderService = {
  // ─── Original order CRUD ────────────────────────────────────────
  async createOrder(req: CreateOrderRequest): Promise<Order> {
    const response = await api.post<{ data: Order }>("/orders", req);
    return response.data.data;
  },

  async getRestaurantOrders(): Promise<Order[]> {
    const response = await api.get<{ data: Order[] }>(`/orders/restaurant`);
    return response.data.data || [];
  },

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<{ data: Order[] }>("/orders/my");
    return response.data.data || [];
  },

  async getOrderById(id: number): Promise<Order> {
    const response = await api.get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  async cancelOrder(id: number): Promise<void> {
    await api.patch(`/orders/cancel/${id}`);
  },

  // ─── Pending orders (real-time, in-memory) ──────────────────────
  async createPendingOrder(req: CreateOrderRequest): Promise<PendingOrder> {
    const response = await api.post<{ data: PendingOrder }>("/orders/pending", req);
    return response.data.data;
  },

  async cancelPendingOrder(pendingId: string): Promise<void> {
    await api.delete(`/orders/pending/${pendingId}`);
  },

  async getMyPendingOrders(): Promise<PendingOrder[]> {
    const response = await api.get<{ data: PendingOrder[] }>("/orders/pending/my");
    return response.data.data || [];
  },

  // ─── Rider endpoints ───────────────────────────────────────────
  async getRiderOrders(): Promise<Order[]> {
    const response = await api.get<{ data: Order[] }>("/orders/rider/my");
    return response.data.data || [];
  },

  async getAllPendingOrders(): Promise<PendingOrder[]> {
    const response = await api.get<{ data: PendingOrder[] }>("/orders/pending/all");
    return response.data.data || [];
  },

  async acceptPendingOrder(pendingId: string): Promise<Order> {
    const response = await api.post<{ data: Order }>(`/orders/pending/${pendingId}/accept`);
    return response.data.data;
  },

  // ─── Rider: เปลี่ยนสถานะ ─────────────────────────────────────────
  async markAtRestaurant(orderId: number): Promise<void> {
    await api.patch(`/orders/at-restaurant/${orderId}`);
  },

  async markDelivering(orderId: number): Promise<void> {
    await api.patch(`/orders/delivering/${orderId}`);
  },

  async markDelivered(orderId: number): Promise<void> {
    await api.patch(`/orders/delivered/${orderId}`);
  },

  async getBestSellingItems(): Promise<BestSellerItem[]> {
    const response = await api.get<{ data: BestSellerItem[] }>("/orders/sell-best");
    return response.data.data || [];
  },
  
  async getGlobalBestSellingItems(limit: number = 1): Promise<BestSellerItem[]> {
    const response = await api.get<{ data: BestSellerItem[] }>(`/orders/global/sell-best?limit=${limit}`);
    return response.data.data || [];
  },
};
