package core

import "time"

type Autosend struct {
	ID           string     `json:"id"`
	SenderID     string     `json:"sender_id"`
	RecipientID  string     `json:"recipient_id"`
	AmountTHB    float64    `json:"amount_thb"`
	Frequency    string     `json:"frequency"`
	NextSendAt   time.Time  `json:"next_send_at"`
	LastSendAt   *time.Time `json:"last_send_at,omitempty"`
	PayoutMethod string     `json:"payout_method"`
	IsActive     bool       `json:"is_active"`
}
