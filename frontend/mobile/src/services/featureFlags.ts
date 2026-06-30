import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { analytics } from './analytics';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  variants?: Record<string, number>;
}

const FLAGS_CACHE_KEY = '@feature_flags';
const CACHE_TTL = 30 * 60 * 1000;

let _flags: Map<string, FeatureFlag> = new Map();
let _lastFetch = 0;

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: 'new_payout_methods', enabled: false },
  { key: 'promotional_banners', enabled: true },
  { key: 'referral_program', enabled: false },
  { key: 'autosend_v2', enabled: false },
  { key: 'biometric_lock', enabled: true },
  { key: 'qr_pickup_verification', enabled: true },
  { key: 'receipt_upload', enabled: true },
];

async function loadCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FLAGS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { flags: FeatureFlag[]; timestamp: number };
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        parsed.flags.forEach((f) => _flags.set(f.key, f));
      }
    }
  } catch {}
}

export async function initFeatureFlags(): Promise<void> {
  await loadCache();
  try {
    const res = await api.client.get('/feature-flags');
    const remoteFlags: FeatureFlag[] = res.data.flags ?? [];
    remoteFlags.forEach((f) => _flags.set(f.key, f));
    await AsyncStorage.setItem(
      FLAGS_CACHE_KEY,
      JSON.stringify({ flags: remoteFlags, timestamp: Date.now() })
    );
  } catch {
    DEFAULT_FLAGS.forEach((f) => {
      if (!_flags.has(f.key)) _flags.set(f.key, f);
    });
  }
}

export function isFeatureEnabled(key: string): boolean {
  const flag = _flags.get(key);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.rolloutPercentage !== undefined) {
    const hash = simpleHash(key) % 100;
    if (hash >= flag.rolloutPercentage) return false;
  }
  return true;
}

export function getVariant(key: string): string | null {
  const flag = _flags.get(key);
  if (!flag?.enabled || !flag.variants) return null;
  const hash = simpleHash(key) % 100;
  let cumulative = 0;
  for (const [variant, pct] of Object.entries(flag.variants)) {
    cumulative += pct;
    if (hash < cumulative) return variant;
  }
  return null;
}

export function trackExposure(key: string) {
  analytics.trackEvent('feature_flag_exposure', { key, enabled: isFeatureEnabled(key) });
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
