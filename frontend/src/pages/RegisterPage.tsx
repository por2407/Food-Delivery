import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth-service";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"user" | "rest" | "rider">("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
      });
      navigate("/login", { state: { message: "ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ" } });
    } catch (err: any) {
      setError(err.message || "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-on-surface relative items-center justify-center p-20 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay scale-110 hover:scale-100 transition-transform duration-[10s]" />
         <div className="absolute inset-0 bg-linear-to-br from-primary/40 to-black/80" />
         
         <div className="relative z-10 text-surface animate-fade-in-up">
            <h1 className="text-7xl font-black font-headline italic mb-6 leading-none">JOIN THE<br />REVOLUTION.</h1>
            <p className="text-xl font-medium opacity-80 max-w-md leading-relaxed">ร่วมเป็นส่วนหนึ่งของเครือข่ายส่งอาหารที่เติบโตเร็วที่สุดในกรุงเทพฯ ไม่ว่าคุณจะเป็นผู้หิวโหย เจ้าของร้านอาหาร หรือนักบิดมือโปร</p>
         </div>

         {/* Animated elements */}
         <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-20 overflow-y-auto bg-surface">
        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
               <span className="material-symbols-outlined text-primary group-hover:-translate-x-1 transition-transform">arrow_back</span>
               <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">กลับหน้าหลัก</span>
            </Link>
            <h2 className="text-4xl font-black font-headline italic mb-2 tracking-tight">ลงทะเบียนใหม่</h2>
            <p className="text-on-surface-variant font-medium">กรอกข้อมูลเพื่อเริ่มต้นการเดินทางของคุณ</p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-xs font-bold mb-8 border border-error/10 flex items-center gap-3 animate-head-shake">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="bg-surface-container-high p-2 rounded-2xl flex gap-1 shadow-inner mb-4">
              {[
                { id: "user" as const, label: "สั่งอาหาร", icon: "fastfood" },
                { id: "rest" as const, label: "ร้านอาหาร", icon: "storefront" },
                { id: "rider" as const, label: "ไรเดอร์", icon: "delivery_dining" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                    role === r.id 
                      ? "bg-on-surface text-surface shadow-lg scale-100" 
                      : "text-on-surface-variant hover:bg-on-surface/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: role === r.id ? "'FILL' 1" : "'FILL' 0" }}>{r.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
               <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder=" "
                    value={formData.name}
                    onChange={handleInputChange}
                    className="peer w-full bg-surface-container-low border border-transparent focus:border-primary focus:bg-surface rounded-2xl px-6 py-4 pt-7 outline-none transition-all font-bold placeholder-transparent"
                  />
                  <label className="absolute left-6 top-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:opacity-60 transition-all pointer-events-none group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:opacity-40">ชื่อ-นามสกุล</label>
               </div>

               <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder=" "
                    value={formData.email}
                    onChange={handleInputChange}
                    className="peer w-full bg-surface-container-low border border-transparent focus:border-primary focus:bg-surface rounded-2xl px-6 py-4 pt-7 outline-none transition-all font-bold placeholder-transparent"
                  />
                  <label className="absolute left-6 top-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:opacity-60 transition-all pointer-events-none group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:opacity-40">อีเมล</label>
               </div>

               <div className="relative group">
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder=" "
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="peer w-full bg-surface-container-low border border-transparent focus:border-primary focus:bg-surface rounded-2xl px-6 py-4 pt-7 outline-none transition-all font-bold placeholder-transparent"
                  />
                  <label className="absolute left-6 top-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:opacity-60 transition-all pointer-events-none group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:opacity-40">เบอร์โทรศัพท์</label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                     <input
                       type="password"
                       name="password"
                       required
                       placeholder=" "
                       value={formData.password}
                       onChange={handleInputChange}
                       className="peer w-full bg-surface-container-low border border-transparent focus:border-primary focus:bg-surface rounded-2xl px-6 py-4 pt-7 outline-none transition-all font-bold placeholder-transparent"
                     />
                     <label className="absolute left-6 top-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:opacity-60 transition-all pointer-events-none group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:opacity-40">รหัสผ่าน</label>
                  </div>
                  <div className="relative group">
                     <input
                       type="password"
                       name="confirmPassword"
                       required
                       placeholder=" "
                       value={formData.confirmPassword}
                       onChange={handleInputChange}
                       className="peer w-full bg-surface-container-low border border-transparent focus:border-primary focus:bg-surface rounded-2xl px-6 py-4 pt-7 outline-none transition-all font-bold placeholder-transparent"
                     />
                     <label className="absolute left-6 top-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:opacity-60 transition-all pointer-events-none group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:opacity-40">ยืนยันรหัสผ่าน</label>
                  </div>
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-16 rounded-[2rem] font-black italic shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-xl"
            >
              {loading ? (
                <div className="h-6 w-6 border-4 border-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  ลงทะเบียนเลย
                  <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-on-surface-variant text-sm font-medium">
              เป็นสมาชิกอยู่แล้วเหรอ?{" "}
              <Link
                to="/login"
                className="text-primary font-black uppercase tracking-widest hover:underline ml-2"
              >
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}