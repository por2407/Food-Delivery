import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";

export default function TopNavBar() {
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      await logout();
      navigate("/");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-2xl shadow-[0_4px_24px_rgba(78,33,31,0.06)] border-b border-outline-variant/10">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-black text-on-surface italic tracking-tighter hover:opacity-80 transition-opacity decoration-transparent font-headline">
            Gastronomy
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight">
            <Link to="/" className="text-primary border-b-2 border-primary pb-1 transition-all duration-300 decoration-transparent">
              สำรวจ
            </Link>
            {user && user.role === 'user' && (
              <Link to="/orders" className="flex items-center gap-1.5 text-on-surface-variant font-medium hover:text-primary transition-all duration-300 decoration-transparent group/link">
                คำสั่งซื้อของฉัน
                <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </Link>
            )}
            {user && user.role === 'rest' && (
              <Link to="/restaurant-admin" className="flex items-center gap-1.5 text-primary font-black uppercase tracking-widest text-xs hover:opacity-80 transition-all decoration-transparent group/link">
                จัดการร้านอาหาร
                <span className="material-symbols-outlined text-sm">settings</span>
              </Link>
            )}
            <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 decoration-transparent">
              โปรโมชั่น
            </a>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-primary font-semibold">
            <span className="material-symbols-outlined text-xl">location_on</span>
            <span className="text-sm font-body">กรุงเทพมหานคร, ไทย</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/search" className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95 decoration-transparent">
              <span className="material-symbols-outlined text-2xl">search</span>
            </Link>
            
            {(!user || user.role === 'user') && (
              <button 
                onClick={() => navigate(totalItems > 0 ? "/checkout" : "/")}
                className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95 relative"
              >
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-on-primary text-[10px] font-black flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
                 <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-black text-on-surface tracking-tight truncate max-w-[100px]">
                      {user.name || user.email || "User"}
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="text-[9px] font-black uppercase text-error hover:underline tracking-widest"
                    >
                      Logout
                    </button>
                 </div>
                 <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container font-black text-xs shadow-sm">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                 </div>

              </div>
            ) : (
              <Link 
                to="/login" 
                className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95 decoration-transparent"
              >
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
