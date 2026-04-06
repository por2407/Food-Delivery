import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import MapPicker from "../components/MapPicker";
import { useCartStore } from "../store/useCartStore";
import { addressService, type Address } from "../services/address-service";
import { useAuthStore } from "../store/useAuthStore";
import { orderService, type PendingOrder } from "../services/order-service";
import { connectCustomerWS, type WSEvent } from "../services/ws-service";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const { user, initialized, loading: authLoading } = useAuthStore();
  const { bills, updateQuantity, clearBill, getTotalItems } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  // ─── Waiting for rider state ─────────────────────────────────────
  const [waitingPending, setWaitingPending] = useState<PendingOrder | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New Address Form
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newLat, setNewLat] = useState<number>(13.7563);
  const [newLng, setNewLng] = useState<number>(100.5018);
  const [submitting, setSubmitting] = useState(false);

  // Roles & Auth Guard
  useEffect(() => {
    if (initialized) {
      if (!user && !authLoading) {
        navigate(`/login?from=${encodeURIComponent(locationPath.pathname)}`, { replace: true });
      } else if (user?.role === 'rest') {
        // Restaurant users can't checkout
        navigate("/", { replace: true });
      }
    }
  }, [user, initialized, authLoading, navigate, locationPath]);

  useEffect(() => {
    if (!user) return;
    async function loadAddresses() {
      try {
        const data = await addressService.getAddresses();
        setAddresses(data);
        if (data.length > 0) {
          const def = data.find(a => a.is_default) || data[0];
          setSelectedAddress(def);
        } else {
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      } finally {
        setLoading(false);
      }
    }
    loadAddresses();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddress) return;
    setSubmitting(true);
    try {
      const added = await addressService.addAddress({ label: newLabel, address: newAddress, note: newNote, lat: newLat, lng: newLng });
      setAddresses([...addresses, added]);
      setSelectedAddress(added);
      setIsModalOpen(false);
      setNewLabel(""); setNewAddress(""); setNewNote("");
    } catch (err) {
      alert("ไม่สามารถเพิ่มที่อยู่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── WebSocket for customer waiting ──────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current) return;
    const ws = connectCustomerWS((evt: WSEvent) => {
      if (evt.type === "pending_order_accepted" || evt.type === "rider_accepted") {
        // Rider accepted! Clean up and navigate
        // Use event data for restaurant_id to avoid stale closure
        const restaurantId = (evt.data as any)?.order?.restaurant_id;
        if (restaurantId) clearBill(restaurantId);
        setWaitingPending(null);
        setWaitingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        navigate("/orders");
      }
      if (evt.type === "pending_order_cancelled") {
        setWaitingPending(null);
        setWaitingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    });
    wsRef.current = ws;
  }, [clearBill, navigate]);

  // Cleanup WS + timer on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, []);

  const handlePlaceOrderForBill = async (restaurantId: number, restaurantName: string, items: any[], note: string = "") => {
    if (!selectedAddress) { alert("กรุณาระบุที่อยู่สำหรับจัดส่ง"); return; }

    setIsProcessing(restaurantId);
    try {
      // Connect WS before placing the order
      connectWS();

      const pending = await orderService.createPendingOrder({
        restaurant_id: restaurantId,
        address_id: selectedAddress.id,
        items: items.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity,
        })),
        note: note,
      });

      setWaitingPending(pending);
      setWaitingSeconds(0);
      timerRef.current = setInterval(() => setWaitingSeconds(s => s + 1), 1000);
    } catch (err: any) {
      alert(`ไม่สามารถสั่งซื้อได้: ${err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ"}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelPending = async () => {
    if (!waitingPending) return;
    try {
      await orderService.cancelPendingOrder(waitingPending.id);
    } catch {
      // even if the API fails, dismiss locally
    }
    setWaitingPending(null);
    setWaitingSeconds(0);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  if (authLoading || (!initialized && !user)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
           <span className="material-symbols-outlined text-4xl text-outline-variant">shopping_cart</span>
        </div>
        <h2 className="text-2xl font-black text-on-surface mb-2 font-headline italic">Cart is Empty</h2>
        <p className="text-on-surface-variant mb-12 font-medium max-w-[250px]">กลับไปเลือกเมนูพรีเมียมที่คุณชอบกันเถอะ!</p>
        <button onClick={() => navigate("/")} className="btn-primary w-full max-w-xs font-black italic tracking-normal">สำรวจร้านอาหาร</button>
      </div>
    );
  }

  const DELIVERY_FEE = 20;

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container text-on-surface">
      <TopNavBar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="mb-14 animate-fade-in-up">
           <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-headline">Secure Checkout</p>
           </div>
           <h1 className="text-5xl font-black text-on-surface tracking-tight font-headline">
             ยืนยันรายการสั่งซื้อ
           </h1>
           {user && (
             <p className="mt-4 text-on-surface-variant font-medium text-sm flex items-center gap-2">
               บัญชี: <span className="font-bold text-on-surface border-b border-primary/20">{user.email}</span>
               <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-black">{bills.length} ร้าน · {getTotalItems()} รายการ</span>
             </p>
           )}
        </header>

        <div className="space-y-8">
          {/* 📍 DELIVERY */}
          <section className="bg-surface-container-lowest p-10 rounded-[3.5rem] border border-outline-variant/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] animate-fade-in-up">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10">
                   <span className="material-symbols-outlined text-2xl">location_on</span>
                </div>
                <div>
                   <h3 className="font-black text-xl font-headline leading-tight">สถานที่จัดส่ง</h3>
                   <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Delivery Destination</p>
                </div>
              </div>
              {addresses.length > 0 && (
                 <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-surface-container-high rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-sm">
                   เพิ่มใหม่
                 </button>
              )}
            </header>

            {loading ? (
              <div className="py-16 flex justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div>
            ) : addresses.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-outline-variant/20 rounded-[2.5rem] flex flex-col items-center text-center">
                 <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-outline-variant">add_location_alt</span>
                 </div>
                 <p className="text-on-surface-variant font-bold text-sm mb-6">คุณยังไม่มีที่อยู่ที่บันทึกไว้</p>
                 <button onClick={() => setIsModalOpen(true)} className="btn-primary w-fit px-8 py-3 rounded-2xl font-black italic">กรุณาระบุที่อยู่</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {addresses.map((addr) => (
                   <div 
                     key={addr.id} onClick={() => setSelectedAddress(addr)}
                     className={`group p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden ${selectedAddress?.id === addr.id ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" : "border-outline-variant/10 hover:border-primary/20"}`}
                   >
                      <div className={`mb-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAddress?.id === addr.id ? 'border-primary' : 'border-outline-variant'}`}>
                         {selectedAddress?.id === addr.id && <div className="w-3 h-3 bg-primary rounded-full" />}
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-tighter mb-2">{addr.label}</h4>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-[1.6] line-clamp-3">{addr.address}</p>
                      {addr.note && <div className="mt-4 text-[9px] font-black text-primary italic bg-primary/5 w-fit px-3 py-1 rounded-lg">{addr.note}</div>}
                      <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl opacity-[0.03] rotate-12">near_me</span>
                   </div>
                 ))}
              </div>
            )}
          </section>

          {/* 🍽️ SEPARATE BILLS PER RESTAURANT */}
          {bills.map((bill, idx) => {
            const billSubtotal = bill.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const billTotal = billSubtotal + DELIVERY_FEE;
            const billItemCount = bill.items.reduce((s, i) => s + i.quantity, 0);
            const processing = isProcessing === bill.restaurantId;

            return (
              <section 
                key={bill.restaurantId} 
                className="bg-surface-container-lowest rounded-[3.5rem] border border-outline-variant/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] animate-fade-in-up overflow-hidden" 
                style={{ animationDelay: `${(idx + 1) * 0.1}s` }}
              >
                {/* Bill Header */}
                <div className="p-10 pb-0">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary border border-secondary/10">
                         <span className="material-symbols-outlined text-2xl">restaurant</span>
                      </div>
                      <div>
                         <h3 className="font-black text-xl font-headline leading-tight">{bill.restaurantName}</h3>
                         <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                           Bill #{idx + 1} · {billItemCount} Items
                         </p>
                      </div>
                    </div>
                    {!processing && (
                      <button onClick={() => clearBill(bill.restaurantId)} className="text-[10px] font-black uppercase text-error/60 hover:text-error transition-colors tracking-widest">ลบทั้งร้าน</button>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {bill.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-4 px-4 rounded-2xl hover:bg-surface-container-high/30 transition-colors">
                        <div className="flex items-center gap-5 grow">
                           <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                              <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"} alt={item.name} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-sm tracking-tight">{item.name}</span>
                              <span className="text-xs text-on-surface-variant font-bold">฿{item.price.toLocaleString()} /ชิ้น</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           {!processing ? (
                             <div className="flex items-center gap-1 bg-surface-container-high rounded-full px-1 py-1 shadow-inner">
                                <button 
                                  onClick={() => updateQuantity(bill.restaurantId, item.id, -1)} 
                                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">{item.quantity === 1 ? 'delete' : 'remove'}</span>
                                </button>
                                <span className="text-sm font-black min-w-[2rem] text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(bill.restaurantId, item.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                             </div>
                           ) : (
                             <span className="text-sm font-black text-on-surface-variant">x {item.quantity}</span>
                           )}
                           <span className="font-black text-sm min-w-[4rem] text-right">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Footer (Payment Summary + Pay Button) */}
                <div className="mt-6 mx-6 mb-6 p-8 bg-on-surface/[0.03] rounded-[2.5rem] border border-outline-variant/5">
                   <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-on-surface-variant items-center">
                        <span className="text-xs font-bold opacity-50 uppercase tracking-widest">ค่าอาหาร</span>
                        <span className="text-sm font-black">฿{billSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant items-center">
                        <span className="text-xs font-bold opacity-50 uppercase tracking-widest">ค่าจัดส่ง</span>
                        <span className="text-sm font-black text-secondary">฿{DELIVERY_FEE}</span>
                      </div>
                      <div className="w-full h-px bg-outline-variant/10" />
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">ยอดรวม</span>
                        <span className="text-4xl font-black text-on-surface tracking-tighter italic">฿{billTotal.toLocaleString()}</span>
                      </div>
                   </div>

                   {/* Payment */}
                   <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-outline-variant/5 mb-8">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-md shadow-primary/20">
                         <span className="material-symbols-outlined text-xl">qr_code_2</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase tracking-widest text-primary">Payment Method</span>
                         <span className="text-sm font-black tracking-tight">พร้อมเพย์ / QR Payment</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => handlePlaceOrderForBill(bill.restaurantId, bill.restaurantName, bill.items)}
                     disabled={!selectedAddress || processing}
                     className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-4 group shadow-xl shadow-primary/30 disabled:opacity-40 disabled:grayscale font-black italic text-lg transition-all hover:scale-[1.02] active:scale-95"
                   >
                     {processing ? (
                       <>
                         <div className="animate-spin h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full" />
                         <span>กำลังสั่งซื้อ...</span>
                       </>
                     ) : (
                       <>
                         <span>ชำระเงิน — ฿{billTotal.toLocaleString()}</span>
                         <span className="material-symbols-outlined text-xl group-hover:translate-x-2 transition-transform">send</span>
                       </>
                     )}
                   </button>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* ⏳ WAITING FOR RIDER OVERLAY */}
      {waitingPending && (
        <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">
            {/* Animated pulse ring */}
            <div className="relative mx-auto w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary">delivery_dining</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black font-headline text-on-surface mb-2">กำลังค้นหาไรเดอร์...</h2>
              <p className="text-on-surface-variant font-medium text-sm">
                ระบบกำลังส่งคำสั่งซื้อไปยังไรเดอร์ในพื้นที่ กรุณารอสักครู่
              </p>
            </div>

            {/* Timer */}
            <div className="text-4xl font-black font-mono text-primary tabular-nums">
              {String(Math.floor(waitingSeconds / 60)).padStart(2, "0")}:{String(waitingSeconds % 60).padStart(2, "0")}
            </div>

            {/* Order summary card */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 text-left border border-outline-variant/10 shadow-lg">
              <p className="text-xs font-black uppercase text-secondary tracking-widest mb-3">สรุปคำสั่งซื้อ</p>
              <p className="font-bold text-on-surface mb-2">{waitingPending.restaurant_name}</p>
              <div className="space-y-1 text-sm text-on-surface-variant">
                {waitingPending.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.name} × {it.quantity}</span>
                    <span className="font-bold text-on-surface">฿{it.sub_total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-outline-variant/10 mt-3 pt-3 flex justify-between text-sm">
                <span className="text-on-surface-variant">ค่าจัดส่ง</span>
                <span className="font-bold text-on-surface">฿{waitingPending.delivery_fee.toLocaleString()}</span>
              </div>
              <div className="border-t border-outline-variant/10 mt-2 pt-3 flex justify-between font-black text-base">
                <span>รวมทั้งสิ้น</span>
                <span className="text-primary">฿{(waitingPending.total_amount + waitingPending.delivery_fee).toLocaleString()}</span>
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={handleCancelPending}
              className="w-full py-4 rounded-2xl border-2 border-error/30 text-error font-black text-sm hover:bg-error/5 transition-colors active:scale-95"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </div>
        </div>
      )}

      {/* 📍 ADD ADDRESS MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="ระบุสถานที่จัดส่งอาหาร">
        <form onSubmit={handleAddAddress} className="space-y-8 animate-fade-in">
           <div className="rounded-[2.5rem] overflow-hidden border-2 border-outline-variant/10 shadow-lg">
             <MapPicker onSelect={(lat, lng) => { setNewLat(lat); setNewLng(lng); }} initialPos={[newLat, newLng]} />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase text-secondary pl-4 tracking-widest">ชื่อสถานที่</label>
                 <input type="text" required value={newLabel} onChange={e => setNewLabel(e.target.value)} className="bg-surface-container-high px-6 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-primary text-sm font-bold" placeholder="บ้าน, คอนโด, ออฟฟิศ..." />
              </div>
              <div className="flex flex-col gap-2 opacity-50">
                 <label className="text-[10px] font-black uppercase text-secondary pl-4 tracking-widest">เบอร์ติดต่อ</label>
                 <input type="text" placeholder="ใช้เบอร์ที่ลงทะเบียน" disabled className="bg-surface-container-high px-6 py-4 rounded-2xl border-0 text-[10px] font-bold cursor-not-allowed" />
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-secondary pl-4 tracking-widest">ที่อยู่โดยละเอียด</label>
              <textarea required value={newAddress} onChange={e => setNewAddress(e.target.value)} className="bg-surface-container-high px-6 py-4 rounded-3xl border-0 focus:ring-2 focus:ring-primary text-sm font-bold min-h-[120px] resize-none" placeholder="เลขที่อาคาร, ถนน, จุดสังเกต..." />
           </div>
           <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-secondary pl-4 tracking-widest">หมายเหตุถึงไรเดอร์</label>
              <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} className="bg-surface-container-high px-6 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-primary text-sm font-bold" placeholder="เช่น ตึก A ชั้น 5, ฝากไว้ที่รปภ..." />
           </div>
           <div className="pt-6">
              <button type="submit" disabled={submitting} className="btn-primary w-full py-5 rounded-3xl shadow-2xl shadow-primary/30 disabled:opacity-50 font-black italic text-lg hover:scale-[1.01] active:scale-[0.98] transition-all">
                {submitting ? "กำลังบันทึก..." : "บันทึกและดำเนินการต่อ"}
              </button>
           </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
