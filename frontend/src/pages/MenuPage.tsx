import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { restaurantService } from "../services/restaurant-service";
import type { Restaurant, MenuItem } from "../types/restaurant";
import { decodeId } from "../lib/obfuscator";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { reviewService, type Review } from "../services/review-service";

export default function MenuPage() {
  const { id: slugAndId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const publicId = slugAndId?.split("-").pop();
  const realId = publicId ? decodeId(publicId) : 0;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"menu" | "reviews">("menu");

  const { 
    bills, 
    addItem, 
    updateQuantity, 
    clearBill, 
    getBillItems, 
    getBillTotal 
  } = useCartStore();

  // Current restaurant cart items
  const cartItems = restaurant ? getBillItems(restaurant.id) : [];
  const billTotal = restaurant ? getBillTotal(restaurant.id) : 0;

  useEffect(() => {
    if (!realId) return;
    async function fetchData() {
      try {
        const [resData, menuData, reviewData] = await Promise.all([
          restaurantService.getById(realId),
          restaurantService.getMenuItems(realId),
          reviewService.getReviewsByRestaurant(realId),
        ]);
        setRestaurant(resData);
        setMenuItems(menuData);
        setReviews(reviewData.data);
      } catch (err) {
        console.error("Failed to fetch restaurant details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [realId]);

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    addItem(item, restaurant.id, restaurant.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-on-surface mb-4">ไม่พบร้านอาหารที่ต้องการ</h2>
        <button onClick={() => navigate("/")} className="btn-primary px-8 py-3 rounded-2xl">กลับหน้าหลัก</button>
      </div>
    );
  }

  // Group menu items by category
  const categories = Array.from(new Set(menuItems.map(i => i.category || "เมนูทั่วไป")));

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar />

      <main className="pt-24 pb-20">
        {/* ── Hero Section (Restaurant Header) ── */}
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img 
            src={restaurant.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"} 
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute inset-x-0 bottom-0 px-6 pb-16 max-w-7xl mx-auto flex flex-col items-start gap-6 animate-fade-in-up">
              <div className="flex flex-col gap-2">
                 <div className="bg-primary/90 text-on-primary text-[10px] font-black px-4 py-1.5 rounded-full backdrop-blur-sm self-start uppercase tracking-widest shadow-xl shadow-primary/20">
                    {restaurant.food_type}
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none mb-2">
                    {restaurant.name}
                 </h1>
                 <p className="text-white/80 font-medium max-w-2xl leading-relaxed text-sm md:text-base">
                    {restaurant.description || "สัมผัสประสบการณ์รสชาติพรีเมียมที่รังสรรค์ด้วยความใส่ใจ พร้อมบริการระดับ Gastronomy ที่จะทำให้มื้ออาหารของคุณพิเศษกว่าที่เคย"}
                 </p>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-white/90 text-[11px] font-black uppercase tracking-widest">
                 <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined text-primary text-xl">star</span>
                    <span>{restaurant.rating?.toFixed(1) || "New"} Rating</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
                    <span>25-35 นาที</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined text-emerald-400 text-xl">payments</span>
                    <span>จัดส่ง 10%</span>
                 </div>
              </div>
          </div>
        </section>

        {/* ── Tabs Navigation ── */}
        <section className="border-b border-outline-variant/20 sticky top-[72px] bg-surface/80 backdrop-blur-xl z-30">
          <div className="max-w-7xl mx-auto px-6 flex gap-12">
             <button 
               onClick={() => setActiveTab("menu")}
               className={`py-6 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'menu' ? 'text-primary' : 'text-on-surface-variant'}`}
             >
                เมนูอาหาร
                {activeTab === 'menu' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--color-primary),0.4)]" />}
             </button>
             <button 
               onClick={() => setActiveTab("reviews")}
               className={`py-6 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'reviews' ? 'text-primary' : 'text-on-surface-variant'}`}
             >
                รีวิวจากลูกค้า ({reviews.length})
                {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--color-primary),0.4)]" />}
             </button>
          </div>
        </section>

        {/* ── Content Area ── */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          {activeTab === "menu" ? (
            menuItems.length === 0 ? (
            <div className="py-32 text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 font-thin">lunch_dining</span>
              <p className="text-xl text-on-surface-variant font-medium">ร้านนี้ยังไม่ได้เพิ่มเมนูอาหาร</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_350px] gap-12">
              <div className="flex flex-col gap-16">
                 {categories.map((cat, catIdx) => (
                   <div key={cat} className="animate-fade-in-up" style={{ animationDelay: `${catIdx * 0.1}s` }}>
                      <h2 className="text-2xl font-black text-on-surface mb-8 pb-4 border-b border-outline-variant/30 flex items-center gap-4">
                        {cat}
                        <span className="text-sm font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                          {menuItems.filter(i => (i.category || "เมนูทั่วไป") === cat).length}
                        </span>
                      </h2>
                      
                      <div className="grid sm:grid-cols-2 gap-6">
                        {menuItems.filter(i => (i.category || "เมนูทั่วไป") === cat).map((item) => {
                          const inCart = cartItems.find(ci => ci.id === item.id);
                          return (
                            <div 
                              key={item.id}
                              className="group flex gap-4 p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl hover:shadow-card hover:border-primary/20 transition-all duration-300"
                            >
                              <div className="grow flex flex-col">
                                 <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                                   {item.name}
                                 </h3>
                                 <p className="text-sm text-on-surface-variant line-clamp-2 mb-3 mt-1 leading-relaxed">
                                   {item.description || "เมนูแนะนำแสนอร่อย ปรุงสดใหม่ทุกวันเพื่อคุณ"}
                                 </p>
                                 {item.rating && item.rating > 0 ? (
                                   <div className="flex items-center gap-1.5 mb-3 bg-amber-500/10 w-fit px-2 py-0.5 rounded-full border border-amber-500/10">
                                      <span className="material-symbols-outlined text-sm text-amber-500 fill-1">star</span>
                                      <span className="text-[10px] font-black text-amber-600">{item.rating.toFixed(1)}</span>
                                      <span className="text-[10px] opacity-40 font-black ml-1">({item.review_count})</span>
                                   </div>
                                 ) : null}
                                 <div className="mt-auto flex items-center justify-between">
                                    <span className="text-xl font-black text-primary">฿{item.price.toLocaleString()}</span>
                                    {!['rest', 'rider', 'admin'].includes(user?.role ?? '') && (
                                      inCart ? (
                                        <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-2 py-1">
                                           <button 
                                             onClick={() => updateQuantity(restaurant.id, item.id, -1)} 
                                             className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors"
                                           >
                                             <span className="material-symbols-outlined text-sm">{inCart.quantity === 1 ? 'delete' : 'remove'}</span>
                                           </button>
                                           <span className="text-sm font-black min-w-6 text-center">{inCart.quantity}</span>
                                           <button 
                                             onClick={() => updateQuantity(restaurant.id, item.id, 1)}
                                             className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
                                           >
                                             <span className="material-symbols-outlined text-sm">add</span>
                                           </button>
                                        </div>
                                      ) : (
                                        <button 
                                          className="p-2 bg-secondary-container text-on-secondary-container rounded-full hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                                          onClick={() => handleAddToCart(item)}
                                          title="เพิ่มลงตะกร้า"
                                        >
                                          <span className="material-symbols-outlined text-base">add</span>
                                        </button>
                                      )
                                    )}
                                 </div>
                              </div>
                              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm bg-surface-container-high">
                                 <img 
                                   src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"} 
                                   alt={item.name}
                                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                 />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                 ))}
              </div>

              {/* ── Sticky Sidebar (Cart for THIS restaurant) ── */}
              {!['rest', 'rider', 'admin'].includes(user?.role ?? '') && (
                <aside className="hidden lg:block">
                   <div className="sticky top-32 flex flex-col gap-6">
                      {/* Promo Card */}
                      <div className="bg-primary text-on-primary p-6 rounded-3xl shadow-lg shadow-primary/20 relative overflow-hidden group">
                         <div className="relative z-10">
                            <h3 className="font-black text-xl mb-1 italic tracking-tight">Flash Deal!</h3>
                            <p className="text-on-primary/80 text-sm leading-relaxed mb-4">
                              สั่งขั้นต่ำ ฿300 รับส่วนลดค่าส่ง ฿20
                            </p>
                            <div className="w-12 h-1 bg-white/40 rounded-full group-hover:w-full transition-all duration-700" />
                         </div>
                         <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700">local_pizza</span>
                      </div>

                      {/* Cart Card for current restaurant only */}
                      <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-[2rem] shadow-sm flex flex-col">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-primary">shopping_bag</span>
                               <h3 className="font-black text-lg text-on-surface">ตะกร้าของคุณ</h3>
                            </div>
                            {cartItems.length > 0 && (
                              <button onClick={() => clearBill(restaurant.id)} className="text-[10px] font-black uppercase text-error hover:underline">Clear</button>
                            )}
                         </div>

                         {cartItems.length === 0 ? (
                           <div className="py-12 flex flex-col items-center text-center opacity-40">
                              <span className="material-symbols-outlined text-4xl mb-3">shopping_cart_checkout</span>
                              <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">ตะกร้าว่างเปล่า</p>
                           </div>
                         ) : (
                           <>
                             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                               {cartItems.map((item) => (
                                 <div key={item.id} className="flex justify-between items-center gap-4">
                                    <div className="flex flex-col gap-0.5">
                                       <span className="text-sm font-bold text-on-surface line-clamp-1">{item.name}</span>
                                       <span className="text-[10px] font-bold text-on-surface-variant">฿{item.price.toLocaleString()} x {item.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-1.5 py-0.5">
                                      <button onClick={() => updateQuantity(restaurant.id, item.id, -1)} className="w-5 h-5 flex items-center justify-center hover:text-error transition-colors">
                                        <span className="material-symbols-outlined text-xs">{item.quantity === 1 ? 'delete' : 'remove'}</span>
                                      </button>
                                      <button onClick={() => updateQuantity(restaurant.id, item.id, 1)} className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-xs">add</span>
                                      </button>
                                    </div>
                                 </div>
                               ))}
                             </div>

                             <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-col gap-4">
                                <div className="flex justify-between items-end">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Subtotal</span>
                                   <span className="text-2xl font-black text-primary italic">฿{billTotal.toLocaleString()}</span>
                                </div>
                                <button 
                                  onClick={() => navigate("/checkout")}
                                  className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 group/btn shadow-lg shadow-primary/20 font-black italic tracking-tight"
                                >
                                  <span>ดำเนินการชำระเงิน</span>
                                  <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                             </div>
                           </>
                         )}
                      </div>
                   </div>
                </aside>
              )}
            </div>
          )) : (
            /* ── Reviews View ── */
            <div className="max-w-3xl animate-fade-in-up">
                {reviews.length === 0 ? (
                   <div className="py-24 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                     <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 font-thin">rate_review</span>
                     <p className="text-lg text-on-surface-variant font-black italic">ยังไม่มีรีวิวสำหรับร้านนี้</p>
                     <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest mt-2">เป็นคนแรกที่รีวิวหลังสั่งอาหารสิ!</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     <div className="flex items-center gap-8 bg-primary/5 p-10 rounded-[3rem] border border-primary/10">
                        <div className="text-center">
                           <p className="text-6xl font-black text-primary italic leading-none">{reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length?.toFixed(1) || "0.0"}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-2">คะแนนเฉลี่ย</p>
                        </div>
                        <div className="h-16 w-px bg-primary/20" />
                        <div className="space-y-1 grow">
                           <p className="text-lg font-black italic tracking-tight">เสียงตอบรับจากนักชิม</p>
                           <p className="text-sm text-on-surface-variant font-medium">สัมผัสประสบการณ์จริงจากลูกค้าที่เคยใช้บริการจริงกับเรา</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {reviews.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((rev, idx) => (
                           <div 
                             key={rev.id} 
                             className="p-8 bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                             style={{ animationDelay: `${idx * 0.05}s` }}
                           >
                              <div className="flex justify-between items-start mb-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center font-black text-primary italic">
                                       {rev.customer?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                       <p className="font-black text-lg tracking-tight">{rev.customer?.name || "Customer"}</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                          {new Date(rev.created_at).toLocaleDateString()}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                       <span key={star} className={`material-symbols-outlined text-lg ${star <= rev.rating ? 'text-primary fill-1' : 'text-on-surface-variant/20'}`}>star</span>
                                    ))}
                                 </div>
                              </div>
                              <p className="text-on-surface font-medium leading-relaxed italic border-l-4 border-primary/20 pl-4 py-1">
                                 "{rev.comment || "ไม่ได้ระบุความเห็นเพิ่มเติม"}"
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}