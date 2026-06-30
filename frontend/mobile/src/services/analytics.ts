import { Config } from '@constants/config';

type EventName = 'screen_view' | 'send_initiated' | 'send_completed' | 'send_failed' | 'login' | 'logout' | 'error' | 'biometric_auth' | 'feature_flag_exposure' | 'privacy_consent_given';

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

class AnalyticsService {
  private enabled = false;
  private optOut = false;

  setOptOut(value: boolean) {
    this.optOut = value;
  }

  init() {
    if (Config.SENTRY_DSN) {
      this.enabled = true;
    }
  }

  trackScreen(name: string) {
    this.log({ name: 'screen_view', properties: { screen: name }, timestamp: Date.now() });
  }

  trackEvent(name: EventName, properties?: Record<string, string | number | boolean>) {
    this.log({ name, properties, timestamp: Date.now() });
  }

  trackError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    if (this.enabled && Config.SENTRY_DSN) {
      this.sendToSentry(message, stack);
    }
    console.warn('[Analytics]', message);
  }

  private log(event: AnalyticsEvent) {
    if (!this.enabled || this.optOut) return;
    try {
      const body = JSON.stringify(event);
      fetch(`${Config.API_BASE_URL.replace('/v1', '')}/v1/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch { }
  }

  private sendToSentry(message: string, stack?: string) {
    const payload = {
      event: 'exception',
      timestamp: new Date().toISOString(),
      message,
      stack,
      platform: 'mobile',
      version: Config.APP_VERSION,
      environment: __DEV__ ? 'development' : 'production',
      dsn: Config.SENTRY_DSN,
    };
    fetch(Config.SENTRY_DSN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

export const analytics = new AnalyticsService();
