# Cross-Border Remittance App — Laos ↔ Thailand

> **Product Name:** NgoenSai (ເງິນຊາຍ — "Money Sent")
> **Corridor:** Thailand → Laos
> **Target Users:** ~500,000+ Lao migrant workers in Thailand sending money home
> **Regulatory Framework:** Bank of Laos Mobile Money Sandbox + Bank of Thailand Non-Bank Regulations

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas & Segments](#2-user-personas--segments)
3. [Complete Transaction Flows](#3-complete-transaction-flows)
4. [Sender Payment Methods (Debit)](#4-sender-payment-methods-debit)
5. [Recipient Payout Methods (Credit)](#5-recipient-payout-methods-credit)
6. [Account Structure & Money Movement](#6-account-structure--money-movement)
7. [Forex & Rate Management](#7-forex--rate-management)
8. [System Architecture](#8-system-architecture)
9. [Database Schema](#9-database-schema)
10. [API Specification](#10-api-specification)
11. [Mobile App UX (Screen-by-Screen)](#11-mobile-app-ux-screen-by-screen)
12. [Agent Network (Thailand)](#12-agent-network-thailand)
13. [Agent Network (Laos)](#13-agent-network-laos)
14. [Regulatory & Compliance](#14-regulatory--compliance)
15. [Security & Fraud](#15-security--fraud)
16. [Operations & Reconciliation](#16-operations--reconciliation)
17. [Risk Management](#17-risk-management)
18. [Financial Projections](#18-financial-projections)
19. [Team & Hiring](#19-team--hiring)
20. [Roadmap](#20-roadmap)

---

## 1. Product Overview

### 1.1 The Problem

Lao migrant workers in Thailand (estimated 500,000–1,000,000) send money home regularly — $150–500/month per worker, totaling an estimated $1–2 billion annually flowing from Thailand to Laos.

Current options are all broken:

| Method | Fee | Speed | Convenience | Accessibility (Rural Laos) |
|--------|-----|-------|-------------|---------------------------|
| Western Union | 5–10% + bad FX rate | Minutes | Must visit branch with ID | Must travel to town |
| Informal courier (LINE Man) | 2–3% | 1–2 days | Convenient but risky | Village delivery possible |
| Bank transfer | 1–3% + paperwork | 1–3 days | Requires bank accounts both sides | Rural family likely unbanked |
| Carry cash (self) | 0% | Travel time | Risky, only works when visiting | — |
| TrueMoney | 3–5% | Minutes | Good in TH, limited Lao payout | Only major cities in Laos |

**The gap:** No solution exists that is cheap, instant, and works for rural unbanked recipients.

### 1.2 The Solution: NgoenSai

A mobile-first cross-border payment platform where:

- **Sender (Thailand):** Pays via PromptPay, TrueMoney, bank transfer, or cash at an agent
- **Recipient (Laos):** Receives via cash pickup (BCEL, 7-Eleven, village agent), mobile top-up, or e-wallet
- **Our role:** Licensed intermediary holding pooled accounts in both countries, managing FX and settlement

### 1.3 Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Sender** | 50–80% cheaper than Western Union. No ID needed. App in Lao language. Send anytime from phone. |
| **Recipient** | Pick up cash at nearest 7-Eleven or village shop. No bank account needed. SMS notification in Lao. |
| **BCEL (partner bank)** | Increase in transaction volume, attracts new depositors (recipients who open accounts to receive faster). |
| **Regulator (BoL)** | Formalizes informal remittance channel, improves financial inclusion, enables AML monitoring. |

---

## 2. User Personas & Segments

### 2.1 Sender Personas

#### Persona A: Documented Factory Worker ("Khammany")

| Attribute | Detail |
|-----------|--------|
| Age | 26–35 |
| Job | Factory worker in Samut Prakan / Rayong |
| Monthly income | THB 12,000–18,000 ($340–510) |
| Monthly sent | THB 5,000–10,000 ($140–285) |
| Current method | Western Union or LINE friend |
| Phone | Smartphone (Oppo/Realme, THB 3,000–6,000) |
| Banking | Has Kasikorn or Bangkok Bank account (employer-mandated) |
| Tech literacy | Moderate — uses LINE, Facebook, TikTok |
| Pain points | WU queue + ID check + fees add up to THB 500–1,000/month |

#### Persona B: Construction Worker ("Sompong")

| Attribute | Detail |
|-----------|--------|
| Age | 30–50 |
| Job | Construction worker in Bangkok / Chonburi |
| Monthly income | THB 9,000–15,000 ($255–425) |
| Monthly sent | THB 3,000–7,000 ($85–200) |
| Current method | Cash via friend/boss going to Laos |
| Phone | Basic feature phone or old Android |
| Banking | No Thai bank account. Has TrueMoney Wallet (friends helped set up) |
| Tech literacy | Low — can use TrueMoney to top up, but not comfortable with apps |
| Pain points | Boss/friend schedules don't align, money arrives late or lost |

#### Persona C: Service Worker ("Nee")

| Attribute | Detail |
|-----------|--------|
| Age | 20–28 |
| Job | Masseuse, restaurant worker, or nanny in Bangkok/Phuket/Chiang Mai |
| Monthly income | THB 15,000–25,000 ($425–710) |
| Monthly sent | THB 8,000–15,000 ($225–425) |
| Current method | PromptPay + Kasikorn app to friend's account, friend sends via WU |
| Phone | Mid-range smartphone (Samsung A series) |
| Banking | Has bank account (SCB/KBank) |
| Tech literacy | High — comfortable with multiple apps and mobile banking |
| Pain points | Two-step process (bank + WU), wants parents to get money instantly |

### 2.2 Recipient Personas

#### Persona D: Rural Mother ("Mae")

| Attribute | Detail |
|-----------|--------|
| Age | 50–65 |
| Location | Village in Savannakhet / Saravane / Champasak |
| Phone | Basic feature phone (Nokia 105) |
| Banking | No bank account. Cash-in-hand economy. |
| Nearest town | 15–30 km via scooter or songthaew |
| Literacy | Reads Lao, limited writing |
| Receiving method | Currently: travel to WU in town (costs 50,000 LAK + half a day) |
| Preference | Pick up cash at local shop or get phone top-up |

#### Persona E: Urban Student ("Bounmy")

| Attribute | Detail |
|-----------|--------|
| Age | 18–22 |
| Location | Vientiane (studying at National University) |
| Phone | Smartphone (iPhone/Android) |
| Banking | Has BCEL One Bank app (for tuition) |
| Tech literacy | High |
| Preference | Receive to BCEL One Wallet, spend via Lao QR |

#### Persona F: Village Shopkeeper ("Touy")

| Attribute | Detail |
|-----------|--------|
| Age | 35–50 |
| Location | Runs small general store in village |
| Phone | Smartphone (for LINE/Facebook) |
| Banking | Has BCEL account (business) |
| Role | Becomes our cash-out agent |
| Incentive | Gets commission per payout + more foot traffic |

---

## 3. Complete Transaction Flows

### 3.1 Flow A: Sender Has Thai Bank Account — Recipient Picks Up Cash at BCEL

This is the "happy path" and most common flow for urban senders + semi-urban recipients.

```
SENDER SIDE (Thailand)

[1] Khammany opens NgoenSai app
    App detects location = Thailand
    Shows "Send to Laos" screen

[2] Khammany enters:
    Amount: 5,000 THB
    Recipient phone: +856 20 5555 1234

[3] App shows quote:
    Exchange rate: 1 THB = 575 LAK
    Mid-market rate: 578 LAK/THB
    Our spread: 3 LAK/THB (0.52%)
    Sender pays: 5,000 THB
    Recipient gets: 2,875,000 LAK
    Pickup fee: 0 LAK (included)
    Total fee equivalent: ~0.52%

[4] Khammany selects: "Cash pickup at BCEL"
    Chooses province: Savannakhet
    Shows nearest BCEL branches in Savannakhet

[5] Khammany confirms > App says "Pay 5,000 THB"
    Options:
      [A] PromptPay QR > Scan with KBank app > instant payment
      [B] Bank transfer to KBank/SCB/Bangkok Bank account
    Khammany chooses [A] PromptPay QR

[6] App generates dynamic PromptPay QR code for 5,000 THB
    QR encodes: PromptPay merchant ID of NgoenSai's Kasikorn corporate account
    Khammany opens KBank app > scans QR > confirms 5,000 THB > paid
    KBank shows: "Payment successful to NgoenSai Co., Ltd."

[7] Our Kasikorn webhook fires:
    INCOMING | Amount: 5,000 THB | Ref: PROMPTPAY-XXXXX
    System confirms: Sender = Khammany (matched by ref)

BACKEND PROCESSING (instant)

[8] Rate lock check:
    Quote valid for 15 minutes. Elapsed: 2 minutes (OK)
    Rate confirmed: 575 LAK/THB

[9] Our BCEL corporate API call:
    POST /v1/corporate/payout
    {
      "reference_id": "TXN-20260627-XXXXX",
      "amount_LAK": 2875000,
      "pickup_code": "839201",
      "recipient_phone": "+8562055551234",
      "recipient_name": "Mae Khammany"
    }

[10] BCEL processes:
     Debits NgoenSai corporate account: -2,875,000 LAK
     Credits BCEL payout settlement account: +2,875,000 LAK
     Creates pickup record in BCEL cash pickup system
     Returns: status=success, pickup_code=839201
     Note: Code redeemable at BCEL branch with phone + code
           (no ID needed for under ~$100 equivalent)

[11] Our system:
     Marks transaction COMPLETED
     Sends SMS to +8562055551234:
     "Money sent from Khammany: 2,875,000 LAK ready for pickup!
      Go to BCEL: use code 839201 + your phone number. Valid 7 days."

[12] Push to Khammany: "Mom received the SMS OK"

RECIPIENT SIDE (Laos)

[13] Mae walks to BCEL in Savannakhet town (30 min scooter)

[14] Mae: "I want to receive money. Code: 839201."

[15] Teller:
     Enters code: 839201
     System shows: 2,875,000 LAK, phone: 020 5555 1234
     Asks: "Your phone number?"
     Mae: "020 5555 1234"
     Teller verifies phone matches
     Amount ~$125, under threshold > no ID required
     Teller clicks "Release"
     Cash handed to Mae

[16] BCEL webhook: payout_code=839201, status=collected

[17] Our system updates to REDEEMED
     Notifies Khammany: "Mom received the money OK"

Total time: ~15 min (sender) + travel time (recipient)
Our cost: ~0.15% (BCEL pickup fee + SMS)
Our revenue: 0.52% (15,000 LAK ~ $0.65)
```

### 3.2 Flow B: Cash Sender via Agent — Mobile Top-Up Recipient

```
SENDER SIDE (Thailand)

[1] Sompong walks to NgoenSai agent in Bangkok (Khlong Toei)
    Shop sticker: "Send money to Laos"

[2] Sompong gives agent:
    Cash: 3,000 THB
    Recipient: "My wife, phone 020 6666 8888"

[3] Agent opens NgoenSai Agent App:
    Selects "Cash In - Send to Laos"
    Recipient phone: +8562066668888
    Rate: 3,000 THB -> 1,710,000 LAK (rate 570)
    Payout: Mobile Top-Up (Unitel)
    1,710,000 LAK -> 1,650,000 LAK top-up value
    Recipient gets: 1,650,000 LAK phone credit

[4] Agent receives 3,000 THB cash
    Agent confirms in app: "Cash received OK"
    Transaction debits agent's THB float by 3,000 THB

BACKEND PROCESSING

[5] NgoenSai backend:
    Deducts 3,000 THB from agent float account
    Calls Unitel API to top up +8562066668888 with 1,650,000 LAK

[6] Unitel confirms: phone credited, sends SMS to recipient

[7] Our system marks transaction COMPLETED
    SMS to Sompong: "Wife received mobile top-up OK"

Total time: ~5 minutes
Agent commission: 0.50% | Telco margin: 1.0% | Net cost: 0.80%
Our revenue: 1.5% rate spread
Net margin: ~0.70%
```

### 3.3 Flow C: TrueMoney Wallet Sender — Village Agent Cash Pickup

```
SENDER SIDE (Thailand)

[1] Nee opens NgoenSai app
    Connects to TrueMoney Wallet via OAuth
    Authorizes balance check

[2] Nee enters:
    Amount: 2,000 THB
    Recipient phone: +8562077779999
    Payout: "Cash Pickup - Village Agent"

[3] App shows nearest agents to recipient's area:
    [1] Shop Touy - Savannakhet, Village Na Kai (1 km)
    Nee selects: Shop Touy

[4] Payment via TrueMoney:
    App opens TrueMoney SDK
    Nee confirms: Pay 2,000 THB from TrueMoney balance
    TrueMoney charges: 2,000 + 20 THB (TrueMoney fee)
    Webhook to us: status=success, amount=2,000 THB

BACKEND PROCESSING

[5] Rate: 1 THB = 572 LAK
    2,000 THB -> 1,144,000 LAK
    Agent Touy commission: 5,000 LAK per payout
    Recipient receives: 1,139,000 LAK cash

[6] Notification to agent Touy:
    "Please pay 1,139,000 LAK to +8562077779999. Code: 472831"

RECIPIENT SIDE

[7] Nee's mom walks to Shop Touy (2 min walk)

[8] Mom: "I'm here to pick up money from Nee"
    Touy: "Phone number?"
    Mom: "020 7777 9999"
    Touy enters in Agent App > matches payout
    Touy confirms: "Recipient is here"

[9] Verification: birth year
    Mom: "2513" (1970) > matches > authorized

[10] Touy hands 1,139,000 LAK cash
    Touy presses [RECIPIENT PAID]
    Agent float decreases by 1,139,000 LAK

[11] SMS to Nee: "Mom received from Touy OK - 1,139,000 LAK"

Total time: ~3 min (sender) + ~2 min (recipient pickup)
Agent model = deep rural coverage without bank branches
```

### 3.4 Flow D: Recurring / Standing Instruction

```
[1] Khammany sets up in NgoenSai app:
    "Send THB 8,000 to mom (02055551234) on the 5th of every month
     via BCEL cash pickup in Savannakhet"

[2] On the 5th, our system:
    Checks Khammany's linked KBank account via PromptPay recurring
    Initiates 8,000 THB debit
    If balance insufficient > retry for 3 days
    If still fails > SMS: "Auto-send failed. Please top up."
    If success > proceeds with standard payout flow

[3] Benefits:
    Khammany doesn't forget
    Mom gets money reliably
    Higher retention (switching cost)
```

---

## 4. Sender Payment Methods (Debit)

### 4.1 Payment Method Matrix

| Method | Tech Integration | Our Cost | Settlement Speed | Best For |
|--------|-----------------|----------|------------------|----------|
| **PromptPay QR** | Kasikorn PromptPay merchant account | 0.25% to bank | Instant | Senders with Thai bank app |
| **Bank Transfer** | Virtual account per transaction | Free | Minutes | Senders comfortable with bank tx |
| **TrueMoney Wallet** | TrueMoney Merchant API | 1.5% (charged to sender) | Instant | Senders without bank account |
| **Agent Cash-in** | Agent app (manual cash collection) | 0.5% agent commission | Instant (float) | Senders with cash only |

### 4.2 PromptPay QR (Primary Method)

**Technical flow:**

```
Sender clicks "Pay" in NgoenSai app
        |
        v
Backend: Generate unique reference
        |
        v
Backend: POST /v1/promptpay/qr to Kasikorn API (amount=5000, ref=TXN-XXXXX)
        |
        v
Kasikorn returns EMVCo QR string encoding:
    - Merchant PromptPay ID (our corporate tax ID)
    - Amount: 5,000.00 THB
    - Ref: TXN-XXXXX (in merchant data field)
        |
        v
App displays QR code (valid 15 minutes)
        |
        v
Sender scans with any Thai bank app (KBank, SCB, BBL, Krungsri, etc.)
        |
        v
Kasikorn receives payment
Money moves: Sender account -> Our Kasikorn corporate account
(Settled instantly via PromptPay real-time transfer)
        |
        v
Kasikorn fires webhook to our callback URL
        |
        v
Backend confirms payment, initiates Laos payout
```

### 4.3 Agent Cash-In

| Step | Detail |
|------|--------|
| **Who is an agent?** | Lao grocery stores in Thailand, phone shops, restaurants |
| **Float model** | Agent pre-deposits THB to our Kasikorn account (min 10,000 THB) |
| **Transaction** | Agent receives cash from sender > agent app confirms > payout initiated |
| **Agent incentive** | 0.5% commission per transaction |
| **Settlement** | Agent deposits accumulated cash weekly to our Kasikorn account |

**Float lifecycle:**

```
Agent deposits float (THB)
    > Transactions reduce float
    > Agent collects cash from senders
    > Agent deposits cash to our Kasikorn account
    > Float replenished
```

---

## 5. Recipient Payout Methods (Credit)

### 5.1 Payout Method Matrix

| Method | Speed | Recipient Fee | Our Cost | Max Amount | Best For |
|--------|-------|---------------|----------|------------|----------|
| **BCEL Cash Pickup** | Instant | Free | 10,000 LAK flat | 50M LAK | Semi-urban |
| **7-Eleven Cash Pickup** | Instant | Free | 15,000 LAK flat | 5M LAK | Urban, after hours |
| **Village Agent Cash** | Instant | Free | 5,000 LAK commission | 2M LAK | Deep rural |
| **Mobile Top-Up** | Instant | No cash value loss | 3% (telco) | 2M LAK | Rural basic phone |
| **BCEL One Wallet** | Instant | Free | 0.1% | Unlimited | Urban smartphone |
| **Bank Transfer** | 1 hour | Free | 0.2% | Unlimited | Formal recipients |

### 5.2 BCEL Cash Pickup (Primary)

**API integration flow:**

```
Our Backend                       BCEL Corporate API
    |                                   |
    | POST /v1/corporate/payout         |
    | {                                 |
    |   "reference_id": "TXN-...",      |
    |   "amount_LAK": 2875000,          |
    |   "pickup_code": "839201",        |
    |   "recipient_phone": "8562055551234" |
    | }                                 |
    |                                   |
    |<-- 201 Created                    |
    | { "status": "accepted" }          |
    |                                   |
    |<-- WEBHOOK: payout_collected      |
    | { "pickup_code": "839201" }       |
```

**BCEL internal processing:**

```
1. BCEL receives API call
2. Validates signature, account balance, limits
3. Debits NgoenSai corporate account: -2,875,000 LAK
4. Credits internal "NgoenSai Payouts" holding account: +2,875,000 LAK
5. Creates pickup record in cash payout system
   - Code: 839201 (6-digit, random, unique)
   - Amount: 2,875,000 LAK
   - Phone: 8562055551234
   - Status: AVAILABLE
   - Expiry: 7 days
6. When recipient arrives:
   a. Recipient gives phone + code
   b. Teller queries system > verifies phone matches
   c. Teller clicks "Release" > debits holding account
   d. Cashier gives cash to recipient
   e. Webhook to us: status=collected
```

**Pickup code generation:**

```go
func generatePickupCode() string {
    // 6 digits, cryptographically random
    // Luhn check digit appended for manual validation
    code := rand.Intn(900000) + 100000
    checkDigit := luhnChecksum(code)
    return fmt.Sprintf("%d%d", code, checkDigit)  // 7 digits
}
```

### 5.3 Village Agent Cash Payout (Deep Rural)

| Aspect | Detail |
|--------|--------|
| **Who** | Village shopkeeper (general store, phone shop) |
| **Float** | Agent holds LAK cash. We track digital float balance. |
| **Float funding** | Agent deposits at BCEL > BCEL credits us > we credit agent float |
| **Verification** | Phone number + birth year + OTP to recipient phone |
| **Audit** | Agent takes recipient photo (consent) |
| **Commission** | 5,000 LAK flat per payout + 0.25% for volume > 100/month |
| **Limits** | Max 2,000,000 LAK per payout per recipient per day |

### 5.4 Mobile Top-Up (Instant No Bank Needed)

**Why this matters:** For recipients with only a basic phone, mobile credit is valuable:
- Can transfer credit to other phones (telco feature)
- Can convert to cash via informal channels
- Can pay for goods via telco merchant services

**Economics:**
- Telco gives us 5% discount on top-up face value
- We pass 3% to sender (better rate on top-up vs cash)
- We keep 2% margin

---

## 6. Account Structure & Money Movement

### 6.1 Our Bank Accounts

```
THAILAND ENTITY                          LAOS ENTITY
NgoenSai (Thailand) Co., Ltd.            NgoenSai (Laos) Co., Ltd.
Registered: Bangkok                      Registered: Vientiane
License: Non-bank payment service        License: Mobile Money Sandbox

KASIKORN ACCOUNT (THB)                   BCEL ACCOUNT (LAK)
Purpose: Receive sender payments         Purpose: Fund payouts
Balance target: 10M THB                  Balance target: 500M LAK
Min balance: 2M THB                      Min balance: 50M LAK
Settlement: Real-time (PromptPay)
```

### 6.2 Money Movement Per Transaction

```
Sender (TH) pays 5,000 THB
    |
    v
NgoenSai Kasikorn Acct (THB): +5,000 THB
    |
    v
FX Conversion (THB to LAK)
    Options:
    [A] Kasikorn FX desk
    [B] BCEL FX desk
    [C] Third-party FX broker
    Amount: 5,000 THB at rate 575 = 2,875,000 LAK
    |
    v
NgoenSai BCEL Acct (LAK): +2,875,000 LAK
    |
    v
Payout to Recipient (cash / top-up / e-wallet): -2,875,000 LAK
```

### 6.3 Frequency of Conversion (FX)

| Model | When | Risk | Complexity |
|-------|------|------|------------|
| **Real-time** | Convert each transaction immediately | FX risk eliminated | Highest |
| **Daily batch** | Convert all THB at end of day | Intraday rate exposure | Moderate |
| **Target balance** | Convert when Kasikorn exceeds threshold | Rate risk over accumulation | Simple |

**Recommended: Real-time + buffer**
- Convert 80% of each receipt immediately
- Keep 20% as buffer for refunds/float
- When buffer > 1M THB > convert excess

### 6.4 Treasury Dashboard

```
TREASURY DASHBOARD

KASIKORN (THB)             BCEL (LAK)
Balance: 8,450,000         Balance: 452,000,000
Target:  10,000,000        Target:  500,000,000
Status:  UNDER             Status:  NEAR TARGET

FX POSITION
Pending sells (THB->LAK): 2,150,000 THB queued for tonight
Avg rate locked: 574.5
Current market: 577.0
P&L on pending: +5,375 LAK (favorable)

TODAY VOLUME
Transactions: 1,245 | Volume: 8.9M THB
Revenue: 245,670 THB | Cost: 42,100 THB
Margin: 2.3%
```

---

## 7. Forex & Rate Management

### 7.1 Rate Architecture

```
Mid-Market Rate: 578 LAK/THB (Reuters/Bloomberg)
        |
Our Published Rate: 575 LAK/THB
Spread: 3 LAK/THB (0.52%)
        |
    +-----------+-----------+
    |                       |
Sender sees:           Our cost to convert:
575 LAK/THB            0.15% (bank FX margin)
(pays 5,000 THB)       = 575.86 effective
(recipient gets 2,875,000 LAK)
    |
Net spread: 0.52% - 0.15% = 0.37%
Revenue: 0.37% x 2,875,000 = 10,638 LAK ($0.50)
```

### 7.2 Rate Update Frequency

| Time | Action |
|------|--------|
| 08:00 ICT | Fetch mid-market from Kasikorn FX API |
| 09:00-16:00 | Update every 15 minutes during Thai market |
| 16:00 | Freeze rate for the day |
| Weekend | Freeze at Friday 16:00 rate |

**Rate change logic:**
- If mid-market moves > 0.5%: reprice and notify active users
- If mid-market moves against us > 2%: pause transactions, manual review

### 7.3 Rate Lock

Our rate valid for 15 minutes from quote. Once sender pays, rate locked regardless of market moves. If sender does not pay within 15 min > quote expires. Exception: If market moves > 5% during 15 min window, we reserve right to recalculate.

### 7.4 FX Settlement (Daily)

```
1. Calculate: Total THB received today
              - Total LAK paid out (at locked rates)
              = Net THB position

2. If Net THB = +5,000,000:
   Convert 4,000,000 THB to LAK via Kasikorn FX desk
   Send 2,300,000,000 LAK to BCEL account
   Keep 1,000,000 THB in Kasikorn as buffer

3. Rate from Kasikorn: 576.5 (includes 0.15% bank margin)
   Our rate was 575 > net FX gain = 1.5 LAK/THB additional revenue

4. If Net THB negative:
   Use Kasikorn buffer
   Or sell LAK to buy THB (reverse conversion)
```

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
CLIENT LAYER
+-------------------+ +-------------------+ +-------------------+
| Sender App (RN)    | | Agent App (RN)    | | Admin Dashboard   |
| - Send money       | | - Cash in/out     | | (React+Tailwind)  |
| - Track history    | | - Float mgmt      | | - Transactions    |
| - Autosend         | | - QR scan         | | - Treasury        |
| - Rate alerts      | | - KYC verification| | - Agent mgmt      |
+--------+----------+ +--------+----------+ | - Compliance      |
         |                     |             +--------+----------+
    HTTPS/WSS              HTTPS/WSS                 |
         |                     |                 HTTPS
         v                     v                     v
GATEWAY LAYER
+-------------------------------------------------------+
| API Gateway (Kong/Envoy)                               |
| Rate Limiting | Auth JWT Verify | Logging | AML Block |
+------------------------+------------------------------+
         |                |                |
         v                v                v
SERVICE LAYER
+----------+ +-----------+ +-----------+ +--------------+
| Auth     | | Payment   | | Payout    | | Agent        |
| Service  | | Service   | | Service   | | Service      |
| - OTP    | | - Prompt  | | - BCEL    | | - CRUD       |
| - JWT    | |   Pay QR  | | - Agent   | | - Float      |
| - KYC    | | - TrueMny | | - Top-up  | | - Commission |
| - RateLmt| | - FX calc | | - API     | |              |
+----------+ +-----------+ +-----------+ +--------------+
+----------+ +-----------+ +-----------+ +--------------+
| User     | | Treasury  | | Notify    | | Compliance   |
| Service  | | Service   | | Service   | | Service      |
| - Profile| | - FX mgmt | | - SMS     | | - AML screen |
| - Re-    | | - Bank bal| | - Push    | | - Sanctions  |
|   cipient| | - Recon   | | - LINE    | | - SAR gen    |
+----------+ +-----------+ +-----------+ +--------------+
+---------------------------------------------------+
| Scheduler Service                                  |
| - Autosend processing (cron: hourly)               |
| - Rate update (cron: 15 min)                      |
| - Pickup expiry cleanup (cron: daily)             |
+---------------------------------------------------+

DATA LAYER
+----------+ +----------+ +----------+ +----------------+
| Postgres | | Redis    | | RabbitMQ | | S3 / GCS       |
| (HA)     | | (Cache,  | | (Async   | | (KYC docs,     |
|          | |  OTP,    | |  tasks:  | |  receipts)     |
|          | |  Locks)  | |  SMS,    | |                |
|          | |          | |  webhook)| |                |
+----------+ +----------+ +----------+ +----------------+

EXTERNAL INTEGRATIONS
Kasikorn API | BCEL API | TrueMoney API
Unitel API   | LTC API  | Lao Telecom SMS
```

### 8.2 Transaction State Machine

```
PENDING (quote issued)
    | Sender pays
    v
PAID (received in our account)
    | Initiate payout
    v
PAYOUT_INITIATED (BCEL/Agent/etc)
    |
    +----------------+
    |                |
    v                v
COMPLETED        PAYOUT_FAILED
(recipient        > auto-retry
 got cash)        > if 3 fails > REFUNDED
```

### 8.3 Deployment Architecture

```
KUBERNETES CLUSTER (Huawei Cloud Laos)
+----------+ +----------+ +----------+ +------------+
| Auth Svc | | Payment  | | Payout   | | Scheduler  |
| (2 reps) | | (4 reps) | | (2 reps) | | (1 rep)    |
+----------+ +----------+ +----------+ +------------+
+----------+ +----------+ +----------+ +------------+
| Treasury | | Agent    | | Notify   | | Compliance |
| (2 reps) | | (2 reps) | | (2 reps) | | (1 rep)    |
+----------+ +----------+ +----------+ +------------+
+----------------+ +-----------+ +-------------+
| PostgreSQL HA  | | Redis     | | RabbitMQ    |
| (2 nodes)      | | Cluster   | | (3 nodes)   |
+----------------+ | (3 nodes) | +-------------+
                   +-----------+

Data localization: All data in Laos (Huawei Cloud Vientiane DC)
```

### 8.4 Disaster Recovery

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Pod failure | < 1 min | - | K8s auto-restart |
| Node failure | < 5 min | - | Multi-node pool |
| Database failure | < 2 min | < 1 sec | PG streaming replica auto-failover |
| Full region outage | < 4 hours | < 15 min | Cold standby in GCP Bangkok |
| Bank API outage | T+1 | - | Queue, process when back. If >4h, offer alt method |

---

## 9. Database Schema

### 9.1 Core Tables

```sql
-- USERS
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone             VARCHAR(20) NOT NULL UNIQUE,
    country_code      VARCHAR(5) NOT NULL DEFAULT '+856',
    name              VARCHAR(100) NOT NULL,
    date_of_birth     DATE,
    role              VARCHAR(20) NOT NULL DEFAULT 'sender',
                      -- sender, recipient, agent, admin, superadmin
    kyc_level         VARCHAR(10) NOT NULL DEFAULT 'unverified',
                      -- unverified, level_1, level_2, level_3
    kyc_document_type VARCHAR(20),
    kyc_verified_at   TIMESTAMP,
    language          VARCHAR(5) DEFAULT 'lo',
    device_id         VARCHAR(100),
    fcm_token         TEXT,
    hms_token         TEXT,
    is_active         BOOLEAN DEFAULT TRUE,
    is_locked         BOOLEAN DEFAULT FALSE,
    lock_reason       TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);

-- SENDER PROFILES
CREATE TABLE sender_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id),
    thai_id_number      VARCHAR(20),
    work_permit_number  VARCHAR(30),
    employer_name       VARCHAR(200),
    employer_province   VARCHAR(100),
    home_province       VARCHAR(100),
    referral_code       VARCHAR(20) UNIQUE,
    referred_by         UUID REFERENCES users(id),
    total_sent_count    INT DEFAULT 0,
    total_sent_amount   BIGINT DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RECIPIENT PROFILES
CREATE TABLE recipient_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    phone               VARCHAR(20) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    province            VARCHAR(100),
    district            VARCHAR(100),
    village             VARCHAR(100),
    preferred_payout    VARCHAR(30) DEFAULT 'bcel_cash',
    preferred_agent_id  UUID REFERENCES agents(id),
    birth_year          VARCHAR(4),
    relationship        VARCHAR(30),
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(phone, created_by)
);

-- TRANSACTIONS (core table - high volume, partitioned by month)
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref     VARCHAR(50) NOT NULL UNIQUE,
    idempotency_key     VARCHAR(100) NOT NULL UNIQUE,
    sender_id           UUID NOT NULL REFERENCES users(id),
    source_currency     CHAR(3) NOT NULL DEFAULT 'THB',
    source_amount       DECIMAL(18,2) NOT NULL,
    source_fee          DECIMAL(18,2) DEFAULT 0,
    payment_method      VARCHAR(30) NOT NULL,
    payment_reference   VARCHAR(100),
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    exchange_rate       DECIMAL(10,2) NOT NULL,
    mid_market_rate     DECIMAL(10,2),
    rate_locked_at      TIMESTAMP,
    target_currency     CHAR(3) NOT NULL DEFAULT 'LAK',
    target_amount       BIGINT NOT NULL,
    payout_method       VARCHAR(30) NOT NULL,
    payout_status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    payout_reference    VARCHAR(100),
    payout_fee          BIGINT DEFAULT 0,
    recipient_phone     VARCHAR(20) NOT NULL,
    recipient_name      VARCHAR(100) NOT NULL,
    recipient_id        UUID REFERENCES recipient_profiles(id),
    pickup_code         VARCHAR(10),
    pickup_expires_at   TIMESTAMP,
    quoted_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at             TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_tx_sender_id ON transactions(sender_id);
CREATE INDEX idx_tx_recipient_phone ON transactions(recipient_phone);
CREATE INDEX idx_tx_pickup_code ON transactions(pickup_code);
CREATE INDEX idx_tx_idempotency ON transactions(idempotency_key);

-- TRANSACTION LOGS (audit trail)
CREATE TABLE transaction_logs (
    id                BIGSERIAL PRIMARY KEY,
    transaction_id    UUID NOT NULL REFERENCES transactions(id),
    status_from       VARCHAR(20),
    status_to         VARCHAR(20) NOT NULL,
    changed_by        VARCHAR(50),
    reason            TEXT,
    metadata          JSONB,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AGENTS
CREATE TABLE agents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    shop_name           VARCHAR(200) NOT NULL,
    shop_address        TEXT,
    shop_province       VARCHAR(100),
    shop_lat            DECIMAL(10,7),
    shop_lng            DECIMAL(10,7),
    country             VARCHAR(5) NOT NULL,
    agent_type          VARCHAR(20) NOT NULL,
    float_balance_LAK   BIGINT DEFAULT 0,
    float_balance_THB   DECIMAL(18,2) DEFAULT 0,
    commission_rate     DECIMAL(5,2) DEFAULT 0.50,
    commission_total    BIGINT DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    kyc_status          VARCHAR(20) DEFAULT 'pending',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- KYC DOCUMENTS
CREATE TABLE kyc_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    document_type       VARCHAR(20) NOT NULL,
    document_number     VARCHAR(50),
    front_image_url     TEXT NOT NULL,
    back_image_url      TEXT,
    selfie_url          TEXT,
    ocr_data            JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    rejection_reason    TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AUTOSEND (recurring)
CREATE TABLE autosends (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id           UUID NOT NULL REFERENCES users(id),
    recipient_id        UUID NOT NULL REFERENCES recipient_profiles(id),
    amount_THB          DECIMAL(18,2) NOT NULL,
    frequency           VARCHAR(10) NOT NULL,
    next_send_at        TIMESTAMP NOT NULL,
    last_send_at        TIMESTAMP,
    payout_method       VARCHAR(30) NOT NULL,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FX RATES HISTORY
CREATE TABLE fx_rates (
    id                  BIGSERIAL PRIMARY KEY,
    from_currency       CHAR(3) NOT NULL,
    to_currency         CHAR(3) NOT NULL,
    mid_market_rate     DECIMAL(10,2) NOT NULL,
    our_rate            DECIMAL(10,2) NOT NULL,
    source              VARCHAR(30) DEFAULT 'kasikorn',
    recorded_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RECONCILIATION (daily)
CREATE TABLE reconciliations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_date   DATE NOT NULL,
    bank_account_id       UUID NOT NULL,
    bank_opening_balance  DECIMAL(18,2),
    bank_closing_balance  DECIMAL(18,2),
    system_balance        DECIMAL(18,2),
    difference            DECIMAL(18,2) DEFAULT 0,
    difference_reason     TEXT,
    status                VARCHAR(20) DEFAULT 'pending',
    created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10. API Specification

### 10.1 Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.ngoensai.la/v1` |
| Sandbox | `https://sandbox.api.ngoensai.la/v1` |
| Webhooks | `https://webhooks.ngoensai.la/v1/webhooks/{provider}` |

### 10.2 Authentication

All API calls (except auth endpoints) require:
```
Authorization: Bearer <jwt_access_token>
X-Idempotency-Key: <uuid>
```

### 10.3 Key Endpoints

**POST /v1/auth/register** - Send OTP
```json
Request:  { "phone": "8562055551234", "country_code": "856", "language": "lo" }
Response: { "status": "otp_sent", "retry_after_seconds": 60 }
```

**POST /v1/auth/verify** - Verify OTP
```json
Request:  { "phone": "8562055551234", "otp": "482910", "device_id": "xxx" }
Response: {
  "access_token": "eyJhbG...",
  "refresh_token": "dGhpcy...",
  "user": { "id": "uuid", "phone": "8562055551234", "kyc_level": "unverified" }
}
```

**POST /v1/quote** - Get rate quote
```json
Request: {
  "source_amount": 5000,
  "source_currency": "THB",
  "target_currency": "LAK",
  "payout_method": "bcel_cash",
  "recipient_phone": "8562055551234"
}
Response: {
  "quote_id": "Q-20260627-XXXXX",
  "exchange_rate": 575.00,
  "target_amount": 2875000,
  "fee_breakdown": { "fx_margin": 0.52, "total_fee_percent": 0.52 },
  "payout_options": [
    { "method": "bcel_cash", "target_amount": 2875000 },
    { "method": "seven_eleven_cash", "target_amount": 2865000 },
    { "method": "mobile_topup", "target_amount": 2780000 }
  ],
  "rate_expires_at": "2026-06-27T12:15:00+07:00"
}
```

**POST /v1/transactions/send** - Execute send
```json
Request: {
  "idempotency_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quote_id": "Q-20260627-XXXXX",
  "recipient": { "phone": "8562055551234", "name": "Mae Khammany" },
  "payout_method": "bcel_cash",
  "payment_method": "promptpay_qr"
}
Response: {
  "transaction_ref": "TXN-20260627-XXXXX",
  "status": "awaiting_payment",
  "payment": {
    "qr_code": "00020101021129370016A000000677...",
    "amount": 5000.00,
    "expires_at": "2026-06-27T12:15:00+07:00"
  }
}
```

**GET /v1/transactions** - History
```
?page=1&limit=20&status=completed&from=2026-06-01&to=2026-06-27
```

### 10.4 Webhook: Kasikorn Payment Confirm

```
POST /webhooks/kasikorn
Headers: X-Signature: <HMAC-SHA256>

Body: {
  "event": "promptpay.payment.completed",
  "reference": "TXN-20260627-XXXXX",
  "amount": 5000.00,
  "currency": "THB",
  "sender_bank": "KBANK",
  "paid_at": "2026-06-27T12:05:30+07:00"
}
```

---

## 11. Mobile App UX (Screen-by-Screen)

### 11.1 Sender App

**Screen 1: Splash to Language**
- NgoenSai logo
- Three language buttons: Lao (default), Thai, English
- "Send money to Laos - easy, fast, safe"

**Screen 2: Phone Login**
- Country code selector: +856 (Laos), +66 (Thailand)
- Phone number input
- "Send OTP" button
- Rate limited: max 5 attempts/hour

**Screen 3: OTP Verification**
- 6-digit OTP input
- Auto-submit on 6 digits
- "Resend in 45s" countdown
- Option: receive OTP via call instead of SMS

**Screen 4: Home (Send Money)**
- Prominent "Send to Laos" button
- Recent rate display: "1 THB = 575 LAK"
- Quick actions: Send to saved recipients (avatars)
- Recent transactions list (last 5)
- Autosend status: "Next send: July 5 - THB 8,000"

**Screen 5: New Transfer (Step 1 - Amount)**
- Two-currency display: THB input / LAK display
- Keypad for entering THB amount
- Recipient auto-displays LAK amount in real-time
- Suggested amounts: 3,000 / 5,000 / 10,000 THB
- "Rate locked for 15 minutes" indicator

**Screen 6: New Transfer (Step 2 - Recipient)**
- Saved recipients list with avatars
- Or "New Recipient" form: name + phone + province + relationship
- Province selector: important for pickup location

**Screen 7: New Transfer (Step 3 - Payout Method)**
- Option cards showing:
  - BCEL Cash Pickup: 2,875,000 LAK (15 min) [RECOMMENDED]
  - 7-Eleven Pickup: 2,865,000 LAK (15 min)
  - Mobile Top-Up: 2,780,000 LAK (instant)
  - BCEL Wallet: 2,875,000 LAK (instant)
- Map showing nearest pickup locations

**Screen 8: Confirm & Pay**
- Summary card: Sends 5,000 THB -> Recipient gets 2,875,000 LAK
- Rate: 575 LAK/THB (mid-market: 578)
- Fee: 0.52%
- Recipient: Mae, Savannakhet, BCEL pickup
- Large "Pay Now" button -> generates QR code

**Screen 9: QR Code (PromptPay)**
- Full-screen QR code (15 min expiry)
- Countdown timer
- "Instructions: Open your bank app > Scan QR > Confirm"
- "I have paid" button (alternative to webhook)
- Progress indicator: Waiting for payment...

**Screen 10: Success**
- Large checkmark animation
- "Money sent!" confetti effect
- Summary: Sent THB 5,000 -> 2,875,000 LAK
- Recipient: Mae - code: 839201
- "Tell mom the code" via LINE/WhatsApp share button
- "Track" button leads to transaction detail

**Screen 11: Transaction Detail**
- Timeline view: Steps completed
- Sent at: 12:00 PM
- Paid at: 12:05 PM
- Ready for pickup: 12:06 PM
- Picked up: [pending - 7 days to collect]
- Share receipt button
- "Send again" button

**Screen 12: Profile**
- Name, phone, KYC level
- Saved recipients list
- Autosend settings
- Language toggle
- Rate alerts
- Support chat

---

## 12. Agent Network (Thailand)

### 12.1 Agent Profile

**Who can be an agent?**
- Lao grocery stores in Thailand (especially Samut Prakan, Pathum Thani, Bangkok)
- Lao restaurants and food shops
- Phone shops serving Lao customers
- Lao community gathering places (temples, associations)

**Agent density targets:**
- Bangkok: 20 agents (Khlong Toei, Bang Khen, Nong Khaem - high Lao density areas)
- Samut Prakan: 10 agents (factory areas)
- Pathum Thani: 5 agents
- Chonburi (industrial estates): 5 agents
- Chiang Mai: 5 agents
- Phuket: 3 agents (service workers)

### 12.2 Agent Onboarding

```
1. Agent submits: shop name, address, photos, owner ID (Thai/Laos)
2. Background check: verify shop exists, no adverse history
3. Sign digital agreement (Lao language)
4. Initial float deposit: min THB 10,000 (bank transfer or cash)
5. Receive starter kit: shop sticker, receipt book, training
6. Agent app installed: login, training session (30 min)
7. Activated: start serving customers
```

### 12.3 Agent App

Purpose-built for agents. Key features:
- **Cash In:** Receive cash from sender, confirm in app
- **Cash Out:** Disburse cash to recipient (Lao agents)
- **Float balance:** Real-time display with alerts at threshold
- **Transaction history:** Filterable by date, amount
- **QR scanner:** Scan sender's app QR for cash-out
- **Camera:** Take recipient photo for audit (cash-out)

---

## 13. Agent Network (Laos)

### 13.1 Agent Profile

**Who can be an agent in Laos?**

| Type | Coverage | Typical | Advantage |
|------|----------|---------|-----------|
| **BCEL branch** | Nationwide (200+) | District capitals | Official, trusted, large cash capacity |
| **7-Eleven Laos** | 150+ locations | Major towns | Extended hours (24h), convenient |
| **Village shopkeeper** | Deep rural | Village general store | Last-mile reach, trusted locally |

### 13.2 Village Agent Requirements

- Own a small shop in the village
- Have a smartphone (NgoenSai Agent App)
- Have a BCEL bank account (for float management)
- Can hold LAK 2-5M float
- Known and trusted in the community
- Willing to sign agreement + attend training

### 13.3 Agent Float Management (Laos)

```
Agent deposits LAK cash at BCEL
    > BCEL credits NgoenSai corporate account
    > Our system credits agent's virtual float
    > Agent can now pay out to recipients
    > Each payout reduces float
    > When float < 500,000 LAK > SMS alert
    > Agent re-deposits to replenish
```

---

## 14. Regulatory & Compliance

### 14.1 Licenses Required

| Country | License | Issuer | Timeline |
|---------|---------|--------|----------|
| Laos | Mobile Money Operator License | Bank of Laos | 6-12 months (sandbox: 3 months) |
| Laos | Payment Service Provider | Bank of Laos | Included in above |
| Thailand | Non-Bank Payment Service License | Bank of Thailand | 6 months |
| Both | Data Protection Registration | PDPA / DPA Laos | 1-2 months |

### 14.2 Bank of Laos Mobile Money Sandbox

Bank of Laos operates a regulatory sandbox for fintech. Key requirements:

| Requirement | How We Meet It |
|-------------|----------------|
| Partner with licensed bank | BCEL is our sponsor bank |
| Data localization | All data on Huawei Cloud Laos DC |
| AML/CFT program | Dedicated compliance officer + automated screening |
| Consumer protection | Transparent fees, 24h support, Ombudsman access |
| Reporting | Daily transaction reports, monthly compliance reports |
| Capital requirement | Minimum registered capital: 5B LAK (~$250K) |

### 14.3 AML/KYC Framework

| Tier | Transaction Limit | Requirements | Verification Method |
|------|-------------------|--------------|-------------------|
| Level 1 | Up to 2M LAK/day ($100) | Phone number | OTP verification |
| Level 2 | Up to 10M LAK/day ($500) | Name + DOB + photo | Selfie matching |
| Level 3 | Up to 50M LAK/day ($2,500) | Government ID (Lao/Thai ID, passport, work permit) | OCR + manual review |
| Level 4 | Above 50M LAK | Full KYC + source of funds + letter of employment | In-person verification |

### 14.4 Sanctions Screening

- Real-time screening of sender name against UN sanctions list and OFAC list
- Daily batch screening of all users
- Blocked countries: Transactions involving Myanmar junta-controlled banks, North Korea, Iran

### 14.5 Data Protection

- **Laos:** PDPA-equivalent law (personal data protection). Must register with Ministry of Post and Telecommunications.
- **Thailand:** Personal Data Protection Act (PDPA) - strong consent requirements, right to deletion.
- **Implementation:**
  - All user data encrypted at rest (AES-256)
  - Data stored in Laos cloud (Huawei Cloud Vientiane)
  - Thai user data: stored in Laos (cross-border permitted with consent)
  - Consent obtained at registration (checkboxes, Lao language)
  - Data deletion: user can request full deletion within 30 days

---

## 15. Security & Fraud

### 15.1 Security Architecture

| Layer | Protection |
|-------|-----------|
| **Network** | TLS 1.3 everywhere, API Gateway rate limiting, IP whitelist for admin |
| **Application** | JWT with short expiry (15 min), refresh token rotation, device binding |
| **API** | Idempotency keys, HMAC signatures for webhooks, request signing |
| **Database** | AES-256 at rest, encryption keys in HSM, regular backups |
| **Bank APIs** | Mutual TLS (mTLS) with Kasikorn and BCEL certificates |

### 15.2 Fraud Detection Rules

| Rule | Description | Action |
|------|-------------|--------|
| **Velocity check** | > 5 transactions from same sender in 1 hour | Flag for manual review |
| **New device + large tx** | New device + > 10,000 THB | Require KYC Level 2 |
| **Unusual location** | Sender IP from Laos but should be Thailand | Additional verification |
| **Amount roundness** | Round numbers in strange patterns (e.g., 9,999) | Flag |
| **Recipient pattern** | Same recipient receiving from many senders | Possible mule (SAR filing) |
| **Mule account** | Agent float moving without corresponding cash | Immediate freeze |

### 15.3 Incident Response

| Severity | Response Time | Example | Action |
|----------|--------------|---------|--------|
| **Critical** | < 15 min | Active fraud ring, data breach | Freeze system, notify banks, notify regulator within 24h |
| **High** | < 1 hour | API outage, payment failures | Failover to backup, notify users |
| **Medium** | < 4 hours | Individual suspicious transactions | Manual review, hold transaction |
| **Low** | < 24 hours | Failed reconciliation (small diff) | Log, investigate, resolve |

---

## 16. Operations & Reconciliation

### 16.1 Daily Operations Checklist

```
07:00 - Check Kasikorn and BCEL balances
08:00 - Fetch FX rate, update published rate
09:00 - Review pending transactions > 1 hour old
10:00 - Agent float check (flag low float)
12:00 - Mid-day reconciliation (Kasikorn vs DB)
15:00 - Batch AML screening (daily run)
17:00 - End-of-day FX conversion
18:00 - Full reconciliation (bank statements vs system)
20:00 - Generate daily report
```

### 16.2 Reconciliation Process

```
Bank Statement (Kasikorn)          System DB
    |                                   |
    +----------- MATCHING -------------+
                    |
    Matched: Transaction IDs cross-reference
    Unmatched: Manual investigation
                    |
    Discrepancies categorized:
    [A] Known timing difference (e.g., end-of-day cutoff)
    [B] Missing webhook (payment received but no webhook)
    [C] Unauthorized deposit (someone sent money to our account)
    [D] System error (double-processing)
                    |
    Resolution:
    [A] Resolve next day
    [B] Manual reconciliation entry
    [C] Return to sender + investigate
    [D] Reverse transaction + refund
```

### 16.3 KPIs Monitored

| KPI | Target | Alert Threshold |
|-----|--------|-----------------|
| Payment to payout time | < 2 min | > 5 min avg |
| Payout success rate | > 99% | < 98% |
| Failed transactions | < 1% | > 3% |
| Unmatched reconciliation items | 0/day | > 5/day |
| Average cost per transaction | < 0.3% | > 0.5% |
| Customer complaints | < 0.1% of transactions | > 0.5% |
| Uptime (API) | 99.9% | < 99.5% |
| App crash-free rate | > 99.5% | < 99% |

---

## 17. Risk Management

### 17.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Exchange rate crash** (LAK devalues > 10% in a day) | Low | High | Hedge via Kasikorn forward contracts. Maintain LAK buffer to cover 3 days of payouts. |
| **Bank partner terminates API access** | Low | Critical | Multi-bank strategy. Have backup agreements with LDB and ST Bank. |
| **Regulatory shutdown** (BoL revokes sandbox) | Medium | Critical | Strict compliance. Regular regulator reporting. Legal counsel on retainer. |
| **Fraud ring exploits agent system** | Medium | High | Agent transaction limits. Real-time monitoring. Agent bonding/insurance. |
| **Cash liquidity crisis** (agents run out of cash) | Medium | Medium | Agent float alerts. BCEL branch backup. Dynamic float rebalancing. |
| **Technology outage** (cloud provider down) | Low | High | Multi-region DR plan. Offline fallback capabilities for critical ops. |
| **Reputation incident** (social media backlash) | Medium | Medium | 24h social media monitoring. Rapid response protocol. |
| **Competition** (TrueMoney/Western Union match our price) | Medium | Medium | Build switching cost via autosend, saved recipients, agent relationships. |

### 17.2 Liquidity Risk Management

```
Liquidity Pool Calculation:
    Daily payout volume: THB equivalent 10M
    + Safety buffer: 3 days = THB equivalent 30M
    + FX volatility buffer: 20% = THB equivalent 6M
    = Total liquidity requirement: THB equivalent 36M

This means:
    Kasikorn balance target: THB 10M (can receive THB 10M/day from senders)
    BCEL balance target: LAK 3.5B (can pay out LAK 3.5B/day)
    Undrawn credit line: THB 3M from Kasikorn (emergency)
```

---

## 18. Financial Projections

### 18.1 Unit Economics

| Item | Amount | % of Send Amount |
|------|--------|-----------------|
| **Revenue** | | |
| FX Spread | 3 LAK/THB (0.52%) | 0.52% |
| Cash Pickup Fee (BCEL/7-Eleven) | 0 | 0% |
| Total Revenue | 3 LAK/THB | 0.52% |
| | | |
| **Costs** | | |
| Kasikorn PromptPay Fee | 0.25% of THB amount | 0.25% |
| BCEL Cash Pickup Fee | 10,000 LAK flat (~0.17% on avg THB 5,000) | 0.17% |
| SMS Notification | 500 LAK | 0.01% |
| Total Cost | | 0.43% |
| | | |
| **Net Margin** | | **0.09%** |
| | | |
| **Net Revenue per Transaction** | | |
| Avg send THB 5,000 | Revenue: THB 26.0 | Cost: THB 21.5 | **Net: THB 4.5 ($0.13)** |

### 18.2 Growth Projections

| Metric | Year 1 | Year 2 | Year 3 | Year 4 |
|--------|--------|--------|--------|--------|
| Active senders (MAU) | 5,000 | 25,000 | 100,000 | 300,000 |
| Avg tx/month | 4,000 | 22,000 | 95,000 | 300,000 |
| Avg tx size (THB) | 5,000 | 5,500 | 6,000 | 6,500 |
| Monthly volume (THB) | 20M | 121M | 570M | 1.95B |
| Annual volume (THB) | 240M | 1.45B | 6.84B | 23.4B |
| Annual volume ($) | $6.8M | $41M | $195M | $669M |
| | | | | |
| **Annual Revenue** | **$35K** | **$213K** | **$1.01M** | **$3.48M** |
| **Annual Cost** | **$24K** | **$146K** | **$695K** | **$2.39M** |
| **Annual Net Revenue** | **$11K** | **$67K** | **$318K** | **$1.09M** |

### 18.3 Cost Structure (Year 1)

| Category | Monthly | Annual | % of Total |
|----------|---------|--------|-----------|
| Engineering team (4 people) | $12,000 | $144,000 | 55% |
| Regulatory & legal | $3,000 | $36,000 | 14% |
| Cloud infrastructure | $2,000 | $24,000 | 9% |
| Bank API fees | $1,500 | $18,000 | 7% |
| Office & admin | $1,000 | $12,000 | 5% |
| Marketing (agent onboarding) | $1,500 | $18,000 | 7% |
| Contingency | $1,000 | $12,000 | 5% |
| **Total** | **$22,000** | **$264,000** | **100%** |

### 18.4 Capital Required

| Phase | Timeline | Capital | Use |
|-------|----------|---------|-----|
| Pre-seed | Month 1-3 | $150K | MVP dev, BCEL partnership, licensing |
| Seed | Month 4-6 | $250K | Launch, agent network, regulatory |
| Series A | Month 7-18 | $2M | Scale to 25K users, Thai license, team expansion |
| Total to profitability | Month 1-24 | ~$2.5M | |

---

## 19. Team & Hiring

### 19.1 Core Team (Year 1)

| Role | Count | Skills | Notes |
|------|-------|--------|-------|
| **Founder / CEO** | 1 | Fintech, cross-border payments, Asia | Must be in Laos or willing to relocate |
| **Backend Engineer (Go)** | 2 | Go, PostgreSQL, API design, fintech | Senior (1 lead + 1 mid) |
| **Mobile Engineer (RN)** | 1 | React Native, push notifications, QR | Can be remote (Thailand/Vietnam) |
| **Compliance Officer** | 1 | AML, KYC, Bank of Laos regulations | Must be Lao national |
| **Operations / Support** | 1 | Lao language, customer support, agent mgmt | First hire after seed |
| | | | |
| **Advisors** | | | |
| Local bank partner | 1 | BCEL executive | Equity or retainer |
| Fintech regulatory lawyer | 1 | Lao + Thai law | Hourly retainer |

### 19.2 Hiring Strategy

- **Laos talent pool:** Very limited. Consider:
  - National University of Laos CS graduates (small but growing)
  - Remote engineers from Thailand (more pool, higher cost)
  - Expat fintech engineers (short-term, transfer knowledge)
- **Key requirement:** Lao language proficiency for ops/compliance roles

---

## 20. Roadmap

### Phase 0: Foundation (Months 1-3)

| Month | Milestone |
|-------|-----------|
| Month 1 | Finalize BCEL partnership agreement. Set up corporate entity (Laos + Thailand). |
| Month 2 | Kasikorn merchant account integration. Build PromptPay QR flow. |
| Month 3 | BCEL payout API integration. MVP sender app (send + BCEL cash pickup). |

### Phase 1: Launch (Months 4-6)

| Month | Milestone |
|-------|-----------|
| Month 4 | Agent app v1. Onboard 5 agents in Bangkok. Agent cash-in flow. |
| Month 5 | Mobile top-up integration (Unitel). 7-Eleven Laos payout integration. |
| Month 6 | Public launch in Savannakhet province. Target 500 senders. |

### Phase 2: Scale Products (Months 7-12)

| Month | Milestone |
|-------|-----------|
| Month 7-8 | TrueMoney integration. Village agent model (onboard 20 agents in Laos). |
| Month 9-10 | Autosend (recurring). Rate alerts. KYC Level 2 and 3 flows. |
| Month 11-12 | BCEL One Wallet integration. LINE bot integration. Target 5,000 senders. |

### Phase 3: Scale Geography (Months 13-18)

| Month | Milestone |
|-------|-----------|
| Month 13-14 | Expand beyond Savannakhet: Champasak, Saravane, Vientiane. |
| Month 15-16 | Expand agent network to 100 agents (TH) and 200 agents (LA). |
| Month 17-18 | Apply for full Mobile Money license (exit sandbox). |

### Phase 4: Regional Expansion (Months 19-24)

| Month | Milestone |
|-------|-----------|
| Month 19-20 | Explore corridor: Laos workers in Vietnam. |
| Month 21-22 | Explore corridor: Laos workers in Korea (E-9 visa workers). |
| Month 23-24 | Profitability. Series A fundraise. |

---

## Appendix: First 30 Days Action Plan

| Day | Action |
|-----|--------|
| 1-5 | Fly to Vientiane. Meet BCEL partnership team. Understand their API and sandbox requirements. |
| 6-10 | Travel to Savannakhet. Interview 20 Lao workers' families. Understand current remittance pain points. |
| 11-15 | Travel to Bangkok. Visit Khlong Toei and Samut Prakan. Interview Lao workers at temples and shops. |
| 16-18 | Set up corporate entity in Laos (NgoenSai (Laos) Co., Ltd.). Open corporate bank account at BCEL. |
| 19-21 | Apply for Bank of Laos Mobile Money Sandbox. (Partner with BCEL as sponsor.) |
| 22-25 | Build MVP backend: Go auth service, Kasikorn PromptPay integration, BCEL payout API integration. |
| 26-28 | Build MVP mobile: React Native app with send flow. |
| 29-30 | Test end-to-end with 3 friends/family in pilot. Fix critical bugs. |

---

*Document version 1.0 - Created June 2026*
