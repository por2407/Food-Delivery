import { create } from "zustand";
import type { Restaurant, FoodType } from "../types/restaurant";
import { restaurantService } from "../services/restaurant-service";

interface RestaurantState {
  restaurants: Restaurant[];
  foodTypes: FoodType[];
  loading: boolean;
  error: string | null;
  selectedFoodType: string | null;   // food_type key เช่น "Thai"
  searchTerm: string;
  page: number;
  total: number;
  hasMore: boolean;

  // Actions
  fetchRestaurants: () => Promise<void>;
  fetchMoreRestaurants: () => Promise<void>;
  fetchFoodTypes: () => Promise<void>;
  setSelectedFoodType: (key: string | null) => void;
  setSearchTerm: (term: string) => void;
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  foodTypes: [],
  loading: false,
  error: null,
  selectedFoodType: null,
  searchTerm: "",
  page: 1,
  total: 0,
  hasMore: true,

  fetchRestaurants: async () => {
    set({ loading: true, error: null, page: 1, hasMore: true, restaurants: [] });
    try {
      const { selectedFoodType } = get();
      const response = await restaurantService.getAll(1, 10, selectedFoodType || undefined);
      
      const newItems = response.data || [];
      const totalCount = response.meta?.total || 0;

      set({ 
        restaurants: newItems, 
        total: totalCount,
        hasMore: newItems.length < totalCount,
        loading: false 
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลร้านอาหารได้",
        loading: false,
      });
    }
  },

  fetchMoreRestaurants: async () => {
    const { page, hasMore, loading, restaurants, selectedFoodType } = get();
    if (!hasMore || loading) return;

    set({ loading: true });
    try {
      const nextPage = page + 1;
      const response = await restaurantService.getAll(nextPage, 10, selectedFoodType || undefined);
      
      const newItems = response.data || [];
      const totalCount = response.meta?.total || 0;
      
      set({
        restaurants: [...restaurants, ...newItems],
        page: nextPage,
        hasMore: (restaurants.length + newItems.length) < totalCount,
        loading: false
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลเพิ่มเติมได้",
        loading: false,
      });
    }
  },

  fetchFoodTypes: async () => {
    try {
      const data = await restaurantService.getFoodTypes();
      set({ foodTypes: data });
    } catch (err) {
      console.error("Failed to fetch food types", err);
    }
  },

  setSelectedFoodType: (key) => set({ selectedFoodType: key }),
  setSearchTerm: (term) => set({ searchTerm: term }),
}));
