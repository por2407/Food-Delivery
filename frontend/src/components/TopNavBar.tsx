import { Link } from "react-router-dom";

export default function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-2xl shadow-[0_4px_24px_rgba(78,33,31,0.06)] border-b border-outline-variant/10">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-black text-on-surface italic tracking-tighter hover:opacity-80 transition-opacity">
            Gastronomy
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight">
            <Link to="/" className="text-primary border-b-2 border-primary pb-1 transition-all duration-300">
              สำรวจ
            </Link>
            <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300">
              โปรโมชั่น
            </a>
            <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300">
              พรีเมียม
            </a>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-primary font-semibold">
            <span className="material-symbols-outlined text-xl">location_on</span>
            <span className="text-sm">กรุงเทพมหานคร, ไทย</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </button>
            <Link to="/login" className="p-2 text-on-surface-variant hover:text-primary transition-all active:scale-95">
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
