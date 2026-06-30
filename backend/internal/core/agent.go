package core

import "time"

type AgentType string

const (
	AgentCashIn  AgentType = "cash_in_agent"
	AgentCashOut AgentType = "cash_out_agent"
)

type Agent struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	Province     string    `json:"province"`
	ShopName     string    `json:"shop_name"`
	ShopAddress  string    `json:"shop_address,omitempty"`
	ShopProvince string    `json:"shop_province"`
	ShopLat      float64   `json:"shop_lat,omitempty"`
	ShopLng      float64   `json:"shop_lng,omitempty"`
	Country      string    `json:"country"`
	AgentType    AgentType `json:"agent_type"`

	FloatBalanceLAK int64   `json:"float_balance_lak"`
	FloatBalanceTHB float64 `json:"float_balance_thb"`
	FloatMinimum    int64   `json:"float_minimum"`
	FloatMaximum    int64   `json:"float_maximum,omitempty"`

	CommissionRate  float64 `json:"commission_rate"`
	CommissionTotal int64   `json:"commission_total"`

	IsActive          bool       `json:"is_active"`
	KYCStatus         string     `json:"kyc_status"`
	AgreementSignedAt *time.Time `json:"agreement_signed_at,omitempty"`
	LastActivityAt    *time.Time `json:"last_activity_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type FloatTransaction struct {
	ID            string    `json:"id"`
	AgentID       string    `json:"agent_id"`
	Type          string    `json:"type"` // deposit, withdrawal, cash_in, cash_out, adjustment
	Amount        int64     `json:"amount"`
	BalanceBefore int64     `json:"balance_before"`
	BalanceAfter  int64     `json:"balance_after"`
	Reference     string    `json:"reference,omitempty"`
	Method        string    `json:"method,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}
