import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  onSelect: (lat: number, lng: number) => void;
  initialPos?: [number, number];
}

function MapUpdater({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, 16, { animate: true });
  }, [pos, map]);
  return null;
}

function LocationMarker({ onSelect, pos }: { onSelect: (lat: number, lng: number) => void; pos: [number, number] }) {
  const map = useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <Marker position={pos} />
  );
}

export default function MapPicker({ onSelect, initialPos = [13.7563, 100.5018] }: MapPickerProps) {
  const [pos, setPos] = useState<[number, number]>(initialPos);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setPos([latitude, longitude]);
        onSelect(latitude, longitude);
      });
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่งปัจจุบัน");
    }
  };

  useEffect(() => {
     if (initialPos && (initialPos[0] !== pos[0] || initialPos[1] !== pos[1])) {
       console.log("MapPicker: pos updated from props", initialPos);
       setPos(initialPos);
     }
  }, [initialPos?.[0], initialPos?.[1]]);

  return (
    <div className="relative w-full h-[400px] rounded-[2.5rem] overflow-hidden border-2 border-outline-variant/10 shadow-2xl group ring-1 ring-black/5">
      {/* ── Status Hint ────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant/10 shadow-lg text-[10px] font-black uppercase tracking-widest text-on-surface flex items-center gap-2 animate-bounce-subtle pointer-events-none">
         <span className="material-symbols-outlined text-primary text-base">near_me</span>
         จิ้มที่จุดส่งอาหารบนแผนที่
      </div>

      <button 
        type="button"
        onClick={handleGetCurrentLocation}
        className="absolute bottom-6 right-6 z-[999] p-4 bg-primary text-on-primary rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-white shadow-primary/20"
        title="ใช้ตำแหน่งปัจจุบัน"
      >
        <span className="material-symbols-outlined text-2xl">my_location</span>
      </button>

      {/* ── Map ─────────────────────────────────────────────────── */}
      <MapContainer 
        center={pos} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater pos={pos} />
        <LocationMarker onSelect={(lat, lng) => {
            setPos([lat, lng]);
            onSelect(lat, lng);
        }} pos={pos} />
      </MapContainer>

      {/* ── Tooltip ────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-6 z-[998] bg-on-surface/90 text-surface px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md pointer-events-none">
         <span className="material-symbols-outlined text-[14px] text-primary">touch_app</span>
         เลื่อนและคลิกบนแผนที่เพื่อระบุจุด
      </div>
    </div>
  );
}
