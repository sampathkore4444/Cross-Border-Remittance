import { Config } from '@constants/config';

type RateCallback = (rate: { rate: number; mid_market: number; spread: number; updated: string }) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private rateListeners: RateCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const url = Config.API_BASE_URL.replace(/^http/, 'ws') + '/ws/fx';
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => { };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'fx_rate') {
            this.rateListeners.forEach(cb => cb(data.payload));
          }
        } catch { }
      };
      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        }
      };
    } catch { }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  onRate(cb: RateCallback) {
    this.rateListeners.push(cb);
    return () => { this.rateListeners = this.rateListeners.filter(l => l !== cb); };
  }
}

export const wsService = new WebSocketService();
