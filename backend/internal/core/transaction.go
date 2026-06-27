package core

import "time"

type PaymentMethod string

const (
	PayPromptPayQR  PaymentMethod = "promptpay_qr"
	PayBankTransfer PaymentMethod = "bank_transfer"
	PayTrueMoney    PaymentMethod = "truemoney"
	PayAgentCash    PaymentMethod = "agent_cash"
)

type PayoutMethod string

const (
	PayoutBCELCash     PayoutMethod = "bcel_cash"
	PayoutSevenEleven  PayoutMethod = "seven_eleven_cash"
	PayoutAgentCash    PayoutMethod = "agent_cash"
	PayoutMobileTopUp  PayoutMethod = "mobile_topup"
	PayoutBCELWallet   PayoutMethod = "bcel_wallet"
	PayoutBankTransfer PayoutMethod = "bank_transfer"
)

type PaymentStatus string

const (
	PayPending  PaymentStatus = "pending"
	PayReceived PaymentStatus = "received"
	PayFailed   PaymentStatus = "failed"
	PayRefunded PaymentStatus = "refunded"
	PayExpired  PaymentStatus = "expired"
)

type PayoutStatus string

const (
	POutPending   PayoutStatus = "pending"
	POutInitiated PayoutStatus = "initiated"
	POutCompleted PayoutStatus = "completed"
	POutFailed    PayoutStatus = "failed"
	POutRefunded  PayoutStatus = "refunded"
)

type Transaction struct {
	ID             string `json:"id"`
	TransactionRef string `json:"transaction_ref"`
	IdempotencyKey string `json:"-"`
	SenderID       string `json:"sender_id"`
	SenderDeviceID string `json:"-"`

	SourceCurrency   string        `json:"source_currency"`
	SourceAmount     float64       `json:"source_amount"`
	SourceFee        float64       `json:"source_fee"`
	PaymentMethod    PaymentMethod `json:"payment_method"`
	PaymentReference string        `json:"payment_reference,omitempty"`
	PaymentStatus    PaymentStatus `json:"payment_status"`

	ExchangeRate  float64    `json:"exchange_rate"`
	MidMarketRate float64    `json:"mid_market_rate,omitempty"`
	RateLockedAt  *time.Time `json:"rate_locked_at,omitempty"`

	TargetCurrency  string       `json:"target_currency"`
	TargetAmount    int64        `json:"target_amount"`
	PayoutMethod    PayoutMethod `json:"payout_method"`
	PayoutStatus    PayoutStatus `json:"payout_status"`
	PayoutReference string       `json:"payout_reference,omitempty"`
	PayoutFee       int64        `json:"payout_fee,omitempty"`

	RecipientPhone string `json:"recipient_phone"`
	RecipientName  string `json:"recipient_name"`
	RecipientID    string `json:"recipient_id,omitempty"`

	PickupCode      string     `json:"pickup_code,omitempty"`
	PickupExpiresAt *time.Time `json:"pickup_expires_at,omitempty"`

	QuotedAt    time.Time  `json:"quoted_at"`
	PaidAt      *time.Time `json:"paid_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type TransactionStatusLog struct {
	ID            int64     `json:"id"`
	TransactionID string    `json:"transaction_id"`
	StatusFrom    string    `json:"status_from,omitempty"`
	StatusTo      string    `json:"status_to"`
	ChangedBy     string    `json:"changed_by"`
	Reason        string    `json:"reason,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}
