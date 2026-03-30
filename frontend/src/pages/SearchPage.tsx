import TopNavBar from "../components/TopNavBar";
import RestaurantGrid from "../components/RestaurantGrid";
import Footer from "../components/Footer";
import { useRestaurantStore } from "../store/useRestaurantStore";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
  const { searchTerm, setSearchTerm } = useRestaurantStore();
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Just keep it here as current search
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Decorative Glow Backgrounds */}
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: "0.5s" }} />
      <div className="fixed -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: "0.8s" }} />

      <TopNavBar />
      
      <main className="pt-32">
        <div className="px-6 max-w-7xl mx-auto mb-12 animate-fade-in-up">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
           >
             <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
             <span className="font-headline font-bold">ย้อนกลับ</span>
           </button>

           <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
             <div className="max-w-2xl w-full">
               <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-6 mt-2">
                 ผลการค้นหา {searchTerm && <span className="text-primary italic">"{searchTerm}"</span>}
               </h1>
               
               <div className="relative group">
                 <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                   <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors">search</span>
                 </div>
                 <input
                   type="text"
                   className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/30 focus:bg-secondary-container/10 focus:ring-4 focus:ring-primary/5 rounded-2xl py-5 pl-16 pr-8 text-lg font-body text-on-surface transition-all outline-none shadow-sm"
                   placeholder="ค้นหาร้านอาหารหรือเมนูอื่น..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyDown={handleKeyDown}
                 />
               </div>
             </div>
           </div>
        </div>

        <RestaurantGrid hideTitle={true} />
      </main>

      <Footer />
    </div>
  );
}
