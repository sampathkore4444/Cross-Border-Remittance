package core

import "time"

type AMLCheck struct {
	ID             string    `json:"id"`
	TransactionRef string    `json:"transaction_ref"`
	CheckType      string    `json:"check_type"`
	Status         string    `json:"status"`
	Name           string    `json:"name,omitempty"`
	FlaggedReason  string    `json:"flagged_reason,omitempty"`
	Reason         string    `json:"reason,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
