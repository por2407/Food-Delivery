import { api } from "../lib/api";

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  menu_item?: {
    name: string;
    image_url: string;
  };
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
  restaurant?: {
    name: string;
    image_url: string;
  };
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
    return response.data.data;
  },

  async getOrderById(id: number): Promise<Order> {
    const response = await api.get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  async cancelOrder(id: number): Promise<void> {
    await api.delete(`/orders/${id}`);
  }
};
