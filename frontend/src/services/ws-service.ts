// ─── WebSocket service สำหรับ real-time communication ──────────────────
const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000")
  .replace(/^http/, "ws")
  .replace(/\/api$/, "");

export interface WSEvent {
  type: string;
  order_id?: number | string;  // number for DB orders, string for pending orders
  data?: any;
}

type WSEventHandler = (event: WSEvent) => void;

export function connectWS(
  path: string,
  onMessage: WSEventHandler,
  onOpen?: () => void,
  onClose?: () => void,
): WebSocket {
  const url = `${WS_BASE}/ws${path}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`[WS] Connected: ${path}`);
    onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data: WSEvent = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
    }
  };

  ws.onclose = () => {
    console.log(`[WS] Disconnected: ${path}`);
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error("[WS] Error:", err);
  };

  return ws;
}

/** เชื่อมต่อ WS สำหรับ customer (รับ pending_order_created, rider_accepted, etc.) */
export function connectCustomerWS(onMessage: WSEventHandler) {
  return connectWS("/customer", onMessage);
}

/** เชื่อมต่อ WS สำหรับ rider (รับ new_pending_order, pending_order_cancelled, etc.) */
export function connectRiderWS(onMessage: WSEventHandler) {
  return connectWS("/rider", onMessage);
}

/** เชื่อมต่อ WS สำหรับเจ้าของร้าน */
export function connectRestaurantWS(restaurantId: number, onMessage: WSEventHandler) {
  return connectWS(`/restaurant/${restaurantId}`, onMessage);
}
