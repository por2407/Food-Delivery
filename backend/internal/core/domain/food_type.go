package domain

// FoodType — ค่ามาตรฐานของประเภทอาหาร (food_type) ที่ใช้ทั้งระบบ
// Key เก็บใน DB, Label แสดงผลที่ Frontend

type FoodType struct {
	Key      string `json:"key"`       // เช่น "Thai", "Japanese"
	Label    string `json:"label"`     // เช่น "อาหารไทย", "อาหารญี่ปุ่น"
	ImageURL string `json:"image_url"` // URL ภาพประกอบสำหรับแสดงในหน้าหมวดหมู่
}

// StandardFoodTypes — รายการ food_type มาตรฐานที่ระบบรองรับ
var StandardFoodTypes = []FoodType{
	{Key: "Thai", Label: "อาหารไทย", ImageURL: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=400"},
	{Key: "Japanese", Label: "อาหารญี่ปุ่น", ImageURL: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400"},
	{Key: "Western", Label: "อาหารตะวันตก", ImageURL: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400"},
	{Key: "Chinese", Label: "อาหารจีน", ImageURL: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400"},
	{Key: "Seafood", Label: "อาหารทะเล", ImageURL: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=400"},
	{Key: "Healthy", Label: "เพื่อสุขภาพ", ImageURL: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400"},
	{Key: "Dessert", Label: "ของหวาน", ImageURL: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400"},
	{Key: "Fine Dining", Label: "ไฟน์ไดนิ่ง", ImageURL: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400"},
}
