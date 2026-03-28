import { useRestaurantStore } from "../store/useRestaurantStore";

const HERO_FOOD_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";
const HERO_RESTAURANT_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

export default function HeroSection() {
  const { searchTerm, setSearchTerm } = useRestaurantStore();

  return (
    <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto overflow-hidden animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* ── Left: Text + Search ─────────────────────────────── */}
        <div className="z-10 text-left">
          <span
            className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            เมนูแนะนำวันนี้
          </span>
          <h1
            className="text-5xl md:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            อาหารดีๆ <br />
            <span className="text-primary italic">ส่งตรงถึงคุณ</span>
          </h1>
          <p
            className="text-lg text-on-surface-variant font-body leading-relaxed max-w-lg mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            สัมผัสประสบการณ์การสั่งอาหารระดับพรีเมียม คัดสรรร้านอาหารคุณภาพ
            พร้อมเสิร์ฟตรงถึงหน้าประตูบ้านคุณ
          </p>

          <div
            className="flex flex-col md:flex-row gap-4 max-w-xl animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="grow flex items-center bg-surface-container-low px-6 py-4 rounded-full group focus-within:bg-secondary-container/20 transition-all border border-transparent focus-within:border-primary/20 shadow-sm">
              <span className="material-symbols-outlined text-outline-variant mr-3">
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant font-body outline-none"
                placeholder="ค้นหาร้านอาหารหรือเมนู..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-linear-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-full font-headline font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all hover:shadow-primary/30">
              ค้นหา
            </button>
          </div>
        </div>

        {/* ── Right: Hero Images ──────────────────────────────── */}
        <div
          className="relative animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          {/* รูปใหญ่ — เมนูอาหารที่ฮิตที่สุด */}
          <div className="aspect-4/5 rounded-xl overflow-hidden relative shadow-2xl shadow-on-surface/5 transform hover:scale-[1.01] transition-transform duration-700">
            <img
              className="w-full h-full object-cover"
              alt="เมนูยอดนิยมประจำสัปดาห์"
              src={HERO_FOOD_IMAGE}
            />
            <div className="absolute inset-0 bg-linear-to-t from-on-surface/40 via-transparent to-transparent" />

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 right-6 glass-panel p-5 rounded-lg">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <div>
                  <p className="font-headline font-bold text-on-surface text-base">
                    เมนูยอดนิยมวันนี้
                  </p>
                  <p className="text-on-surface-variant text-sm">
                    คัดสรรเมนูฮิตจากร้านดังทั่วกรุงเทพ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* รูปเล็ก — บรรยากาศร้านอาหาร */}
          <div
            className="absolute -bottom-10 -left-10 w-56 h-56 rounded-xl overflow-hidden border-[6px] border-surface shadow-2xl hidden md:block animate-fade-in-up"
            style={{ animationDelay: "0.7s" }}
          >
            <img
              className="w-full h-full object-cover"
              alt="บรรยากาศร้านอาหารชั้นนำ"
              src={HERO_RESTAURANT_IMAGE}
            />
            {/* Floating label */}
            <div className="absolute bottom-0 inset-x-0 bg-on-surface/60 backdrop-blur px-3 py-2 text-center">
              <p className="text-white text-xs font-bold tracking-wider">
                🏆 ร้านดังแนะนำ
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
