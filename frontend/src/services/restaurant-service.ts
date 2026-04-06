import { api } from "../lib/api";
import type { Restaurant, FoodType, MenuItem } from "../types/restaurant";

export const restaurantService = {
  /** ดึงร้านอาหารทั้งหมด พร้อมรองรับการแบ่งหน้าและการกรอง */
  async getAll(
    page = 1,
    limit = 10,
    foodType?: string,
  ): Promise<{
    data: Restaurant[];
    meta: { total: number; page: number; limit: number };
  }> {
    const response = await api.get<{
      data: Restaurant[];
      meta?: { total: number; page: number; limit: number };
    }>("/restaurants", {
      params: { page, limit, food_type: foodType },
    });

    // ป้องกันกรณี Backend ไม่ส่ง meta กลับมา
    return {
      data: response.data.data || [],
      meta: response.data.meta || { total: 0, page: 1, limit: 10 },
    };
  },

  /** ดึงร้านอาหารตาม ID */
  async getById(id: number): Promise<Restaurant> {
    const response = await api.get<{ data: Restaurant }>(`/restaurants/${id}`);
    return response.data.data;
  },

  /** ดึงเมนูอาหารของร้าน */
  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    const response = await api.get<{ data: MenuItem[] }>(
      `/menu/${restaurantId}`,
    );
    return response.data?.data || [];
  },

  /** ดึงรายการ food_type มาตรฐานจาก Backend */
  async getFoodTypes(): Promise<FoodType[]> {
    const response = await api.get<{ data: FoodType[] }>("/food-types");
    return response.data?.data || [];
  },

  /** ดึงข้อมูลร้านอาหารของตัวเอง (role: rest) */
  async getMyRestaurant(): Promise<{ data: Restaurant | null; has_restaurant: boolean }> {
    const response = await api.get<{ data: Restaurant | null; has_restaurant: boolean }>("/restaurants/my");
    return response.data;
  },

  /** สร้างร้านอาหารใหม่ (role: rest) */
  async createRestaurant(data: {
    name: string;
    description?: string;
    address: string;
    food_type?: string;
    image_url?: string;
    lat?: number;
    lng?: number;
  }): Promise<Restaurant> {
    const response = await api.post<{ data: Restaurant; message: string }>("/restaurants", data);
    return response.data.data;
  },

  /** แก้ไขข้อมูลร้านอาหาร (role: rest) */
  async editRestaurant(id: number, data: {
    name: string;
    description?: string;
    address: string;
    food_type?: string;
    image_url?: string;
    lat?: number;
    lng?: number;
  }): Promise<Restaurant> {
    const response = await api.put<{ data: Restaurant; message: string }>(`/restaurants/${id}`, data);
    return response.data.data;
  },

  /** เปิดหรือปิดสถานะร้านอาหาร (isActive: true = เปิด, false = ปิด) */
  async toggleActive(id: number, isActive: boolean): Promise<void> {
    await api.patch(`/restaurants/close/${id}`, { is_active: isActive });
  },
};
