package core

import "time"

type RecipientProfile struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Phone           string    `json:"phone"`
	Name            string    `json:"name"`
	Province        string    `json:"province,omitempty"`
	District        string    `json:"district,omitempty"`
	Village         string    `json:"village,omitempty"`
	PreferredPayout string    `json:"preferred_payout,omitempty"`
	BirthYear       string    `json:"birth_year,omitempty"`
	Relationship    string    `json:"relationship,omitempty"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
}
