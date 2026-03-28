import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useRestaurantStore } from "../store/useRestaurantStore";

export default function RestaurantGrid() {
  const {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    fetchMoreRestaurants,
    selectedFoodType,
    searchTerm,
    foodTypes,
    hasMore,
  } = useRestaurantStore();

  // Load when category changes
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants, selectedFoodType]);

  // ── Infinite Scroll Observer ────────────────────────────────────
  const observerRef = (node: HTMLDivElement | null) => {
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreRestaurants();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  };

  // ── Search Logic (Client-side) ──────────────────────────────────
  const filteredRestaurants = restaurants.filter((res) => {
    const matchesSearch =
      !searchTerm ||
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // หา label ภาษาไทยของ food_type
  const getFoodTypeLabel = (key: string): string => {
    const found = foodTypes.find((ft) => ft.key === key);
    return found?.label ?? key;
  };

  // ── Initial Error/Empty ─────────────────────────────────────────
  if (error && restaurants.length === 0) {
    return <div className="py-20 text-center text-error font-medium">{error}</div>;
  }

  // ── Section Title ───────────────────────────────────────────────
  const sectionTitle = selectedFoodType
    ? `ร้านอาหาร: ${getFoodTypeLabel(selectedFoodType)}`
    : "ร้านอาหารทั้งหมด";

  return (
    <section className="px-6 py-20 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12 animate-fade-in-up">
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight text-left">
          {sectionTitle}
        </h2>
        <span className="text-on-surface-variant font-medium text-sm">
          {filteredRestaurants.length} ร้าน
        </span>
      </div>

      {filteredRestaurants.length === 0 && !loading ? (
        <div className="py-32 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 animate-fade-in">
            no_meals
          </span>
          <p className="text-lg text-on-surface-variant font-medium animate-fade-in">
            ไม่พบร้านอาหารที่คุณต้องการ ลองค้นหาใหม่อีกครั้ง
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredRestaurants.map((res, idx) => (
              <Link
                to={`/restaurant/${res.id}`}
                key={`${res.id}-${idx}`}
                className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(78,33,31,0.06)] transition-all duration-500 hover:shadow-[0_24px_48px_-12px_rgba(78,33,31,0.12)] hover:scale-[1.01] animate-fade-in-up"
                style={{ animationDelay: `${(idx % 10) * 0.04}s` }}
              >
                {/* Image */}
                <div className="h-64 overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={res.name}
                    src={
                      res.image_url ||
                      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800"
                    }
                  />

                  {/* Rating Badge */}
                  {res.rating && res.rating > 0 ? (
                    <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-outline-variant/10">
                      <span
                        className="material-symbols-outlined text-primary text-base leading-none"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-bold text-sm text-on-surface">
                        {res.rating.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant border border-outline-variant/10">
                      ใหม่
                    </div>
                  )}

                  {/* Food Type Tag */}
                  <div className="absolute bottom-4 left-4 bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/30">
                    {getFoodTypeLabel(res.food_type)}
                  </div>

                  {/* Closed Overlay */}
                  {!res.is_active && (
                    <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-5 py-2.5 bg-surface text-on-surface font-headline font-bold rounded-full text-sm">
                        ปิดชั่วคราว
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-7 text-left grow flex flex-col">
                  <h3 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors mb-2">
                    {res.name}
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed line-clamp-2 mb-auto min-h-[48px]">
                    {res.description || "สัมผัสประสบการณ์รสชาติพรีเมียมที่รังสรรค์ด้วยความใส่ใจ"}
                  </p>

                  <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/80 mt-6 pt-6 border-t border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg leading-none group-hover:text-primary transition-colors">
                        location_on
                      </span>
                      <span className="normal-case tracking-normal text-xs font-semibold truncate max-w-[140px]">
                        {res.address || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg leading-none group-hover:text-primary transition-colors">
                        schedule
                      </span>
                      {res.is_active ? "เปิดอยู่" : "ปิด"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Observer Node / Loader */}
          <div ref={observerRef} className="py-20 flex justify-center items-center">
            {loading ? (
              <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>กำลังโหลดข้อมูลเพิ่มเติม...</span>
              </div>
            ) : hasMore ? (
              <p className="text-on-surface-variant/60 text-sm italic">เลื่อนลงเพื่อโหลดภาพเพิ่มเติม</p>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-24 h-px bg-outline-variant/30" />
                <p className="text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest">
                  คุณมาถึงร้านท้ายสุดแล้ว
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
