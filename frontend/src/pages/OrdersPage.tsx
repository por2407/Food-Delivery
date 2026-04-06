import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { orderService, type Order } from "../services/order-service";
import { reviewService } from "../services/review-service";
import { useAuthStore } from "../store/useAuthStore";

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  picking_up: { label: "กำลังไปรับของ", color: "text-amber-600 bg-amber-50", icon: "local_shipping" },
  at_restaurant: { label: "ถึงร้านอาหารแล้ว", color: "text-purple-600 bg-purple-50", icon: "storefront" },
  delivering: { label: "กำลังส่งของ", color: "text-cyan-600 bg-cyan-50", icon: "delivery_dining" },
  delivered: { label: "ส่งสำเร็จ", color: "text-green-600 bg-green-50", icon: "task_alt" },
  cancelled: { label: "ยกเลิกแล้ว", color: "text-rose-600 bg-rose-50", icon: "cancel" },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [restRating, setRestRating] = useState(0);
  const [restComment, setRestComment] = useState("");
  const [riderRating, setRiderRating] = useState(0);
  const [riderComment, setRiderComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized && !user) navigate("/login");
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    // Polling for status updates every 10s
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSumbitReviews = async () => {
     if (!selectedOrder) return;
     setSubmitting(true);
     try {
        const promises = [];
        if (restRating > 0) {
           promises.push(reviewService.createReview({
              order_id: selectedOrder.id,
              rating: restRating,
              comment: restComment
           }));
        }
        if (riderRating > 0) {
           promises.push(reviewService.createRiderReview({
              order_id: selectedOrder.id,
              rating: riderRating,
              comment: riderComment
           }));
        }
        await Promise.all(promises);
        setShowReviewModal(false);
        // Reset states
        setRestRating(0); setRestComment("");
        setRiderRating(0); setRiderComment("");
        alert("ขอบคุณสำหรับรีวิวของคุณ!");
     } catch (err: any) {
        alert(err.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึกรีวิว");
     } finally {
        setSubmitting(false);
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNavBar />

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <header className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-black font-headline italic mb-2 tracking-tight">ประวัติการสั่งซื้อ</h1>
          <p className="text-on-surface-variant text-sm font-medium">ติดตามและตรวจสอบสถานะอาหารของคุณได้ที่นี่</p>
        </header>

        {orders.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center bg-surface-container-lowest rounded-[3rem] border border-outline-variant/10 shadow-sm">
             <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">assignment_late</span>
             </div>
             <h3 className="text-xl font-black mb-2 tracking-tight">คุณยังไม่มีประวัติการสั่งซื้อ</h3>
             <p className="text-on-surface-variant text-sm mb-8 max-w-[250px]">ลองสั่งอาหารเมนูโปรดของคุณดูสิ!</p>
             <button onClick={() => navigate("/")} className="btn-primary px-8 py-3 rounded-2xl font-black italic">ไปหน้าร้านอาหาร</button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => {
              const status = statusMap[order.status] || statusMap.pending;
              return (
                <div 
                  key={order.id} 
                  className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all animate-fade-in-up overflow-hidden group"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="p-8 border-b border-outline-variant/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/5 shrink-0 shadow-inner flex items-center justify-center">
                           <span className="material-symbols-outlined text-3xl text-primary">restaurant</span>
                        </div>
                        <div>
                           <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">ออเดอร์ #{order.id}</h3>
                           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                             {new Date(order.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                           </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest ${status.color}`}>
                        <span className="material-symbols-outlined text-lg">{status.icon}</span>
                        <span>{status.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-on-surface/5">
                    <div className="space-y-3">
                       {order.items?.map((item) => (
                         <div key={item.id} className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                               <span className="font-black text-primary text-sm min-w-6">{item.quantity}x</span>
                               <span className="text-sm font-bold text-on-surface/80">{item.name}</span>
                            </div>
                            <span className="text-sm font-black text-on-surface-variant">฿{(item.price * item.quantity).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-dashed border-outline-variant/10 flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 leading-none mb-1">Order Total</p>
                          <p className="text-2xl font-black text-on-surface italic tracking-tighter">฿{(order.total_amount + (order.delivery_fee || 0)).toLocaleString()}</p>
                       </div>
                       
                       <div className="flex gap-2">
                          {order.status === 'delivered' && (
                             order.review ? (
                               <div className="bg-green-100 text-green-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  รีวิวแล้ว
                               </div>
                             ) : (
                               <button 
                                 className="bg-amber-100 text-amber-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                 onClick={() => {
                                    setSelectedOrder(order);
                                    setShowReviewModal(true);
                                 }}
                               >
                                  <span className="material-symbols-outlined text-sm">emergency_share</span>
                                  ให้คะแนนบริการ
                               </button>
                             )
                          )}
                          <button 
                            className="bg-surface-container-high px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all active:scale-95 text-on-surface/60"
                            onClick={async () => {
                              if (!window.confirm("ต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?")) return;
                              try {
                                await orderService.cancelOrder(order.id);
                                fetchOrders();
                              } catch (err: any) {
                                alert(err.response?.data?.error || "ไม่สามารถยกเลิกได้");
                              }
                            }}
                            disabled={order.status !== 'picking_up'}
                          >
                            ยกเลิก
                          </button>
                          <button 
                            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                            onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                          >
                            สั่งอีกครั้ง
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* ── REVIEW MODAL ──────────────────────────────────────────────── */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-md animate-fade-in">
           <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-zoom-in">
              <div className="p-10 space-y-8">
                 <header className="text-center">
                    <h2 className="text-3xl font-black italic font-headline tracking-tight mb-2">รีวิวความประทับใจ</h2>
                    <p className="text-on-surface-variant text-sm font-medium">ช่วยบอกเราหน่อยว่าอาหารและการบริการเป็นอย่างไรบ้าง</p>
                 </header>

                 <div className="space-y-8">
                    {/* Restaurant Review */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                             <span className="material-symbols-outlined text-base">restaurant</span>
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">อาหารและร้านค้า</span>
                       </div>
                       <div className="flex justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map(num => (
                             <button 
                               key={num} 
                               onClick={() => setRestRating(num)}
                               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${restRating >= num ? 'bg-primary text-on-primary scale-110 shadow-lg shadow-primary/30' : 'bg-surface-container-high text-on-surface-variant/40'}`}
                             >
                                <span className={`material-symbols-outlined ${restRating >= num ? 'fill-1' : ''}`}>star</span>
                             </button>
                          ))}
                       </div>
                       <textarea 
                         placeholder="รสชาติอาหารเป็นอย่างไร? (ไม่ระบุก็ได้)"
                         className="w-full bg-surface-container-high rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-primary outline-none min-h-[80px] text-on-surface"
                         value={restComment}
                         onChange={e => setRestComment(e.target.value)}
                       />
                    </div>

                    <div className="h-px bg-outline-variant/10 w-1/3 mx-auto" />

                    {/* Rider Review */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                             <span className="material-symbols-outlined text-base">delivery_dining</span>
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">การจัดส่งของไรเดอร์</span>
                       </div>
                       <div className="flex justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map(num => (
                             <button 
                               key={num} 
                               onClick={() => setRiderRating(num)}
                               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${riderRating >= num ? 'bg-tertiary text-on-tertiary scale-110 shadow-lg shadow-tertiary/30' : 'bg-surface-container-high text-on-surface-variant/40'}`}
                             >
                                <span className={`material-symbols-outlined ${riderRating >= num ? 'fill-1' : ''}`}>star</span>
                             </button>
                          ))}
                       </div>
                       <textarea 
                         placeholder="ไรเดอร์สุภาพไหม? ส่งเร็วหรือเปล่า?"
                         className="w-full bg-surface-container-high rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-tertiary outline-none min-h-[80px] text-on-surface"
                         value={riderComment}
                         onChange={e => setRiderComment(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      className="flex-1 py-4 rounded-2xl font-black italic bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all"
                      onClick={() => setShowReviewModal(false)}
                    >
                       ข้ามไปก่อน
                    </button>
                    <button 
                      className="flex-3 py-4 rounded-2xl font-black italic bg-on-surface text-surface hover:shadow-xl transition-all disabled:opacity-40"
                      disabled={submitting || (restRating === 0 && riderRating === 0)}
                      onClick={handleSumbitReviews}
                    >
                       {submitting ? 'กำลังบันทึก...' : 'แชร์ความเห็น'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
