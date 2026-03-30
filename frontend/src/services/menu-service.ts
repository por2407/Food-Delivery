import { api } from "../lib/api";
import type { MenuItem } from "../types/restaurant";

export const menuService = {
  /** ดึงรายการอาหารทั้งหมดของร้านอาหาร */
  async getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItem[]> {
    const response = await api.get<{ data: MenuItem[] }>(`/menu/${restaurantId}`);
    return response.data.data || [];
  },

  /** เพิ่มเมนูใหม่ (role: rest) */
  async createMenuItem(
    restaurantId: number,
    data: {
      name: string;
      category?: string;
      description?: string;
      price: number;
      image_url?: string;
    },
  ): Promise<MenuItem> {
    const response = await api.post<{ data: MenuItem }>(`/menu/${restaurantId}`, data);
    return response.data.data;
  },

  /** เปลี่ยนสถานะเปิด-ปิดเมนู (isAvailable: true = พร้อมขาย, false = หมดชั่วคราว) */
  async toggleAvailable(restaurantId: number, menuId: number, isAvailable: boolean): Promise<void> {
    await api.patch(`/menu/close/${restaurantId}/${menuId}`, { is_available: isAvailable });
  },

  /** ลบเมนูอาหารออกจากร้าน */
  async deleteMenuItem(restaurantId: number, menuId: number): Promise<void> {
    await api.delete(`/menu/${restaurantId}/${menuId}`);
  },
};
