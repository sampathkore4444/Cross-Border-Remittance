import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@ngoensai_offline_queue';

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  createdAt: number;
  retryCount: number;
}

export async function enqueueRequest(req: Omit<QueuedRequest, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedRequest[] = raw ? JSON.parse(raw) : [];
    queue.push({
      ...req,
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { }
}

export async function dequeueRequest(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const queue: QueuedRequest[] = JSON.parse(raw);
    const filtered = queue.filter(r => r.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch { }
}

export async function getQueue(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function incrementRetry(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const queue: QueuedRequest[] = JSON.parse(raw);
    const idx = queue.findIndex(r => r.id === id);
    if (idx !== -1) {
      queue[idx].retryCount++;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch { }
}

export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch { }
}
