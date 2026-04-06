import { useEffect, useState } from "react";
import TopNavBar from "../components/TopNavBar";
import Footer from "../components/Footer";
import { reviewService } from "../services/review-service";

interface RiderStat {
  rider_id: number;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  review_count: number;
}

interface RiderReview {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer?: {
    name: string;
  };
}

export default function RiderReviewsPage() {
  const [riders, setRiders] = useState<RiderStat[]>([]);
  const [selectedRider, setSelectedRider] = useState<RiderStat | null>(null);
  const [reviews, setReviews] = useState<RiderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const data = await reviewService.getRiderStats();
      setRiders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRider = async (rider: RiderStat) => {
    setSelectedRider(rider);
    setLoadingReviews(true);
    try {
      const res = await reviewService.getRiderReviews(rider.rider_id);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-on-surface italic tracking-tighter mb-4">
            Rider Reputation
          </h1>
          <p className="text-on-surface-variant font-medium">ตรวจสอบความประทับใจและผลงานของเหล่าไรเดอร์ในชุมชนของเรา</p>
        </header>

        <div className="grid lg:grid-cols-[400px_1fr] gap-12">
          {/* Rider List */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">delivery_dining</span>
              เหล่าไรเดอร์ทั้งหมด ({riders.length})
            </h2>
            
            {loading ? (
              <div className="py-20 text-center opacity-20">
                 <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
              </div>
            ) : riders.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-10 text-center bg-surface-container-low rounded-3xl border border-outline-variant/10">ไม่พบข้อมูลไรเดอร์</p>
            ) : (
              <div className="flex flex-col gap-3">
                {riders.map(rider => (
                  <button
                    key={rider.rider_id}
                    onClick={() => handleSelectRider(rider)}
                    className={`flex items-center gap-4 p-4 rounded-3xl transition-all border text-left ${selectedRider?.rider_id === rider.rider_id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30'}`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container font-black text-xl overflow-hidden shadow-sm">
                      {rider.avatar ? <img src={rider.avatar} className="w-full h-full object-cover" alt="" /> : rider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="grow">
                      <h3 className="font-bold text-on-surface leading-tight mb-1">{rider.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-amber-500 fill-1">star</span>
                          <span className="text-xs font-black text-amber-600">{rider.rating > 0 ? rider.rating.toFixed(1) : "N/A"}</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-bold opacity-40 uppercase tracking-widest">{rider.review_count} รีวิว</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/20">chevron_right</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Review Details */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-10 min-h-[500px]">
             {!selectedRider ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <span className="material-symbols-outlined text-7xl font-thin mb-4">rate_review</span>
                  <p className="text-xl font-medium max-w-[300px]">เลือกไรเดอร์เพื่อดูรายละเอียดรีวิวและความคิดเห็น</p>
               </div>
             ) : (
               <div className="animate-fade-in">
                  <header className="flex flex-wrap items-end justify-between gap-6 mb-12 pb-8 border-b border-outline-variant/10">
                     <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-secondary-container flex items-center justify-center text-on-secondary-container font-black text-4xl overflow-hidden shadow-xl">
                          {selectedRider.avatar ? <img src={selectedRider.avatar} className="w-full h-full object-cover" alt="" /> : selectedRider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2 italic uppercase">{selectedRider.name}</h2>
                           <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                             <span className="material-symbols-outlined text-sm">call</span>
                             {selectedRider.phone}
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="text-center bg-surface-container-high px-6 py-4 rounded-3xl border border-outline-variant/20">
                           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-1 leading-none">คะแนนเฉลี่ย</p>
                           <p className="text-3xl font-black text-amber-600 italic leading-none">{selectedRider.rating > 0 ? selectedRider.rating.toFixed(1) : "0.0"}</p>
                        </div>
                        <div className="text-center bg-surface-container-high px-6 py-4 rounded-3xl border border-outline-variant/20">
                           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-1 leading-none">จำนวนรีวิว</p>
                           <p className="text-3xl font-black text-primary italic leading-none">{selectedRider.review_count}</p>
                        </div>
                     </div>
                  </header>

                  {loadingReviews ? (
                    <div className="py-20 text-center opacity-20">
                       <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                       <p className="text-lg font-medium">ยังไม่มีความคิดเห็นสำหรับไรเดอร์คนนี้</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                       {reviews.map(rev => (
                         <div key={rev.id} className="p-6 bg-surface-container-high/30 rounded-3xl border border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                     {rev.customer?.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-bold text-on-surface">{rev.customer?.name}</span>
                               </div>
                               <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <span key={s} className={`material-symbols-outlined text-xs ${rev.rating >= s ? 'text-amber-500 fill-1' : 'text-on-surface-variant/20'}`}>star</span>
                                  ))}
                               </div>
                            </div>
                            <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">"{rev.comment || 'ไม่มีความเห็นเพิ่มเติม'}"</p>
                            <p className="text-[10px] font-bold text-on-surface-variant opacity-30 mt-4 uppercase tracking-tighter">{new Date(rev.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
