// ── Restaurant ─────────────────────────────────────────────────────
// ตรงกับ RestaurantResponse ใน Backend (ports/service_port.go)
export interface Restaurant {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  image_url: string;
  food_type: string; // Key: "Thai", "Japanese", "Western" ฯลฯ
  Open_time: string;
  close_time: string;
  is_active: boolean;
  created_at: string;
  rating?: number;
}

// ── FoodType ──────────────────────────────────────────────────────
// ตรงกับ domain.FoodType ใน Backend
export interface FoodType {
  key: string; // "Thai", "Japanese" ฯลฯ — เก็บใน DB
  label: string; // "อาหารไทย" — แสดงผลบนหน้าจอ
  image_url: string; // URL รูปภาพสำหรับหน้าหมวดหมู่
}
