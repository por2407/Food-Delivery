import { useEffect } from "react";
import { useRestaurantStore } from "../store/useRestaurantStore";

export default function CategorySection() {
  const { foodTypes, fetchFoodTypes, selectedFoodType, setSelectedFoodType } = useRestaurantStore();

  useEffect(() => {
    fetchFoodTypes();
  }, [fetchFoodTypes]);

  return (
    <section className="px-6 py-16 bg-surface-container-low/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12 animate-fade-in-up">
          <div className="text-left">
            <h2 className="text-3xl font-bold text-on-surface mb-2">ประเภทอาหาร</h2>
            <p className="text-on-surface-variant">เลือกสไตล์อาหารที่คุณชื่นชอบ</p>
          </div>
          {selectedFoodType && (
            <button 
              onClick={() => setSelectedFoodType(null)}
              className="text-primary font-bold flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              ดูทั้งหมด <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
          {foodTypes.map((ft, idx) => (
            <div
              key={ft.key}
              className="group cursor-pointer text-center animate-fade-in-up"
              style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
              onClick={() =>
                setSelectedFoodType(selectedFoodType === ft.key ? null : ft.key)
              }
            >
              <div
                className={`aspect-square rounded-full overflow-hidden mb-3 bg-surface-container-highest relative transition-all duration-300 ${
                  selectedFoodType === ft.key
                    ? "ring-4 ring-primary shadow-lg shadow-primary/20 scale-110"
                    : "ring-0 group-hover:ring-4 group-hover:ring-primary-container group-hover:shadow-md"
                }`}
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={ft.label}
                  src={ft.image_url}
                />
              </div>
              <p
                className={`font-headline text-sm font-bold transition-colors ${
                  selectedFoodType === ft.key
                    ? "text-primary"
                    : "text-on-surface group-hover:text-primary"
                }`}
              >
                {ft.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
