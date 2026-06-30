package core

import "time"

type WebhookLog struct {
	ID             string    `json:"id"`
	EventType      string    `json:"event_type"`
	Source         string    `json:"source"`
	TransactionRef string    `json:"transaction_ref,omitempty"`
	RequestBody    string    `json:"request_body,omitempty"`
	ResponseStatus int       `json:"response_status"`
	SignatureValid bool      `json:"signature_valid"`
	Error          string    `json:"error,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
