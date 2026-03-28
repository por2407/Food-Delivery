export default function Footer() {
  return (
    <footer className="bg-surface-container-low dark:bg-stone-900 w-full py-20 px-6 border-t border-outline-variant/10">
      <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-16 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 text-left">
          <span className="text-xl font-black text-on-surface dark:text-stone-200 tracking-tighter uppercase italic">Gastronomy</span>
          <p className="text-on-surface-variant dark:text-stone-400 font-body text-xs leading-loose max-w-xs">
            © 2024 Gastronomy. The Digital Maître D’ Experience. All rights reserved for those with exquisite taste. สัมผัสศิลปะแห่งรสชาติที่ส่งตรงถึงหน้าบ้านคุณ
          </p>
        </div>
        
        <div className="flex flex-wrap gap-x-10 gap-y-4 font-label text-xs uppercase tracking-widest text-on-surface-variant dark:text-stone-400 font-bold">
          <a className="hover:text-primary transition-all underline-offset-4 hover:underline" href="#">เกี่ยวกับเรา</a>
          <a className="hover:text-primary transition-all underline-offset-4 hover:underline" href="#">ร่วมงานกับเรา</a>
          <a className="hover:text-primary transition-all underline-offset-4 hover:underline" href="#">นโยบายความเป็นส่วนตัว</a>
          <a className="hover:text-primary transition-all underline-offset-4 hover:underline" href="#">ข้อกำหนดการใช้งาน</a>
        </div>
        
        <div className="flex justify-start md:justify-end gap-8">
          <div className="flex flex-col items-end gap-6">
            <div className="flex gap-4">
              <button className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:scale-110 transition-transform shadow-sm">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:scale-110 transition-transform shadow-sm">
                <span className="material-symbols-outlined">language</span>
              </button>
            </div>
            <span className="text-[11px] text-on-surface-variant tracking-[0.3em] font-extrabold text-right">BANGKOK | TOKYO | PARIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
