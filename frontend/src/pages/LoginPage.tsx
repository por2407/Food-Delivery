import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth-service";

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

/* ── Hero Image URL ───────────────────────────────────────────────────── */
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCwEIQmjqf9HQdd5rdZgwsoDPFBG0YZxhmY0-SqBpRxdruWCstN6w1HhtcYR7R0IzKeP_dKH5GZzkCcdtyNGbH0zAPpKTSeb1MQIPZms981HHb7OIQ6k6M7zp5VFjy1EvjIfOnMIR9DrGGUpJU6FJ0X5z7qHGBLSIakhacTNT8oKbT-0yjAYbyGbLTBsb4cKTDwaEcuSeWJgmJFhwLC6pIa6IB5jrW4UT5RDfw9vtEbnusrdbE9DZ0-6Lw7JN-4ui071A6Joc6x-9w";

/* ── Login Page ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();

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
      const data = await authService.login(email, password);
      console.log("Login success:", data);
      // Redirect จะไปหน้าแรกตาม role (implement ในอนาคต)
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-x-hidden bg-surface">
      {/* Decorative Glows */}
      <div className="glow-primary -top-24 -left-24" />
      <div className="glow-secondary -bottom-24 -right-24" />

      {/* ── Main Card ─────────────────────────────────────────────────── */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 min-h-[921px] bg-surface-container-lowest rounded-lg overflow-hidden shadow-card animate-fade-in">
        {/* ── Left: Editorial Image ─────────────────────────────────── */}
        <section className="hidden lg:block lg:col-span-7 relative overflow-hidden">
          <img
            alt="Gourmet dish beautifully plated"
            className="absolute inset-0 w-full h-full object-cover transform scale-105"
            src={HERO_IMAGE}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/40 to-transparent" />

          {/* Floating Brand Card */}
          <div className="absolute bottom-16 left-16 right-16 z-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="glass-panel p-8 rounded-lg max-w-md">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
                คัดสรรเพื่อนักชิมระดับพรีเมียม
              </h2>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                สัมผัสศิลปะแห่งรสชาติที่ส่งตรงถึงหน้าบ้านคุณ ด้วยความใส่ใจในทุกรายละเอียดระดับบรรณาธิการ
              </p>
            </div>
          </div>
        </section>

        {/* ── Right: Login Form ──────────────────────────────────────── */}
        <section className="col-span-1 lg:col-span-5 flex flex-col justify-center px-8 py-16 md:px-16 lg:px-20 bg-surface-container-lowest">
          {/* Brand */}
          <div className="mb-12 flex flex-col items-start animate-fade-in-up">
            <span className="text-primary font-headline text-3xl font-extrabold tracking-tighter mb-8">
              Gastronomy
            </span>
            <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              ยินดีต้อนรับกลับมา
            </h1>
            <p className="text-on-surface-variant text-lg">
              กรุณากรอกข้อมูลเพื่อเข้าสู่โลกแห่งรสชาติของคุณ
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/10 border border-error/20 text-error text-sm font-medium animate-fade-in-up">
              {error === "Login failed" ? "การเข้าสู่ระบบล้มเหลว" : error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="input-label">
                อีเมล
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="login-password" className="input-label">
                  รหัสผ่าน
                </label>
                <a href="#" className="link-primary text-xs">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ Gastronomy"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-10 divider-text animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <span>หรือดำเนินการต่อด้วย</span>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-1 gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <button type="button" className="btn-social">
              <GoogleIcon />
              เข้าสู่ระบบด้วย Google
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-on-surface-variant font-medium animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <a href="/register" className="link-primary">
              สร้างบัญชีใหม่
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
