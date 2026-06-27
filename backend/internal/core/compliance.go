package core

import "time"

type AMLCheck struct {
	ID             string    `json:"id"`
	TransactionRef string    `json:"transaction_ref"`
	CheckType      string    `json:"check_type"`
	Status         string    `json:"status"`
	FlaggedReason  string    `json:"flagged_reason,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
