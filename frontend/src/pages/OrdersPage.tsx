import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { orderService, type Order } from "../services/order-service";
import { useAuthStore } from "../store/useAuthStore";

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "รอร้านรับออเดอร์", color: "text-amber-600 bg-amber-50", icon: "pending" },
  accepted: { label: "รับออเดอร์แล้ว", color: "text-blue-600 bg-blue-50", icon: "check_circle" },
  preparing: { label: "กำลังทำอาหาร", color: "text-indigo-600 bg-indigo-50", icon: "cooking" },
  ready: { label: "อาหารเสร็จแล้ว", color: "text-emerald-600 bg-emerald-50", icon: "restaurant" },
  picked_up: { label: "กำลังไปส่ง", color: "text-cyan-600 bg-cyan-50", icon: "delivery_dining" },
  delivered: { label: "ส่งสำเร็จ", color: "text-green-600 bg-green-50", icon: "task_alt" },
  cancelled: { label: "ยกเลิกแล้ว", color: "text-rose-600 bg-rose-50", icon: "cancel" },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && !user) navigate("/login");
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      try {
        const data = await orderService.getMyOrders();
        setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();

    // Polling for status updates every 10s (Simpler for now than full WS setup in this step)
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

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
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 shadow-inner">
                           <img 
                             src={order.restaurant?.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80"} 
                             alt={order.restaurant?.name} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           />
                        </div>
                        <div>
                           <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{order.restaurant?.name || "ร้านอาหารพรีเมียม"}</h3>
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

                  <div className="px-8 py-6 bg-on-surface/[0.01]">
                    <div className="space-y-3">
                       {order.items?.map((item) => (
                         <div key={item.id} className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                               <span className="font-black text-primary text-sm min-w-[1.5rem]">{item.quantity}x</span>
                               <span className="text-sm font-bold text-on-surface/80">{item.menu_item?.name}</span>
                            </div>
                            <span className="text-sm font-black text-on-surface-variant">฿{(item.price * item.quantity).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-dashed border-outline-variant/10 flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 leading-none mb-1">Order Total</p>
                          <p className="text-2xl font-black text-on-surface italic tracking-tighter">฿{(order.total_amount + order.delivery_fee).toLocaleString()}</p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            className="bg-surface-container-high px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all active:scale-95"
                            onClick={() => alert("ระบบกดยกเลิกกำลังปรับปรุง")}
                            disabled={order.status !== 'pending'}
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
    </div>
  );
}
