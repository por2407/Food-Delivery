import { api } from "../lib/api";
import type { Restaurant, FoodType } from "../types/restaurant";

export const restaurantService = {
  /** ดึงร้านอาหารทั้งหมด พร้อมรองรับการแบ่งหน้าและการกรอง */
  async getAll(page = 1, limit = 10, foodType?: string): Promise<{ data: Restaurant[], meta: { total: number, page: number, limit: number } }> {
    const response = await api.get<{ 
      data: Restaurant[], 
      meta?: { total: number, page: number, limit: number } 
    }>("/restaurants", {
      params: { page, limit, food_type: foodType }
    });

    // ป้องกันกรณี Backend ไม่ส่ง meta กลับมา
    return {
      data: response.data.data || [],
      meta: response.data.meta || { total: 0, page: 1, limit: 10 }
    };
  },

  /** ดึงร้านอาหารตาม ID */
  async getById(id: number): Promise<Restaurant> {
    const response = await api.get<{ data: Restaurant }>(`/restaurants/${id}`);
    return response.data.data;
  },

  /** ดึงรายการ food_type มาตรฐานจาก Backend */
  async getFoodTypes(): Promise<FoodType[]> {
    const response = await api.get<{ data: FoodType[] }>("/food-types");
    return response.data?.data || [];
  },
};
