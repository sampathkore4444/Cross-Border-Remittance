package core

import "time"

type KYCDocument struct {
	ID         int       `json:"id"`
	UserID     string    `json:"user_id"`
	DocType    string    `json:"doc_type"`
	DocNumber  string    `json:"doc_number,omitempty"`
	FrontURL   string    `json:"front_url,omitempty"`
	BackURL    string    `json:"back_url,omitempty"`
	SelfieURL  string    `json:"selfie_url,omitempty"`
	Status     string    `json:"status"`
	ReviewerID string    `json:"reviewer_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
