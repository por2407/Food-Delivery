import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/auth-service";
import { useAuthStore } from "../store/useAuthStore";

/* ── SVG Icons ────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, initialized, setUser } = useAuthStore();
  
  const from = searchParams.get("from") || "/";

  // 1. Re-login Guard: Redirect if already logged in
  useEffect(() => {
    if (initialized && user) {
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, from]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await authService.login(email, password);
      setUser(resp.info);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "การเข้าสู่ระบบล้มเหลว");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-x-hidden bg-surface">
      <div className="fixed -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 min-h-[800px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl animate-fade-in border border-outline-variant/10">
        <section className="hidden lg:block lg:col-span-7 relative overflow-hidden">
          <img
            alt="Delicious food"
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute bottom-16 left-16 right-16 z-10 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 max-w-md">
              <h2 className="text-4xl font-black tracking-tight text-white mb-4 leading-tight font-headline">
                รสชาติระดับพรีเมียม <br />ที่คุณสัมผัสได้
              </h2>
              <p className="text-white/80 font-medium leading-relaxed font-body">
                เข้าร่วมชุมชนนักชิมเพื่อรับสิทธิพิเศษและประสบการณ์การสั่งอาหารที่เหนือระดับ
              </p>
            </div>
          </div>
        </section>

        <section className="col-span-1 lg:col-span-5 flex flex-col justify-center px-8 py-16 md:px-16 lg:px-20">
          <div className="mb-12 animate-fade-in-up">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-8">
               <span className="material-symbols-outlined text-on-primary">local_pizza</span>
            </div>
            <h1 className="text-4xl font-black text-on-surface tracking-tight mb-3 font-headline">
              ยินดีต้อนรับกลับมา
            </h1>
            <p className="text-on-surface-variant font-medium font-body">
              เข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-error-container text-on-error-container text-sm font-bold flex gap-3 items-center animate-shake">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-4 font-headline">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-high px-6 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-primary font-bold font-body"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline">รหัสผ่าน</label>
                <button type="button" className="text-[10px] font-black uppercase text-primary hover:underline font-headline">ลืมรหัสผ่าน?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-high px-6 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-primary font-bold font-body"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 rounded-2xl text-lg font-black italic shadow-xl shadow-primary/20 disabled:scale-100 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "กำลังโหลด..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4 text-outline-variant italic font-bold text-xs uppercase tracking-widest">
            <div className="h-px grow bg-outline-variant/20" />
            หรือ
            <div className="h-px grow bg-outline-variant/20" />
          </div>

          <button type="button" className="w-full border-2 border-outline-variant/20 py-4 rounded-2xl flex items-center justify-center gap-4 hover:bg-surface-container-high transition-all active:scale-95 mb-8">
            <GoogleIcon />
            <span className="font-bold text-sm font-headline">ต่อด้วย Google</span>
          </button>

          <p className="text-center font-bold text-sm text-on-surface-variant font-body">
            ยังไม่มีบัญชี? <a href="/register" className="text-primary hover:underline">สมัครสมาชิก</a>
          </p>
        </section>
      </main>
    </div>
  );
}
