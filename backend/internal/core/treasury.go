package core

import "time"

type TreasuryReconciliation struct {
	ID               string    `json:"id"`
	Date             string    `json:"date"`
	BankAccountID    string    `json:"bank_account_id"`
	BankOpenBalance  float64   `json:"bank_open_balance"`
	BankCloseBalance float64   `json:"bank_close_balance"`
	BankTotalCredits float64   `json:"bank_total_credits"`
	BankTotalDebits  float64   `json:"bank_total_debits"`
	SystemBalance    float64   `json:"system_balance"`
	Difference       float64   `json:"difference"`
	DifferenceReason string    `json:"difference_reason,omitempty"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}
