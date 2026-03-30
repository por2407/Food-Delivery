import { useEffect } from "react";
import TopNavBar from "../components/TopNavBar";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";
import RestaurantGrid from "../components/RestaurantGrid";
import Footer from "../components/Footer";
import { useRestaurantStore } from "../store/useRestaurantStore";

export default function HomePage() {
  const { setSearchTerm, setSelectedFoodType } = useRestaurantStore();

  useEffect(() => {
    // รีเซ็ตการค้นหาและตัวกรองเมื่อกลับมาหน้าหลัก เพื่อให้เห็นร้านค้าทั้งหมดแบบ Clean State
    setSearchTerm("");
    setSelectedFoodType(null);
  }, [setSearchTerm, setSelectedFoodType]);

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Decorative Glow Backgrounds */}
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: "0.5s" }} />
      <div className="fixed -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: "0.8s" }} />

      <TopNavBar />
      
      <main className="pt-20">
        <HeroSection />
        <CategorySection />
        <RestaurantGrid />
      </main>

      <Footer />
    </div>
  );
}
