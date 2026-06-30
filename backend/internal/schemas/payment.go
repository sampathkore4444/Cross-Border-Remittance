package schemas

type QuoteRequest struct {
	SourceAmount   float64 `json:"source_amount" binding:"required"`
	SourceCurrency string  `json:"source_currency" default:"THB"`
	TargetCurrency string  `json:"target_currency" default:"LAK"`
	PayoutMethod   string  `json:"payout_method" binding:"required"`
	RecipientPhone string  `json:"recipient_phone" binding:"required"`
}

type QuoteResponse struct {
	QuoteID       string         `json:"quote_id"`
	SourceAmount  float64        `json:"source_amount"`
	ExchangeRate  float64        `json:"exchange_rate"`
	TargetAmount  int64          `json:"target_amount"`
	FeeBreakdown  FeeBreakdown   `json:"fee_breakdown"`
	PayoutOptions []PayoutOption `json:"payout_options"`
	RateExpiresAt string         `json:"rate_expires_at"`
}

type FeeBreakdown struct {
	FXMargin     float64 `json:"fx_margin"`
	PayoutFee    float64 `json:"payout_fee"`
	TotalPercent float64 `json:"total_fee_percent"`
}

type PayoutOption struct {
	Method       string `json:"method"`
	TargetAmount int64  `json:"target_amount"`
	PickupTime   string `json:"pickup_time"`
}

type SendRequest struct {
	IdempotencyKey string `json:"idempotency_key" binding:"required"`
	QuoteID        string `json:"quote_id" binding:"required"`
	Recipient      struct {
		Phone        string `json:"phone" binding:"required"`
		Name         string `json:"name" binding:"required"`
		Relationship string `json:"relationship"`
		Province     string `json:"province"`
	} `json:"recipient" binding:"required"`
	PayoutMethod  string `json:"payout_method" binding:"required"`
	PaymentMethod string `json:"payment_method" binding:"required"`
}

type SendResponse struct {
	TransactionRef string      `json:"transaction_ref"`
	Status         string      `json:"status"`
	Payment        PaymentInfo `json:"payment"`
}

type PaymentInfo struct {
	Method    string  `json:"method"`
	QRCode    string  `json:"qr_code,omitempty"`
	Amount    float64 `json:"amount"`
	ExpiresAt string  `json:"expires_at"`
}

type RecipientRequest struct {
	Phone        string `json:"phone" binding:"required"`
	Name         string `json:"name" binding:"required"`
	Province     string `json:"province"`
	Relationship string `json:"relationship"`
}

type TransactionResponse struct {
	TransactionRef string  `json:"transaction_ref"`
	SourceAmount   float64 `json:"source_amount"`
	SourceCurrency string  `json:"source_currency"`
	TargetAmount   int64   `json:"target_amount"`
	TargetCurrency string  `json:"target_currency"`
	ExchangeRate   float64 `json:"exchange_rate"`
	RecipientName  string  `json:"recipient_name"`
	RecipientPhone string  `json:"recipient_phone"`
	Status         string  `json:"status"`
	CreatedAt      string  `json:"created_at"`
	CompletedAt    string  `json:"completed_at,omitempty"`
}
