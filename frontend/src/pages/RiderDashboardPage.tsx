import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/useAuthStore";
import { orderService, type PendingOrder, type Order } from "../services/order-service";
import { reviewService } from "../services/review-service";
import { connectRiderWS, type WSEvent } from "../services/ws-service";

type Tab = "pending" | "myorders";

const orderStatusMap: Record<string, { label: string; color: string; icon: string }> = {
  picking_up:    { label: "กำลังไปรับของ",     color: "text-amber-600 bg-amber-50",     icon: "local_shipping" },
  at_restaurant: { label: "ถึงร้านแล้ว รออาหาร",  color: "text-purple-600 bg-purple-50",   icon: "storefront" },
  delivering:    { label: "กำลังส่งของ",        color: "text-cyan-600 bg-cyan-50",       icon: "delivery_dining" },
  delivered:     { label: "เสร็จสิ้น",           color: "text-green-600 bg-green-50",     icon: "task_alt" },
  cancelled:     { label: "ยกเลิก",             color: "text-rose-600 bg-rose-50",       icon: "cancel" },
};

export default function RiderDashboardPage() {
  const navigate = useNavigate();
  const { user, initialized, loading: authLoading } = useAuthStore();

  const [tab, setTab] = useState<Tab>("pending");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingMyOrders, setLoadingMyOrders] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [riderRating, setRiderRating] = useState<number>(0);
  const [riderReviewCount, setRiderReviewCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // ─── Auth guard — rider only ────────────────────────────────────
  useEffect(() => {
    if (initialized && !authLoading) {
      if (!user) navigate("/login", { replace: true });
      else if (user.role !== "rider") navigate("/", { replace: true });
    }
  }, [user, initialized, authLoading, navigate]);

  // ─── Load pending orders on mount ──────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "rider") return;
    orderService.getAllPendingOrders()
      .then(setPendingOrders)
      .catch(console.error)
      .finally(() => setLoadingPending(false));
  }, [user]);

  // ─── Load my accepted orders (from DB) ──────────────────────────
  useEffect(() => {
    if (!user || user.role !== "rider") return;
    orderService.getRiderOrders()
      .then((orders) => setMyOrders(orders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )))
      .catch(console.error)
      .finally(() => setLoadingMyOrders(false));

    // Fetch Reviews/Rating
    if (user.id) {
       reviewService.getRiderReviews(user.id).then((res: any) => {
          const reviews = res.data || [];
          setRiderReviewCount(reviews.length);
          if (reviews.length > 0) {
             const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
             setRiderRating(avg);
          }
       }).catch(console.error);
    }
  }, [user]);

  // ─── WebSocket real-time events ─────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "rider") return;
    const ws = connectRiderWS((evt: WSEvent) => {
      if (evt.type === "new_pending_order" && evt.data) {
        setPendingOrders((prev) =>
          prev.some((o) => o.id === (evt.data as PendingOrder).id)
            ? prev
            : [evt.data as PendingOrder, ...prev]
        );
      }
      if (evt.type === "pending_order_cancelled" || evt.type === "pending_order_accepted") {
        const pendingId = (evt.data as { id?: string })?.id;
        if (pendingId) setPendingOrders((prev) => prev.filter((o) => o.id !== pendingId));
      }
    });
    wsRef.current = ws;
    return () => { ws.close(); wsRef.current = null; };
  }, [user]);

  // ─── Accept pending order ───────────────────────────────────────
  const handleAccept = async (pendingId: string) => {
    setAcceptingId(pendingId);
    try {
      await orderService.acceptPendingOrder(pendingId);
      setPendingOrders((prev) => prev.filter((o) => o.id !== pendingId));
      const freshOrders = await orderService.getRiderOrders();
      setMyOrders(freshOrders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setTab("myorders");
    } catch (err: any) {
      const msg = err.message || "ไม่สามารถรับงานได้";
      if (msg.includes("taken") || msg.includes("already")) {
        setPendingOrders((prev) => prev.filter((o) => o.id !== pendingId));
        alert("⚡ งานนี้ถูกรับไปโดยไรเดอร์คนอื่นแล้ว");
      } else {
        alert(msg);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // ─── Rider: เปลี่ยนสถานะ ────────────────────────────────────────
  const handleMarkAtRestaurant = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.markAtRestaurant(orderId);
      setMyOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "at_restaurant" } : o));
    } catch (err: any) {
      alert(err?.response?.data?.error || "ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkDelivering = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.markDelivering(orderId);
      setMyOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "delivering" } : o));
    } catch (err: any) {
      alert(err?.response?.data?.error || "ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.markDelivered(orderId);
      setMyOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "delivered" } : o));
    } catch (err: any) {
      alert(err?.response?.data?.error || "ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
            <p className="text-[10px] font-black uppercase tracking-widest text-tertiary font-headline">Rider Dashboard</p>
          </div>
          <h1 className="text-5xl font-black tracking-tight font-headline">แดชบอร์ดไรเดอร์</h1>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <span className="text-sm text-on-surface-variant font-medium">
              สวัสดี <strong>{user?.name || user?.email}</strong>
            </span>
            <span className="text-xs bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-black">
              💰 ค่าส่ง = 10% ของราคาอาหาร
            </span>
          </div>
        </header>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-8 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/10 w-fit">
          <button
            onClick={() => setTab("pending")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
              tab === "pending"
                ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">hourglass_top</span>
            รอรับงาน
            {pendingOrders.length > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                tab === "pending" ? "bg-on-primary/20 text-on-primary" : "bg-error text-white"
              }`}>
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("myorders")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
              tab === "myorders"
                ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            งานที่รับแล้ว
            {myOrders.length > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                tab === "myorders" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}>
                {myOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* ══ TAB: PENDING ORDERS ══════════════════════════════════ */}
        {tab === "pending" && (
          loadingPending ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in-up">
              <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">hourglass_empty</span>
              </div>
              <h2 className="text-2xl font-black font-headline italic">ยังไม่มีออเดอร์รอรับ</h2>
              <p className="text-on-surface-variant font-medium text-sm mt-2">ระบบจะแจ้งเตือนทันทีเมื่อมีลูกค้าสั่งอาหาร</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingOrders.map((order) => {
                const isAccepting = acceptingId === order.id;
                const riderEarning = order.delivery_fee;
                return (
                  <section
                    key={order.id}
                    className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden animate-fade-in-up"
                  >
                    {/* Card header */}
                    <div className="px-8 pt-7 pb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary border border-tertiary/10 shrink-0">
                          <span className="material-symbols-outlined text-2xl">restaurant</span>
                        </div>
                        <div>
                          <h3 className="font-black text-lg leading-tight">{order.restaurant_name}</h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            ส่งไป: <strong className="text-on-surface">"{order.address_label}"</strong>
                            <span className="mx-1.5 text-outline-variant">·</span>
                            {formatTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      {/* Rider earning */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">คุณได้รับ</p>
                        <p className="text-2xl font-black text-tertiary">฿{riderEarning.toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-8 py-3 space-y-2 border-t border-outline-variant/5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-1.5">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-outline-variant/10 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{item.name}</p>
                            <p className="text-xs text-on-surface-variant">฿{item.price.toLocaleString()} × {item.quantity}</p>
                          </div>
                          <span className="font-black text-sm">฿{item.sub_total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="px-8 pb-7 pt-4">
                      <div className="bg-surface-container-high/50 rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">ราคาอาหาร</p>
                          <p className="font-black text-base">฿{order.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="border-x border-outline-variant/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">ส่วนแบ่งคุณ (10%)</p>
                          <p className="font-black text-base text-tertiary">฿{riderEarning.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">ลูกค้าจ่ายรวม</p>
                          <p className="font-black text-base">฿{(order.total_amount + order.delivery_fee).toLocaleString()}</p>
                        </div>
                      </div>

                      {order.note && (
                        <div className="mb-4 flex items-start gap-2 text-xs text-on-surface-variant bg-surface-container-high/30 rounded-xl px-4 py-2.5">
                          <span className="material-symbols-outlined text-sm mt-0.5">sticky_note_2</span>
                          <span>{order.note}</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={isAccepting || acceptingId !== null}
                        className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black italic text-lg shadow-xl shadow-primary/30 disabled:opacity-40 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {isAccepting ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full" />
                            <span>กำลังรับงาน...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">check_circle</span>
                            <span>รับงานนี้ — ได้ ฿{riderEarning.toFixed(0)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )
        )}

        {/* ══ TAB: MY ACCEPTED ORDERS ══════════════════════════════ */}
        {tab === "myorders" && (
          loadingMyOrders ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in-up">
              <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">assignment_late</span>
              </div>
              <h2 className="text-2xl font-black font-headline italic">ยังไม่มีงานที่รับ</h2>
              <p className="text-on-surface-variant font-medium text-sm mt-2 mb-6">
                กลับไปดูออเดอร์ที่รอรับ
              </p>
              <button onClick={() => setTab("pending")} className="btn-primary px-8 py-3 rounded-2xl font-black italic">
                ดูออเดอร์รอรับ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "ทั้งหมด",    value: myOrders.length, icon: "receipt_long",    color: "text-primary" },
                  { label: "กำลังไปรับ", value: myOrders.filter(o => o.status === "picking_up").length,  icon: "local_shipping",   color: "text-amber-600" },
                  { label: "ถึงร้าน",   value: myOrders.filter(o => o.status === "at_restaurant").length, icon: "storefront",     color: "text-purple-600" },
                  { label: "กำลังส่ง",   value: myOrders.filter(o => o.status === "delivering").length,  icon: "delivery_dining",  color: "text-cyan-600" },
                  {
                    label: "รายได้รวม",
                    value: `฿${myOrders.filter(o => o.status === "delivered")
                      .reduce((s, o) => s + o.delivery_fee, 0).toFixed(0)}`,
                    icon: "payments", color: "text-tertiary"
                  },
                  {
                    label: "คะแนนเฉลี่ย",
                    value: riderRating > 0 ? riderRating.toFixed(1) : "New",
                    icon: "star", color: "text-amber-500"
                  },
                  {
                    label: "รีวิวทั้งหมด",
                    value: riderReviewCount,
                    icon: "rate_review", color: "text-blue-500"
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/10 text-center">
                    <span className={`material-symbols-outlined text-2xl ${stat.color} mb-2 block`}>{stat.icon}</span>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {myOrders.map((order, idx) => {
                const status = orderStatusMap[order.status] || orderStatusMap.picking_up;
                const isUpdating = updatingOrderId === order.id;
                return (
                  <div
                    key={order.id}
                    className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    {/* Restaurant + Customer + status row */}
                    <div className="px-7 py-5 flex items-start justify-between gap-4 flex-wrap border-b border-outline-variant/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 shrink-0 text-primary">
                          <span className="material-symbols-outlined text-2xl">person</span>
                        </div>
                        <div>
                          <p className="font-black text-lg leading-tight text-on-surface">
                            {order.customer?.name || `ลูกค้า #${order.customer_id}`}
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">phone</span>
                              <span>{order.customer?.phone || "-"}</span>
                            </p>
                            <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 flex-wrap">
                              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                              <span className="text-on-surface font-black tracking-tight">{order.address?.label || "-"}</span>
                              <span className="text-[10px] opacity-60">({order.address?.address || "-"})</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs shadow-sm ${status.color}`}>
                          <span className="material-symbols-outlined text-sm">{status.icon}</span>
                          {status.label}
                        </div>
                        {order.restaurant && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10">
                            <span className="material-symbols-outlined text-sm">storefront</span>
                            <span>{order.restaurant.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Restaurant Location (Rider focus) */}
                    {order.restaurant && (
                      <div className="px-7 py-3 bg-primary/5 flex items-center gap-4 border-b border-primary/10">
                         <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-lg">navigation</span>
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">จุดรับอาหาร</p>
                            <p className="text-xs font-black text-on-surface truncate">
                               📍 {order.restaurant.address}
                            </p>
                         </div>
                         {order.restaurant.lat && order.restaurant.lng && (
                           <a 
                             href={`https://www.google.com/maps/dir/?api=1&destination=${order.restaurant.lat},${order.restaurant.lng}`}
                             target="_blank" rel="noreferrer"
                             className="ml-auto flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                           >
                             <span className="material-symbols-outlined text-sm">map</span>
                             นำทาง
                           </a>
                         )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="px-7 py-3 border-t border-outline-variant/5 space-y-1.5">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-on-surface-variant">
                            <strong className="text-primary">{item.quantity}×</strong> {item.name}
                          </span>
                          <span className="font-bold">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer: totals + earnings + ACTION BUTTONS */}
                    <div className="px-7 py-4 border-t border-dashed border-outline-variant/10">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                        <p className="text-xs text-on-surface-variant font-medium">
                          {formatTime(order.created_at)}
                          {order.note && <span className="ml-3 italic">📝 {order.note}</span>}
                        </p>
                        <div className="flex items-center gap-5 text-right">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ลูกค้าจ่าย</p>
                            <p className="font-black text-sm">฿{(order.total_amount + order.delivery_fee).toLocaleString()}</p>
                          </div>
                          <div className="border-l border-outline-variant/10 pl-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">คุณได้รับ</p>
                            <p className="font-black text-lg text-tertiary">฿{order.delivery_fee.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* ── Action buttons based on status ── */}
                      {order.status === "picking_up" && (
                        <button
                          onClick={() => handleMarkAtRestaurant(order.id)}
                          disabled={isUpdating}
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-base shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 bg-purple-600 text-white shadow-purple-600/30"
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                              <span>กำลังอัปเดต...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">storefront</span>
                              <span>ฉันถึงร้านอาหารแล้ว</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status === "at_restaurant" && (
                        <button
                          onClick={() => handleMarkDelivering(order.id)}
                          disabled={isUpdating}
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-base shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 bg-cyan-600 text-white shadow-cyan-600/30"
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                              <span>กำลังอัปเดต...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">delivery_dining</span>
                              <span>ได้รับอาหารแล้ว — กำลังไปส่ง</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status === "delivering" && (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          disabled={isUpdating}
                          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-base shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 bg-green-600 text-white shadow-green-600/30"
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                              <span>กำลังอัปเดต...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">task_alt</span>
                              <span>ส่งถึงลูกค้าแล้ว — เสร็จสิ้น</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status === "delivered" && (
                        <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-green-600 bg-green-50 font-black text-sm">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>เสร็จสิ้น — ได้รับ ฿{order.delivery_fee.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
