package core

import "time"

type Autosend struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	SenderID     string     `json:"sender_id"`
	RecipientID  string     `json:"recipient_id"`
	Amount       float64    `json:"amount"`
	AmountTHB    float64    `json:"amount_thb"`
	Frequency    string     `json:"frequency"`
	NextSendAt   time.Time  `json:"next_send_at"`
	LastSendAt   *time.Time `json:"last_send_at,omitempty"`
	PayoutMethod string     `json:"payout_method"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
}
