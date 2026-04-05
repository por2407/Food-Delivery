import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/useAuthStore";
import Modal from "../components/Modal";
import MapPicker from "../components/MapPicker";
import { orderService, type Order } from "../services/order-service";
import { restaurantService } from "../services/restaurant-service";
import { menuService } from "../services/menu-service";
import type { Restaurant, FoodType, MenuItem } from "../types/restaurant";

export default function RestaurantAdminPage() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<"no_store" | "banned" | null>(null);

  // ─── Modal states ───────────────────────────────────────────────
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [isEditRestaurant, setIsEditRestaurant] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<number | null>(null);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "", description: "", address: "", food_type: "", image_url: "",
    lat: 13.7563, lng: 100.5018,
  });
  const [menuForm, setMenuForm] = useState({
    name: "", category: "", description: "", price: "", image_url: "",
  });

  useEffect(() => {
    if (initialized) {
      if (!user) navigate("/login");
      else if (user.role !== 'rest' && user.role !== 'admin') navigate("/");
    }
  }, [user, initialized, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await restaurantService.getMyRestaurant();

      if (!res.has_restaurant) {
        setErrorStatus("no_store");
        setLoading(false);
        return;
      }

      setRestaurant(res.data);

      const [mItems, rOrders] = await Promise.all([
        menuService.getMenuItemsByRestaurant(res.data.id),
        orderService.getRestaurantOrders()
      ]);
       
      setMenuItems(mItems);
      setOrders(rOrders);
      setErrorStatus(null);
    } catch (err: any) {
      console.error("Failed to fetch restaurant data", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (initialized && user?.id) {
       fetchData();
       const intv = setInterval(fetchData, 30000);
       return () => clearInterval(intv);
    }
  }, [initialized, user?.id, fetchData]);

  const handleOpenRestaurantModal = async (isEdit = false) => {
    setIsEditRestaurant(isEdit);
    if (isEdit && restaurant) {
      setRestaurantForm({
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        food_type: restaurant.food_type,
        image_url: restaurant.image_url,
        lat: Number(restaurant.lat) || 13.7563,
        lng: Number(restaurant.lng) || 100.5018,
      });
    } else {
      setRestaurantForm({ name: "", description: "", address: "", food_type: "", image_url: "", lat: 13.7563, lng: 100.5018 });
    }
    setShowRestaurantModal(true);
    if (foodTypes.length === 0) {
      const types = await restaurantService.getFoodTypes();
      setFoodTypes(types);
    }
  };

  const handleOpenMenuModal = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItemId(item.id);
      setMenuForm({
        name: item.name,
        category: item.category || "",
        description: item.description || "",
        price: String(item.price || ""),
        image_url: item.image_url || "",
      });
    } else {
      setEditingMenuItemId(null);
      setMenuForm({ name: "", category: "", description: "", price: "", image_url: "" });
    }
    setShowMenuModal(true);
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const savePayload = {
      name: restaurantForm.name,
      description: restaurantForm.description,
      address: restaurantForm.address,
      food_type: restaurantForm.food_type,
      image_url: restaurantForm.image_url,
      lat: parseFloat(restaurantForm.lat.toString()),
      lng: parseFloat(restaurantForm.lng.toString()),
    };
    try {
      if (isEditRestaurant && restaurant) {
        await restaurantService.editRestaurant(restaurant.id, savePayload);
      } else {
        await restaurantService.createRestaurant(savePayload);
      }
      setShowRestaurantModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setSubmitting(true);
    const payload = {
      name: menuForm.name,
      category: menuForm.category,
      description: menuForm.description,
      price: parseFloat(menuForm.price),
      image_url: menuForm.image_url,
    };

    try {
      if (!editingMenuItemId) {
        await menuService.createMenuItem(restaurant.id, payload);
      } else {
        await menuService.editMenuItem(restaurant.id, editingMenuItemId, payload);
      }
      setShowMenuModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!restaurant) return;
    try {
      const newStatus = !restaurant.is_active;
      await restaurantService.toggleActive(restaurant.id, newStatus);
      setRestaurant({ ...restaurant, is_active: newStatus });
    } catch (err: any) {
      alert("ไม่สามารถเปลี่ยนสถานะร้านได้");
      await fetchData();
    }
  };

  const handleToggleMenuAvailable = async (menuId: number, currentStatus: boolean) => {
    if (!restaurant) return;
    try {
      const newStatus = !currentStatus;
      await menuService.toggleAvailable(restaurant.id, menuId, newStatus);
      setMenuItems(prev => prev.map(item => item.id === menuId ? { ...item, is_available: newStatus } : item));
    } catch (err: any) {
      alert("ไม่สามารถเปลี่ยนสถานะเมนูได้");
    }
  };

  const handleDeleteMenuItem = async (menuId: number) => {
    if (!restaurant) return;
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?")) return;
    try {
      await menuService.deleteMenuItem(restaurant.id, menuId);
      setMenuItems(prev => prev.filter(item => item.id !== menuId));
    } catch (err: any) {
      alert("ไม่สามารถลบเมนูได้");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (errorStatus === "no_store") {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6 pb-20">
          <TopNavBar />
          <div className="relative mb-12 animate-fade-in-up">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <span className="material-symbols-outlined text-[10rem] text-primary font-thin relative">storefront</span>
          </div>
          <h1 className="text-5xl font-black font-headline italic mb-4">ยินดีต้อนรับสู่ครอบครัวเรา</h1>
          <p className="text-on-surface-variant max-w-sm mb-12 font-medium">เริ่มต้นสร้างรายได้ง่ายๆ ด้วยการเปิดร้านของคุณวันนี้</p>
          <button onClick={() => handleOpenRestaurantModal(false)} className="btn-primary px-12 py-5 rounded-3xl font-black italic shadow-2xl shadow-primary/20 text-xl active:scale-95 transition-all">
            ลงทะเบียนร้านอาหารเลย
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <TopNavBar />
        <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary font-headline">Restaurant Manager</p>
              </div>
              <h1 className="text-5xl font-black font-headline italic tracking-tight">{restaurant?.name}</h1>
              <p className="text-on-surface-variant font-medium mt-2">ดูแลออเดอร์และเมนูอาหารของคุณได้ที่นี่</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleOpenRestaurantModal(true)} className="bg-surface-container-high px-8 py-4 rounded-2xl font-black italic hover:bg-on-surface hover:text-surface transition-all">แก้ไขข้อมูลร้าน</button>
              <button onClick={handleOpenMenuModal} className="btn-primary px-8 py-4 rounded-2xl font-black italic shadow-xl">เพิ่มเมนูใหม่</button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Stats */}
            <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "ออเดอร์วันนี้", val: orders.length, icon: "receipt_long", color: "bg-blue-50 text-blue-600" },
                { label: "ยอดขายรวม", val: `฿${orders.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString()}`, icon: "payments", color: "bg-emerald-50 text-emerald-600" },
                { label: "เรตติ้ง", val: restaurant?.rating || "4.8", icon: "star", color: "bg-rose-50 text-rose-600" },
                { label: "สถานะร้าน", val: restaurant?.is_active ? 'เปิดอยู่' : 'ปิดอยู่', icon: "sensors", color: restaurant?.is_active ? "bg-emerald-50 text-emerald-600" : "bg-outline-variant/10 text-outline-variant" },
              ].map((s, i) => (
                <div key={i} className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10 flex items-center gap-6 shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.color}`}>
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
                    <p className="text-2xl font-black">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="xl:col-span-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/5 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in-up" style={{ animationDelay: "0.1s", maxHeight: "800px" }}>
              <div className="p-8 border-b border-outline-variant/5 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black italic font-headline">ออเดอร์ล่าสุด</h3>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{orders.length} รายการ</span>
              </div>
              <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-grow">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-surface-container-lowest shadow-sm">
                    <tr className="bg-on-surface/2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      <th className="px-8 py-5">Order ID</th>
                      <th className="px-8 py-5">ยอดรวม</th>
                      <th className="px-8 py-5">สถานะ</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-8 py-6 font-black text-sm">#{order.id}</td>
                        <td className="px-8 py-6 font-black text-sm">฿{order.total_amount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                           <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">{order.status}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={4} className="px-8 py-20 text-center opacity-30 font-black italic">ยังไม่มีออเดอร์</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Menu Items Management */}
            <div className="xl:col-span-5 space-y-8">
              <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-sm uppercase tracking-widest">จัดการเมนูอาหาร ({menuItems.length})</h4>
                  <button onClick={handleOpenMenuModal} className="text-primary font-black text-xs uppercase tracking-widest hover:underline">+ เพิ่ม</button>
                </div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-surface p-4 rounded-3xl border border-outline-variant/5">
                      <div className="flex items-center gap-4">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"} className={`w-12 h-12 rounded-2xl object-cover ${!item.is_available ? 'grayscale opacity-50' : ''}`} />
                        <div>
                          <p className="text-xs font-black line-clamp-1">{item.name}</p>
                          <p className="text-[10px] font-black text-primary">฿{item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleMenuAvailable(item.id, item.is_available)}
                          title={item.is_available ? 'ปิดเมนูชั่วคราว' : 'เปิดขาย'}
                          className={`w-10 h-6 rounded-full relative px-1 flex items-center transition-all shrink-0 ${item.is_available ? 'bg-emerald-500 justify-end' : 'bg-outline-variant justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                        <button onClick={() => handleOpenMenuModal(item)} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDeleteMenuItem(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {menuItems.length === 0 && (
                    <div className="py-10 text-center opacity-30 font-black italic text-xs">ยังไม่มีรายการอาหาร</div>
                  )}
                </div>
              </div>

              {/* Kitchen Mode Toggle */}
              <div className="bg-on-surface p-10 rounded-[3rem] text-surface shadow-2xl">
                 <h3 className="text-xl font-black italic font-headline mb-4 uppercase tracking-tighter">Kitchen Mode</h3>
                 <p className="text-surface/60 text-sm font-medium leading-relaxed mb-8">เปิดโหมดเตรียมครัวเพื่อพร้อมเริ่มรับออเดอร์</p>
                 <div className="flex items-center gap-4 bg-surface/10 p-4 rounded-3xl border border-surface/10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${restaurant?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-outline-variant'}`}>
                       <span className="material-symbols-outlined text-surface">restaurant_menu</span>
                    </div>
                    <div className="flex flex-col grow">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</span>
                       <span className="font-black">{restaurant?.is_active ? 'พร้อมให้บริการ' : 'ปิดร้านชั่วคราว'}</span>
                    </div>
                    <button onClick={handleToggleActive} className={`w-10 h-6 rounded-full relative px-1 flex items-center transition-all ${restaurant?.is_active ? 'bg-emerald-500 justify-end' : 'bg-outline-variant justify-start'}`}>
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                 </div>
              </div>

              <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10">
                <h4 className="font-black text-sm uppercase tracking-widest mb-6 flex justify-between">
                  <span>เมนูขายดี</span>
                  <span className="material-symbols-outlined text-primary text-sm animate-pulse">trending_up</span>
                </h4>
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { name: "พัดกะเพราเนื้อวากิวไข่ดาว", sales: 124, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=50&q=80" },
                    { name: "ต้มยำกุ้งแม่น้ำ", sales: 86, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=50&q=80" },
                    { name: "ส้มตำปูปลาร้า", sales: 72, img: "https://images.unsplash.com/photo-1559847844-d9bc26809071?auto=format&fit=crop&w=50&q=80" },
                    { name: "ไก่ย่างสมุนไพร", sales: 65, img: "https://images.unsplash.com/photo-1594221708779-948215570291?auto=format&fit=crop&w=50&q=80" }
                  ].map((m, i) => (
                    <div key={i} className="flex justify-between items-center group">
                       <div className="flex items-center gap-4">
                          <img src={m.img} className="w-10 h-10 rounded-xl object-cover transition-transform group-hover:scale-110" />
                          <div>
                             <p className="text-xs font-bold line-clamp-1">{m.name}</p>
                             <p className="text-[10px] opacity-60">{m.sales} ออเดอร์</p>
                          </div>
                       </div>
                       <div className="h-1.5 w-16 bg-surface-container-high rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-primary" style={{ width: `${Math.max(20, 100 - (i * 15))}%` }} />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {/* Form Modals */}
        <Modal isOpen={showRestaurantModal} onClose={() => setShowRestaurantModal(false)} title="ข้อมูลร้านอาหาร">
          <form onSubmit={handleSaveRestaurant} className="space-y-5">
            <div>
              <label className="input-label mb-2">ชื่อร้านอาหาร *</label>
              <input className="input-field" required value={restaurantForm.name} onChange={e => setRestaurantForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">ที่อยู่ร้าน *</label>
              <input className="input-field" required value={restaurantForm.address} onChange={e => setRestaurantForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">คำอธิบายร้าน</label>
              <textarea className="input-field resize-none" rows={2} placeholder="เล่าให้ลูกค้ารู้จักร้านของคุณ" value={restaurantForm.description} onChange={e => setRestaurantForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">ประเภทอาหาร *</label>
              <select required className="input-field" value={restaurantForm.food_type} onChange={e => setRestaurantForm(p => ({ ...p, food_type: e.target.value }))}>
                <option value="">-- เลือกประเภทอาหาร --</option>
                {foodTypes.map(ft => (
                  <option key={ft.key} value={ft.key}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label mb-2">URL รูปภาพหน้าปกร้าน</label>
              <input className="input-field" placeholder="https://..." value={restaurantForm.image_url} onChange={e => setRestaurantForm(p => ({ ...p, image_url: e.target.value }))} />
              {restaurantForm.image_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-high">
                  <img
                    src={restaurantForm.image_url}
                    alt="preview"
                    className="w-full h-44 object-cover"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    onLoad={e => { (e.target as HTMLImageElement).parentElement!.style.display = '' }}
                  />
                </div>
              )}
            </div>
            <MapPicker onSelect={(lat, lng) => setRestaurantForm(p => ({ ...p, lat, lng }))} initialPos={[restaurantForm.lat, restaurantForm.lng]} />
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowRestaurantModal(false)} className="flex-1 py-4 rounded-2xl bg-surface-container-high">ยกเลิก</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4 rounded-2xl">{submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={showMenuModal} onClose={() => setShowMenuModal(false)} title={editingMenuItemId !== null ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}>
          <form onSubmit={handleSaveMenuItem} className="space-y-5">
            <div>
              <label className="input-label mb-2">หมวดหมู่</label>
              <input
                className="input-field"
                list="menu-categories"
                placeholder="พิมพ์ใหม่ หรือเลือกจากที่เคยเพิ่ม..."
                value={menuForm.category}
                onChange={e => setMenuForm(p => ({ ...p, category: e.target.value }))}
              />
              <datalist id="menu-categories">
                {Array.from(new Set(menuItems.map(i => i.category).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="input-label mb-2">ชื่อเมนู *</label>
              <input className="input-field" required placeholder="เช่น ข้าวหน้าหมูสามชั้นย่าง" value={menuForm.name} onChange={e => setMenuForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">คำอธิบาย</label>
              <textarea className="input-field resize-none" rows={3} placeholder="เช่น หมูสามชั้นย่างไฟอ่อนนาน เสิร์ฟบนข้าวญี่ปุ่นหุงสด" value={menuForm.description} onChange={e => setMenuForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">ราคา (บาท) *</label>
              <input className="input-field" type="number" required min="0" step="0.01" placeholder="220.00" value={menuForm.price} onChange={e => setMenuForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2">URL รูปภาพ</label>
              <input className="input-field" placeholder="https://..." value={menuForm.image_url} onChange={e => setMenuForm(p => ({ ...p, image_url: e.target.value }))} />
              {menuForm.image_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-high">
                  <img
                    src={menuForm.image_url}
                    alt="preview"
                    className="w-full h-44 object-cover"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    onLoad={e => { (e.target as HTMLImageElement).parentElement!.style.display = '' }}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 py-4 rounded-2xl bg-surface-container-high">ยกเลิก</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4 rounded-2xl">
                {submitting ? "กำลังบันทึก..." : editingMenuItemId !== null ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  };

  return renderContent();
}
