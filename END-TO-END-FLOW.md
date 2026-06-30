# NgoenSai (ເງິນຊາຍ) — End-to-End Platform Overview

> Cross-border remittance platform for Lao migrant workers in Thailand.
> Send money from Thailand (THB) to Laos (LAK) via BCEL cash pickup, 7-Eleven, village agents, mobile top-up, or BCEL wallet.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Platform Components](#2-platform-components)
3. [Data Flow & Communication](#3-data-flow--communication)
4. [User Journey — Complete Walkthrough](#4-user-journey--complete-walkthrough)
5. [Feature Deep Dive](#5-feature-deep-dive)
6. [Frontend ↔ Backend API Contract](#6-frontend--backend-api-contract)
7. [Starting & Stopping Servers](#7-starting--stopping-servers)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo/RN)                     │
│  React Native 0.73 · TypeScript · React Navigation 6       │
│  i18next (en/lo/th) · Axios HTTP · WebSocket (FX rates)    │
│  expo-secure-store · expo-notifications · expo-camera      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST (JSON) + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Go / Gin v1.9)                    │
│  Routes → Middleware → Services → Core Models → Repos      │
│  JWT auth · Rate limiter · Fraud detection · CORS          │
└───────┬──────────┬──────────┬──────────┬───────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
   PostgreSQL   Redis 7   RabbitMQ    MinIO (S3)
   (in-memory  (OTP, FX   (payout,   (KYC docs,
    in dev)    cache,     notif,     receipts)
               sessions)  retry Q)
        │
        ▼
   External APIs (mocked in dev):
   ─ Kasikorn Bank (THB payment confirmation)
   ─ BCEL (LAK payout / cash pickup)
   ─ 7-Eleven (LAK cash pickup)
   ─ Unitel / Lao Telecom (mobile top-up)
   ─ TrueMoney Wallet (payment)
   ─ LINE / FCM / HMS (notifications)

┌─────────────────────────────────────────────────────────────┐
│              Admin Dashboard (React + Vite)                 │
│  React 18 · React Router 6 · Recharts · Axios              │
│  Pages: Dashboard, Transactions, Treasury, Agents,         │
│         Compliance (Sanctions Screening)                    │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile Framework | React Native (Expo SDK 50) | 0.73.4 |
| Mobile Language | TypeScript | 5.3 |
| Backend Language | Go | 1.22 |
| HTTP Framework | Gin | 1.9.1 |
| Auth | JWT (golang-jwt) | 5.2 |
| Mobile DB | AsyncStorage (local), SecureStore (tokens) | — |
| Backend DB | PostgreSQL (in-memory map in dev) | — |
| Cache | Redis 7 | 9.3 |
| Message Queue | RabbitMQ (amqp091-go) | 1.9 |
| Object Storage | MinIO (S3-compatible) | 7.0 |
| Admin UI | React + Vite | Vite 8 |
| Admin Charts | Recharts | 2.10 |
| Mobile HTTP | Axios | 1.6 |
| Mobile i18n | i18next + react-i18next | 23/13 |

---

## 2. Platform Components

### 2.1 Mobile App (`frontend/mobile/`)

**Entry Point:** `App.tsx` — wraps everything in `SafeAreaProvider` → `AuthProvider` → `NavigationContainer` → `RootNavigator`. Initializes WebSocket connection and push notification channels on mount.

```typescript
// App.tsx — Root component hierarchy
<SafeAreaProvider>
  <AuthProvider>         // ← auth state + context
    <NavigationContainer>
      <RootNavigator />  // ← conditional: Auth or Main stack
      <StatusBar />
    </NavigationContainer>
  </AuthProvider>
</SafeAreaProvider>
```

**Navigation Structure:**

```
RootNavigator (NativeStack)
├── [unauthenticated] Auth (NativeStack)
│   ├── Splash    → Language selection (lo/th/en)
│   ├── Login     → Phone input → register API → navigate to OTP
│   └── OTP       → 6-digit code → verify API → get JWT → authenticated
│
└── [authenticated] Main (BottomTab)
│   ├── Home      → Rate banner, quick send, recent tx list
│   ├── History   → Paginated transaction list
│   └── Profile   → User info, KYC badge, settings, logout
│
└── [authenticated] Send (NativeStack, modal)
│   ├── Amount        → Custom keypad, suggested amounts
│   ├── Recipient     → Saved recipients or new entry
│   ├── PayoutMethod  → BCEL cash / 7-Eleven / Agent / Mobile top-up / BCEL wallet
│   ├── Confirm       → Summary + pay button
│   ├── QR            → PromptPay QR code, 15-min countdown
│   └── Success       → Confetti, share via LINE/WhatsApp, track
│
└── [authenticated] Modals
    ├── TransactionDetail → Amount, timeline, status, receipt sharing
    ├── AgentDashboard    → Agent operations (cash in/out, float)
    └── AutosendSettings  → Recurring send configuration
```

**17 Screens Total:**

| Screen | File | Purpose |
|--------|------|---------|
| SplashScreen | `screens/SplashScreen.tsx` | Language picker, first screen |
| LoginScreen | `screens/LoginScreen.tsx` | Phone input, OTP request, **Demo Mode button** |
| OTPScreen | `screens/OTPScreen.tsx` | 6-digit OTP input, resend timer, call me |
| HomeScreen | `screens/HomeScreen.tsx` | Dashboard: rate, autosend banner, send card, quick actions, recent tx |
| AmountScreen | `screens/AmountScreen.tsx` | Custom keypad, suggested amounts, live LAK preview |
| RecipientScreen | `screens/RecipientScreen.tsx` | Saved recipients list, new recipient form |
| PayoutMethodScreen | `screens/PayoutMethodScreen.tsx` | 5 payout options, nearest pickup locations |
| ConfirmScreen | `screens/ConfirmScreen.tsx` | Full summary: amounts, fees, recipient, method |
| QRScreen | `screens/QRScreen.tsx` | PromptPay QR, 15-min timer, payment progress indicator |
| SuccessScreen | `screens/SuccessScreen.tsx` | Confetti animation, share via LINE/WhatsApp, track |
| HistoryScreen | `screens/HistoryScreen.tsx` | FlatList paginated tx history |
| TransactionDetailScreen | `screens/TransactionDetailScreen.tsx` | Full detail + timeline with timestamps |
| ProfileScreen | `screens/ProfileScreen.tsx` | Avatar, KYC level, language picker, rate alerts modal, support chat, logout |
| AgentDashboardScreen | `screens/AgentDashboardScreen.tsx` | Agent cash in/out, float balance |
| AutosendSettingsScreen | `screens/AutosendSettingsScreen.tsx` | Recurring send configuration |
| QRScannerScreen | `screens/QRScannerScreen.tsx` | Camera-based QR scanner for pickup confirmation |
| RecipientPhotoCapture | `screens/RecipientPhotoCapture.tsx` | Agent captures recipient photo as proof |

### 2.2 Backend (`backend/`)

**Entry Point:** `cmd/server/main.go`

```
main()
├── config.Load()                    ← reads env vars (PORT, DATABASE_URL, REDIS_URL, etc.)
├── repositories.NewPostgres(url)    ← in-memory map (dev) or real PostgreSQL
├── repositories.NewRedis(url)       ← Redis client for OTP + FX cache
├── repositories.NewQueue(url)       ← RabbitMQ channel for async jobs
├── minio.New(...)                   ← S3-compatible object storage
│
├── services/auth.New(pg, redis, minio, cfg)
├── services/fx.New(redis, cfg)      ← FX rate engine
├── services/payment.New(pg, redis, queue, fx, cfg)
├── services/payout.New(pg, queue, notif, cfg)
├── services/agent.New(pg, redis, cfg)
├── services/compliance.New(pg, cfg)
├── services/treasury.New(pg, fx, cfg)
├── services/autosend.New(pg, payment, fx, cfg)
├── services/notification.New(queue, redis, cfg)
│
├── r := gin.Default()
├── r.Use(CORS, RateLimiter, RequestLogger)
├── routes.RegisterAuth(r, authSvc)
├── routes.RegisterPayment(r, paymentSvc, authSvc)
├── routes.RegisterPayout(r, payoutSvc, authSvc)
├── routes.RegisterFX(r, fxSvc, authSvc)
├── routes.RegisterAgent(r, agentSvc, authSvc)
├── routes.RegisterTreasury(r, treasurySvc, authSvc)
├── routes.RegisterWebhooks(r, paymentSvc, payoutSvc)
├── routes.RegisterAdmin(r, authSvc, treasurySvc, complianceSvc)
│
├── r.Use(FraudVelocityCheck)        ← global fraud detection middleware
├── treasurySvc.StartAutoConversion()  ← background THB→LAK conversion
├── autosendSvc.StartScheduler()       ← recurring send processor
└── r.Run(":8080")
```

**3-Layer Architecture:**

```
routes/        → HTTP handlers, request parsing, response formatting
services/      → Business logic, external API calls, orchestration
repositories/  → Data access (PostgreSQL, Redis, RabbitMQ)
core/          → Domain models (User, Transaction, Agent, etc.)
schemas/       → Request/response DTOs
common/        → Middleware (auth, CORS, rate limiter, fraud check)
migrations/    → SQL schema migrations
```

### 2.3 Admin Dashboard (`frontend/admin/`)

React + Vite SPA with 5 pages:

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/dashboard` | Stats grid (volume, tx count, agents, revenue), FX chart, volume chart, recent tx table |
| Transactions | `/transactions` | All transactions table with search, status filter, pagination |
| Treasury | `/treasury` | Kasikorn THB balance, BCEL LAK balance, FX position, daily reconciliation |
| Agents | `/agents` | Agent list, float balances, commission tracking, registration |
| Compliance | `/compliance` | Sanctions screening, AML checks, flagged transactions, SAR reports |

---

## 3. Data Flow & Communication

### 3.1 HTTP API Communication

The mobile app communicates with the backend exclusively via **REST over JSON** using Axios.

```typescript
// frontend/mobile/src/constants/config.ts
export const Config = {
  API_BASE_URL: __DEV__
    ? 'http://192.168.1.100:8080/v1'    // ← development
    : 'https://api.ngoensai.la/v1',     // ← production
};
```

**Axios Client Configuration (`api.ts`):**

```typescript
class ApiService {
  client = axios.create({
    baseURL: Config.API_BASE_URL,   // e.g. http://192.168.1.100:8080/v1
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: attaches Bearer JWT from SecureStore
  // Response interceptor: auto-refreshes on 401, retries original request
}
```

**Request Flow:**

```
Mobile App                          Backend
    │                                  │
    │ POST /v1/auth/register           │
    │ { phone, country_code, language } │
    │─────────────────────────────────>│
    │                                  ├─ Generate 6-digit OTP
    │                                  ├─ Store in Redis (5-min TTL)
    │                                  └─ (Sandbox: OTP = 999999)
    │ <── { status: "otp_sent" } ──────│
    │                                  │
    │ POST /v1/auth/verify             │
    │ { phone, otp, device_id }        │
    │─────────────────────────────────>│
    │                                  ├─ Check OTP from Redis
    │                                  ├─ Create user if new
    │                                  ├─ Generate JWT pair (15m + 30d)
    │                                  └─ Store refresh token in Redis
    │ <── { access_token, refresh_token, expires_in, user } ──│
    │                                  │
    │ Stores tokens in SecureStore     │
    │ Sets axios default Authorization │
    │ header for subsequent requests   │
    │                                  │
    │ POST /v1/quote                   │  (with Bearer token)
    │ { source_amount, payout_method }  │
    │─────────────────────────────────>│
    │                                  ├─ FX service gets current rate
    │                                  ├─ Calculate target + fees
    │                                  └─ Return QuoteResponse
    │ <── { quote_id, exchange_rate,   │
    │       target_amount, payout_options,
    │       rate_expires_at } ─────────│
```

**Demo Mode (development/testing only):**

When `api.enableDemoMode()` is called, every API method returns mock data directly without making HTTP requests. This is triggered by the "Demo Mode (Skip Login)" button on the LoginScreen.

### 3.2 WebSocket Communication

The app connects to a WebSocket endpoint for real-time FX rate updates.

```typescript
// websocket.ts — Connects at ws://<API_BASE_URL>/ws/fx
// Auto-reconnects every 5 seconds on disconnect

// Message format received:
{
  "type": "fx_rate",
  "payload": {
    "rate": 575.0,
    "mid_market": 578.5,
    "spread": 3.5,
    "updated": "2024-01-15T10:30:00Z"
  }
}
```

### 3.3 Push Notification Flow

```
payment confirmed (webhook)
        │
        ▼
Backend processes payout
        │
        ├─ Enqueues SMS via RabbitMQ (notification.send queue)
        ├─ Enqueues push via FCM/HMS (notification.send queue)
        │
        ▼
Notification service reads from queue
        ├─ SMS: Placeholder (dev) or Lao SMS API (prod)
        └─ Push: FCM (Android) / HMS (Huawei)

Mobile app receives push via expo-notifications
```

### 3.4 Async Job Queue (RabbitMQ)

4 queues declared in `repositories/queue.go`:

| Queue | Routing Key | Purpose |
|-------|-------------|---------|
| `payout.initiate` | `payout.initiate` | Trigger payout after payment confirmed |
| `payout.retry` | `payout.retry` | Retry failed payouts |
| `notification.send` | `notification.send` | Outbound SMS + push notifications |
| `agent.payout_notify` | `agent.payout_notify` | Notify agents of pending cash payouts |

Flow: Payment confirmed → `enqueuePayout(ref)` → RabbitMQ → Payout service picks up → calls BCEL/7-Eleven/telco API → enqueues notification → SMS + push sent.

### 3.5 Authentication Flow

```
1. SEND OTP
   Mobile → POST /v1/auth/register { phone, country_code, language }
   Server → Generates 6-digit OTP (crypto/rand)
            Stores in Redis with 5-min TTL
            In sandbox: always "999999"
   Response → { status: "otp_sent", retry_after_seconds: 60 }

2. VERIFY OTP
   Mobile → POST /v1/auth/verify { phone, otp, device_id, fcm_token }
   Server → Checks Redis OTP (max 5 attempts)
            Creates user if phone not found (role=sender, kyc=unverified)
            Generates JWT access token (15-min expiry, claims: sub, phone, role, kyc)
            Generates JWT refresh token (30-day expiry)
            Stores refresh token in Redis
   Response → { access_token, refresh_token, expires_in: 900, user: { id, phone, name, kyc_level, is_new } }

3. AUTHENTICATED REQUESTS
   Mobile → Authorization: Bearer <access_token>
   Server → AuthRequired middleware: validates JWT signature + expiry
            Sets c.Set("user", &core.User{...}) for downstream handlers

4. TOKEN REFRESH
   Mobile → When API returns 401 → POST /v1/auth/refresh { refresh_token }
   Server → Validates refresh JWT, checks Redis for stored token
            Issues new access + refresh token pair
```

---

## 4. User Journey — Complete Walkthrough

### Phase 1: Onboarding & Authentication

```
User opens app
    │
    ▼
SplashScreen
    ├─ Shows "NgoenSai" logo + tagline
    ├─ 3 language buttons: ລາວ / ไทย / English
    └─ User taps "English"
          │
          ▼
    changeLanguage('en') ← persisted to AsyncStorage
    navigation.replace('Login')
          │
          ▼
LoginScreen
    ├─ Country code input (default: +856)
    ├─ Phone number input
    └─ "Send OTP" button
          │
          ├─ User enters phone → POST /v1/auth/register
          │                       → navigation.navigate('OTP')
          │
          └─ "Demo Mode (Skip Login)" button  (dev only)
                │
                ├─ api.enableDemoMode() ← all subsequent API calls use mock data
                ├─ i18n.changeLanguage('en') ← force English
                ├─ Sets mock user { id: 'demo-001', name: 'Demo User', kyc: 'level_2' }
                └─ isAuthenticated = true → navigates directly to Main/Home
                      │
                      ▼
                  HomeScreen (with mock data)
          │
          ▼
OTPScreen
    ├─ 6-digit input fields (auto-advance)
    ├─ Resend timer (60s countdown)
    ├─ "Call Me" voice OTP option
    └─ User enters OTP → POST /v1/auth/verify
                            │
                            ├─ JWT stored in SecureStore
                            ├─ isAuthenticated = true
                            └─ Navigation switches from Auth → Main
```

### Phase 2: Home Dashboard

```
HomeScreen
    │
    ├─ Rate Banner (top)
    │   ├─ GET /v1/fx/rate → { rate: 575.0, mid_market: 578.5 }
    │   ├─ Also listens via WebSocket for real-time updates
    │   └─ Shows "1 THB = 575 LAK"
    │
    ├─ Autosend Banner
    │   ├─ Shows next scheduled send
    │   └─ Tap → AutosendSettingsScreen
    │
    ├─ "Send to Laos" Card (prominent CTA)
    │   └─ Tap → navigation.navigate('Send', { screen: 'Amount' })
    │
    ├─ Quick Actions (horizontal scroll)
    │   ├─ Saved recipients as avatar circles
    │   └─ Tap → pre-fills recipient → Amount screen
    │
    └─ Recent Transactions (last 5)
        ├─ GET /v1/transactions?page=1&limit=5
        ├─ Each row: avatar, name, status badge, amount
        └─ Tap → TransactionDetailScreen
```

### Phase 3: Send Money Flow (6 screens)

```
Step 1: AmountScreen
    ├─ Custom numeric keypad (no system keyboard)
    ├─ Suggested amounts: 3,000 / 5,000 / 10,000 THB
    ├─ Live LAK conversion preview (GET /v1/quote)
    ├─ "Rate locked for 15 minutes" badge
    └─ "Next" → POST /v1/quote → navigate('Recipient', { quote })
          │
          ▼
Step 2: RecipientScreen
    ├─ "Saved Recipients" list (from local state / API)
    ├─ "New Recipient" form: name, phone, province, relationship
    └─ "Select" → navigate('PayoutMethod', { quote, recipient })
          │
          ▼
Step 3: PayoutMethodScreen
    ├─ 5 options with RECOMMENDED badge on one:
    │   ├─ BCEL Cash Pickup (recommended)
    │   ├─ 7-Eleven Pickup
    │   ├─ Village Agent
    │   ├─ Mobile Top-Up (Unitel/Lao Telecom)
    │   └─ BCEL Wallet
    │
    ├─ Each shows: pickup time, target amount adjustment
    ├─ "Nearest Pickup Locations" section (map/addresses)
    └─ "Confirm" → navigate('Confirm', { quote, recipient, payoutMethod })
          │
          ▼
Step 4: ConfirmScreen
    ├─ Summary card:
    │   ├─ Sending: 5,000 THB
    │   ├─ Receiving: ~6,250 LAK
    │   ├─ Exchange Rate: 1 THB = 1.25 LAK
    │   ├─ Mid-market: 1.27 LAK
    │   └─ Fee breakdown
    ├─ Recipient info
    ├─ Payout method info
    └─ "Pay Now" → POST /v1/transactions/send
                    { quote_id, recipient, payout_method, payment_method, idempotency_key }
                    │
                    ▼
              Response: { transaction_ref, status: "awaiting_payment",
                          payment: { method: "promptpay_qr", qr_code: "...",
                                     amount: 5000, expires_at: "..." } }
                    │
                    ▼
Step 5: QRScreen
    ├─ Displays PromptPay QR code (react-native-qrcode-svg)
    ├─ 15-minute countdown timer (payment window)
    ├─ "Waiting for payment..." animated indicator
    ├── Instructions: "Open bank app > Scan QR > Confirm payment"
    ├─ "Share QR" button (native share sheet)
    └─ "I Have Paid" button → navigates to SuccessScreen
          │
          ▼
Step 6: SuccessScreen
    ├─ Confetti animation (custom component)
    ├─ Green checkmark circle
    ├─ "Money Sent! 🎉" title
    ├─ Summary: amount, recipient name, pickup code, ref
    ├─ "Share via LINE" / "Share via WhatsApp" buttons
    └─ 3 action buttons:
        ├─ "Track Transaction" → TransactionDetailScreen
        ├─ "Send Again" → AmountScreen
        └─ "Done" → HomeScreen
```

### Phase 4: Post-Send (Payout Processing)

```
Backend after user clicks "I Have Paid" (or webhook received):
    │
    ├─ POST /v1/webhooks/payment/confirmed (from Kasikorn)
    │   { transaction_ref, provider_ref, status: "success" }
    │   Header: X-Signature (HMAC-SHA256)
    │
    ├─ payment.ConfirmPayment(ref, providerRef)
    │   ├─ Updates transaction: payment_status = "received", paid_at = now
    │   └─ enqueuePayout(ref) → RabbitMQ (payout.initiate)
    │
    ├─ payout.ProcessPayout(ref)  ← picked up from queue
    │   ├─ Reads transaction
    │   ├─ Switch on PayoutMethod:
    │   │
    │   │   ├─ bcel_cash:
    │   │   │   ├─ Generate pickup code (6 digits)
    │   │   │   ├─ "Call" BCEL API (returns hardcoded response in dev)
    │   │   │   ├─ Update payout_status = "completed"
    │   │   │   └─ SMS recipient: "ເງິນສົ່ງຈາກ X ຈຳນວນ Y ກີບ ພ້ອມຮັບແລ້ວ! ໄປຮັບທີ່ BCEL: ໃຊ້ລະຫັດ Z + ເບີໂທ W"
    │   │   │
    │   │   ├─ seven_eleven_cash:
    │   │   │   ├─ Generate pickup code
    │   │   │   ├─ "Call" 7-Eleven API
    │   │   │   └─ SMS recipient with pickup info
    │   │   │
    │   │   ├─ mobile_topup:
    │   │   │   ├─ "Call" Unitel/Lao Telecom API
    │   │   │   └─ SMS: "ທ່ານໄດ້ຮັບເງິນເຕີມໂທລະສັບ Y ກີບ"
    │   │   │
    │   │   ├─ agent_cash:
    │   │   │   ├─ Notify agent via RabbitMQ
    │   │   │   └─ Update payout_status = "initiated" (waiting for agent)
    │   │   │
    │   │   └─ bcel_wallet:
    │   │       ├─ "Call" BCEL Wallet API
    │   │       └─ Update payout_status = "completed"
    │   │
    │   └─ On failure:
    │       ├─ Update payout_status = "failed"
    │       ├─ Save audit log
    │       └─ Enqueue retry (payout.retry queue)
    │
    └─ Push notification to sender: "ເງິນພ້ອມຮັບແລ້ວ" / "Money ready for pickup"
```

### Phase 5: Transaction History & Details

```
User views history:
    │
    ├─ HistoryScreen (FlatList, pull-to-refresh)
    │   ├─ GET /v1/transactions?page=1&limit=20
    │   └─ Each item: avatar, name, ref, status, amounts
    │
    └─ TransactionDetailScreen
        ├─ GET /v1/transactions/:ref
        ├─ Amount card: source (red) / target (green) / rate
        ├─ Info card: ref, recipient, phone, status, pickup code
        └─ Timeline card:
            ├─ ● Sent (timestamp) ── ● Paid (timestamp) ── ● Ready ── ● Picked Up (timestamp)
            └─ Active step highlighted in primary color
```

---

## 5. Feature Deep Dive

### 5.1 FX Rate Engine

**Backend** (`services/fx/fx.go`):

- **Source**: Mocked in dev (random: 575.0 + rand.Float64()*6). In production, fetches from Kasikorn Bank.
- **Refresh**: Every 15 minutes via `StartRateUpdater()` ticker.
- **Spread**: Configurable `FXSpreadLAK = 3.0 LAK`. Our rate = mid-market - spread.
- **Locking**: When user gets a quote, rate is locked in Redis for 15 minutes (`fx:lock:{txRef}`).
- **Caching**: Current rate cached in Redis with 20-min TTL (`fx:current_rate`).

**Mobile**: 
- Fetches rate on HomeScreen load and AmountScreen load via `GET /v1/quote`
- WebSocket for real-time updates (displays in rate banner)
- Rate shown as "1 THB = {rate} LAK"

### 5.2 Payment Methods (4 options)

| Method | Description | Backend Implementation |
|--------|-------------|----------------------|
| `promptpay_qr` | QR code for Thai bank apps | Generates mock PromptPay payload with merchant_id from config |
| `bank_transfer` | Direct bank transfer | Placeholder |
| `truemoney` | TrueMoney Wallet | Constructs TrueMoney payment URL with merchant_key |
| `agent_cash` | Pay cash at agent location | Generates agent_code and Lao-language instructions |

### 5.3 Payout Methods (5 options)

| Method | Recipient Action | Fee Adjustment |
|--------|-----------------|----------------|
| `bcel_cash` | Go to BCEL branch with pickup code + phone | Standard rate |
| `seven_eleven_cash` | Go to 7-Eleven with pickup code | -10,000 LAK from target |
| `agent_cash` | Visit village agent | Standard rate (agent notified via queue) |
| `mobile_topup` | Auto-loaded to phone | -3% from target |
| `bcel_wallet` | Received in BCEL mobile wallet | Standard rate |

### 5.4 Agent Network

**Agent types:** `cash_in_agent` (Thailand, collects THB) and `cash_out_agent` (Laos, disburses LAK).

**Agent operations:**
- **Register**: POST `/v1/agents/register` — shop details, location, type
- **Cash In** (agent collects THB from sender): POST `/v1/agents/cash-in` — deducts from agent float
- **Cash Out** (agent pays LAK to recipient): POST `/v1/agents/cash-out` — deducts from agent float
- **Float Management**: POST `/v1/agents/float/deposit` — top up float, tracks balance history

**Agent float** is the pre-funded LAK balance that agents hold to pay out recipients. Float transactions are logged for audit.

### 5.5 Autosend (Recurring Transfers)

**Backend** (`services/autosend/autosend.go`):

- `StartScheduler()` runs every hour, checks for due autosends
- Supported frequencies: `weekly`, `biweekly`, `monthly`
- On trigger: gets FX rate, initiates payment via `InitiatePayment()`, updates last_sent/next_send
- Deactivates on failure after retries

**Mobile**: AutosendSettingsScreen allows configuring recipient, amount, frequency, and payout method.

### 5.6 Treasury & Reconciliation

**Backend** (`services/treasury/treasury.go`):

- **Auto Conversion**: When daily THB volume exceeds 100,000 THB, automatically converts 80% to LAK
- **Daily Reconciliation**: POST `/v1/treasury/reconciliation` — matches bank statement vs system records
- **Balance Summary**: Returns Kasikorn THB balance, BCEL LAK balance, FX position (pending sells, avg locked rate, unrealized P&L)

### 5.7 Compliance & Fraud Detection

**AML Checks** (`services/compliance/compliance.go`):
- Amount threshold check (>50,000 THB flagged)
- Device ID validation (missing device ID flagged)
- Sanctions screening (POST `/v1/admin/sanctions/check`) — returns clear/flagged
- SAR (Suspicious Activity Report) generation

**Fraud Engine** (`middleware/fraud_check.go`):
- **Velocity Check**: Max 5 transactions per user per hour (configurable)
- **Amount Roundness**: Flags transactions >10,000 where amount is round (mod 1000 === 0)
- Applied globally via Gin middleware after auth

### 5.8 Webhooks

**Kasikorn Bank Webhook** (`/webhooks/kasikorn`):
- Receives payment confirmation from Kasikorn
- Verifies HMAC-SHA256 signature via `X-Signature` header
- Updates payment status, triggers payout

**Internal Webhooks** (`/v1/webhooks/payment/confirmed`, `/v1/webhooks/payout/completed`):
- Used by internal services or partner systems
- Same signature verification flow

### 5.9 KYC (Know Your Customer)

- **Levels**: `unverified` → `level_1` → `level_2` → `level_3`
- **Documents**: ID card, work permit, selfie photo
- **Storage**: Uploaded to MinIO (S3) at `kyc/{userID}/{docType}/{timestamp}_document.jpg`
- **Presigned URLs**: For secure document viewing, 1-hour expiry

### 5.10 Demo Mode (Development)

Activated by "Demo Mode (Skip Login)" button or programmatically via `api.enableDemoMode()`:

```
What changes:
├─ api.register() → returns { data: { message: 'OTP sent (demo)' } }
├─ api.verify() → returns hardcoded AuthResponse with demo user
├─ api.getQuote() → returns mock quote with calculated target amount
├─ api.send() → returns mock transaction with generated ref
├─ api.getHistory() → returns 3 mock transactions (various statuses)
├─ api.getTransaction() → returns mock completed transaction
├─ api.tryRefreshToken() → returns true
├─ api.logout() → no-op
├─ JWT interceptor → skipped (no SecureStore calls)
└─ 401 interceptor → skipped (pass-through)
```

---

## 6. Frontend ↔ Backend API Contract

### 6.1 Complete Endpoint Reference

#### Auth (no auth required)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/auth/register` | `{"phone":"...","country_code":"...","language":"..."}` | `{"status":"otp_sent","retry_after_seconds":60}` | Send OTP to phone |
| `POST` | `/v1/auth/verify` | `{"phone":"...","otp":"...","device_id":"...","fcm_token":"..."}` | `{"access_token":"...","refresh_token":"...","expires_in":900,"user":{...}}` | Verify OTP, get JWT |
| `POST` | `/v1/auth/refresh` | `{"refresh_token":"..."}` | `{"access_token":"...","refresh_token":"..."}` | Refresh expired JWT |
| `GET` | `/v1/fx/rate` | — | `{"rate":575.0,"mid_market":578.5,"spread":3.5,"currency":"THB_LAK"}` | Current FX rate |

#### Payment & Quotes (auth required: `Authorization: Bearer <token>`)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/quote` | `{"source_amount":5000,"source_currency":"THB","target_currency":"LAK","payout_method":"bcel_cash","recipient_phone":"..."}` | `{"quote_id":"...","source_amount":5000,"exchange_rate":1.25,"target_amount":6250,"fee_breakdown":{...},"payout_options":[...],"rate_expires_at":"..."}` | Get transfer quote |
| `POST` | `/v1/transactions/send` | `{"idempotency_key":"...","quote_id":"...","recipient":{"phone":"...","name":"...","relationship":"...","province":"..."},"payout_method":"bcel_cash","payment_method":"promptpay_qr"}` | `{"transaction_ref":"...","status":"awaiting_payment","payment":{"method":"promptpay_qr","qr_code":"...","amount":5000,"expires_at":"..."}}` | Initiate payment |
| `GET` | `/v1/transactions?page=1&limit=20` | — | `{"transactions":[...],"total":50,"page":1,"limit":20}` | List transactions |
| `GET` | `/v1/transactions/:ref` | — | `{transaction object}` | Get single transaction |

#### Payout (auth required)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/payouts/process` | `{"transaction_ref":"..."}` | `{"status":"payout_initiated"}` | Manually trigger payout |
| `POST` | `/v1/payouts/confirm-pickup` | `{"pickup_code":"..."}` | `{"status":"collected"}` | Confirm cash pickup |

#### FX (auth required)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/fx/rate/lock` | `{"transaction_ref":"...","rate":575.0}` | `{"status":"locked"}` | Lock FX rate for transaction |
| `GET` | `/v1/fx/rate/lock/:tx_ref` | — | `{"rate":575.0}` | Get locked rate |

#### Agent (auth required)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/agents/register` | `{"shop_name":"...","shop_address":"...","shop_province":"...","shop_lat":...,"shop_lng":...,"country":"TH","agent_type":"cash_out_agent"}` | `{"status":"registered","agent_id":"..."}` | Register new agent |
| `POST` | `/v1/agents/cash-in` | `{"agent_id":"...","amount_thb":...,"sender_phone":"...","recipient_phone":"..."}` | `{"status":"cash_in_ok","reference":"..."}` | Agent collects THB |
| `POST` | `/v1/agents/cash-out` | `{"agent_id":"...","amount_lak":...,"recipient_phone":"..."}` | `{"status":"cash_out_ok","reference":"..."}` | Agent pays LAK |
| `POST` | `/v1/agents/float/deposit` | `{"agent_id":"...","amount":...,"method":"bank_transfer"}` | `{"status":"deposited"}` | Deposit agent float |

#### Treasury (auth required)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `GET` | `/v1/treasury/balances` | — | `{"kasikorn_thb":8450000,"bcel_lak":452000000,"fx_position":{...}}` | Treasury balances |
| `POST` | `/v1/treasury/reconciliation` | — | `{"status":"reconciliation_completed"}` | Run daily reconciliation |

#### Admin (no auth in dev)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/admin/login` | `{"username":"...","password":"..."}` | `{"access_token":"...","refresh_token":"...","expires_in":3600}` | Admin login |
| `GET` | `/v1/admin/stats` | — | `{"today_volume":"...","transactions_today":"...","active_agents":...,"revenue_today":"...","total_users":...}` | Dashboard stats |
| `GET` | `/v1/admin/treasury` | — | *balance summary* | Admin treasury view |
| `POST` | `/v1/admin/sanctions/check` | `{"name":"..."}` | `{"status":"clear"}` or `{"status":"flagged","reason":"..."}` | Sanctions screening |

#### Webhooks (X-Signature HMAC-SHA256)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/v1/webhooks/payment/confirmed` | `{"transaction_ref":"...","provider_ref":"...","status":"success"}` | `{"status":"confirmed"}` | Payment confirmed |
| `POST` | `/v1/webhooks/payout/completed` | `{"transaction_ref":"...","status":"success"}` | `{"status":"completed"}` | Payout completed |
| `POST` | `/webhooks/kasikorn` | Same as payment/confirmed | Same | Kasikorn bank webhook alias |

### 6.2 Data Models

**User (`core/user.go`):**
```go
type User struct {
    ID          string    // "USR-1"
    Phone       string    // "+856205551234"
    CountryCode string    // "+856"
    Name        string    // "Souliphone Chanthavong"
    Role        UserRole  // "sender" | "recipient" | "agent" | "admin"
    KYCLevel    KYCLevel  // "unverified" | "level_1" | "level_2" | "level_3"
    Language    string    // "lo" | "th" | "en"
    IsActive    bool
    IsLocked    bool
}
```

**Transaction (`core/transaction.go`):**
```go
type Transaction struct {
    TransactionRef  string        // "TXN-20240115-1"
    IdempotencyKey  string        // UUID for dedup
    SenderID        string
    SourceCurrency  string        // "THB"
    SourceAmount    float64
    TargetCurrency  string        // "LAK"
    TargetAmount    int64
    ExchangeRate    float64
    PaymentMethod   PaymentMethod // "promptpay_qr" | "truemoney" | etc.
    PaymentStatus   PaymentStatus // "pending" | "received" | "failed" | "refunded" | "expired"
    PayoutMethod    PayoutMethod  // "bcel_cash" | "seven_eleven_cash" | etc.
    PayoutStatus    PayoutStatus  // "pending" | "initiated" | "completed" | "failed" | "refunded"
    RecipientPhone  string
    RecipientName   string
    PickupCode      string        // 6-digit pickup code
    PaidAt          *time.Time
    CompletedAt     *time.Time
}
```

**Quote Request/Response (`schemas/payment.go`):**
```go
type QuoteRequest struct {
    SourceAmount   float64 // required
    SourceCurrency string  // default: "THB"
    TargetCurrency string  // default: "LAK"
    PayoutMethod   string  // required
    RecipientPhone string  // required
}

type QuoteResponse struct {
    QuoteID       string
    SourceAmount  float64
    ExchangeRate  float64
    TargetAmount  int64
    FeeBreakdown  FeeBreakdown   // { fx_margin, payout_fee, total_fee_percent }
    PayoutOptions []PayoutOption // [{ method, target_amount, pickup_time }]
    RateExpiresAt string         // ISO 8601
}
```

### 6.3 Error Response Format

```json
{
  "error": "description of what went wrong",
  "flagged": true
}
```

HTTP status codes used:
- `200` — Success
- `201` — Created
- `400` — Bad request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `429` — Too many requests (rate limit or fraud velocity check)
- `500` — Internal server error

---

## 7. Starting & Stopping Servers

### 7.1 Development Mode (Without Docker)

#### Prerequisites

| Dependency | Version | Purpose |
|-----------|---------|---------|
| Go | 1.22+ | Backend server |
| Node.js | 18+ (23.x has known issues with Expo) | Mobile + admin |
| PostgreSQL | 15+ | Database (optional in dev) |
| Redis | 7+ | OTP storage, FX cache |
| RabbitMQ | 3.x | Async job queue |
| MinIO | latest | KYC docs, receipts |

#### Starting the Backend

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start RabbitMQ
rabbitmq-server

# Terminal 3: Start MinIO (optional, needed for KYC uploads)
minio server ./data

# Terminal 4: Start PostgreSQL (optional — backend uses in-memory store by default)
# pg_ctl -D /usr/local/var/postgres start

# Terminal 5: Start Go backend
cd backend
export PORT=8080
export SANDBOX=true               # ← enables mock OTP "999999"
export JWT_SECRET="dev-secret"     # ← any value for dev
go run ./cmd/server/main.go
# Server starts at http://localhost:8080
```

> **Note:** The backend has an in-memory PostgreSQL implementation (`repositories/postgres.go`). In dev mode, no actual PostgreSQL is needed — data is stored in `sync.Map` and lost on restart.

#### Starting the Mobile App

```bash
# Terminal 6: Start Expo dev server
cd frontend/mobile
npx expo start --web --port 8082
# Opens at http://localhost:8082
```

> **Important for Node.js 23 users:** The Expo CLI has a bug on Windows where `node:sea` and `node:sqlite` built-in modules cause directory creation failures (colons in names). A patch is applied in `node_modules/@expo/cli/build/src/start/server/metro/externals.js` — replaces `:` with `_` in directory names.

#### Starting the Admin Dashboard

```bash
# Terminal 7: Start Vite dev server
cd frontend/admin
npm run dev
# Opens at http://localhost:5173
```

#### Stopping Everything

```bash
# Stop Go backend: Ctrl+C in Terminal 5
# Stop Expo: Ctrl+C in Terminal 6
# Stop Vite: Ctrl+C in Terminal 7
# Stop Redis: redis-cli shutdown
# Stop RabbitMQ: rabbitmqctl stop
# Stop MinIO: Ctrl+C
# Stop PostgreSQL: pg_ctl stop

# Or kill all at once (Unix):
pkill -f "go run ./cmd/server"
pkill -f "expo start"
pkill -f "vite"
redis-cli shutdown
rabbitmqctl stop
```

### 7.2 Development Mode (With Docker)

There is no Docker Compose file in the repository yet. The following is the recommended setup:

#### `docker-compose.yml` (for reference):

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ngoensai
      POSTGRES_USER: ngoensai
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"    # Console
    environment:
      MINIO_ROOT_USER: ngoensai
      MINIO_ROOT_PASSWORD: change-me-in-prod
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      PORT: "8080"
      ENV: "development"
      DATABASE_URL: "postgres://ngoensai:pass@postgres:5432/ngoensai?sslmode=disable"
      REDIS_URL: "redis:6379"
      RABBITMQ_URL: "amqp://guest:guest@rabbitmq:5672"
      MINIO_ENDPOINT: "minio:9000"
      MINIO_ACCESS_KEY: "ngoensai"
      MINIO_SECRET_KEY: "change-me-in-prod"
      MINIO_BUCKET: "ngoensai-docs"
      JWT_SECRET: "dev-secret-do-not-use-in-prod"
      SANDBOX: "true"
    depends_on:
      - postgres
      - redis
      - rabbitmq
      - minio

volumes:
  pgdata:
  miniodata:
```

**Starting with Docker:**

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Start only specific services (if you have local PostgreSQL/Redis)
docker-compose up backend redis
```

**Stopping Docker:**

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: destroys data)
docker-compose down -v

# Stop a specific service
docker-compose stop backend
```

### 7.3 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend HTTP port |
| `ENV` | `development` | Environment name |
| `DATABASE_URL` | `postgres://ngoensai:pass@localhost:5432/ngoensai` | PostgreSQL connection |
| `REDIS_URL` | `localhost:6379` | Redis address |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | RabbitMQ connection |
| `MINIO_ENDPOINT` | `minio.ngoensai.la:9000` | MinIO server |
| `MINIO_ACCESS_KEY` | `ngoensai` | MinIO access key |
| `MINIO_SECRET_KEY` | `change-me-in-prod` | MinIO secret key |
| `MINIO_BUCKET` | `ngoensai-docs` | MinIO bucket name |
| `JWT_SECRET` | `dev-secret-do-not-use-in-prod` | JWT signing key |
| `JWT_EXPIRY` | `15m` | Access token TTL |
| `SANDBOX` | `true` | Enable sandbox OTP (999999) |
| `FX_UPDATE_INTERVAL` | `15m` | FX rate refresh interval |
| `KASIKORN_API_KEY` | — | Kasikorn bank API key |
| `BCEL_API_KEY` | — | BCEL API key |
| `TRUEMONEY_KEY` | — | TrueMoney API key |

### 7.4 Quick Start (Minimal, No Dependencies)

To run the absolute minimum to test the app:

```bash
# Terminal 1: Start backend (in-memory, no external deps needed)
cd backend
go run ./cmd/server/main.go
# Works with in-memory PostgreSQL, but Redis is still required for OTP

# Quick fix — if you don't have Redis, you can edit
# backend/internal/repositories/redis.go to skip the ping check,
# or run Redis via Docker:
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: Start Expo mobile app
cd frontend/mobile
npx expo start --web --port 8082

# Open http://localhost:8082 → tap "Demo Mode (Skip Login)"
# All data is mock — no backend needed after demo mode is activated
```

> **Tip:** The demo mode on the mobile app (`api.enableDemoMode()`) makes ALL API calls return mock data. You can test the entire mobile UI flow end-to-end without any backend server running.

---

## Appendix: Key Files Reference

### Backend

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Server entrypoint, DI wiring |
| `config/config.go` | Environment configuration |
| `internal/routes/*.go` | 8 route files, 25+ endpoints |
| `internal/services/*/*.go` | 10 service packages |
| `internal/repositories/postgres.go` | In-memory data store (484 lines) |
| `internal/repositories/redis.go` | Redis client (OTP, cache) |
| `internal/repositories/queue.go` | RabbitMQ queue declarations |
| `internal/common/middleware/*.go` | Auth, CORS, rate limiter, fraud, logging |
| `internal/core/*.go` | User, Transaction, Agent, Autosend, Treasury, Compliance models |
| `internal/schemas/*.go` | Request/response DTOs |
| `migrations/*.sql` | 4 migration files, 13 tables |
| `tests/integration_test.go` | Integration tests |

### Mobile

| File | Purpose |
|------|---------|
| `App.tsx` | Root component, providers, init |
| `src/navigation/RootNavigator.tsx` | Auth-gated navigation |
| `src/navigation/SendNavigator.tsx` | 6-screen send flow |
| `src/services/api.ts` | Axios client + demo mode (164 lines) |
| `src/services/websocket.ts` | FX rate WebSocket |
| `src/services/notifications.ts` | Push notification registration |
| `src/hooks/useAuth.tsx` | Auth context, login, demoLogin |
| `src/i18n/index.ts` | i18n config (English default) |
| `src/i18n/en.json` | English translations (16 categories) |
| `src/i18n/lo.json` | Lao translations |
| `src/i18n/th.json` | Thai translations |

### Admin

| File | Purpose |
|------|---------|
| `src/App.tsx` | SPA shell with sidebar navigation |
| `src/pages/Dashboard.tsx` | Stats, charts, recent tx table |
| `src/pages/Transactions.tsx` | Transaction management |
| `src/pages/Treasury.tsx` | Balance + FX position |
| `src/pages/Agents.tsx` | Agent registry |
| `src/pages/Compliance.tsx` | AML/Sanctions screening |

## Appendix: Database Schema (PostgreSQL)

**13 tables** defined across 4 migration files:

1. `users` — Phone-authenticated users, roles, KYC levels
2. `kyc_documents` — User KYC docs stored in MinIO
3. `transactions` — Core transfer records with payment + payout tracking
4. `transaction_status_logs` — Audit trail for every status change
5. `agents` — Cash in/out agents with float management
6. `float_transactions` — Agent float balance history
7. `treasury_reconciliations` — Daily bank matching
8. `aml_checks` — Compliance screening records
9. `autosends` — Recurring transfer configuration
10. `webhook_events` — Incoming webhook logging
11. `sender_profiles` — Extended sender info (work permit, employer, referral)
12. `recipient_profiles` — Saved recipient details
13. `fx_rates` — Historical FX rate records
