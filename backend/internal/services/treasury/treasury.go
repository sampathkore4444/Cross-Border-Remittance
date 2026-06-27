package treasury

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ngoensai/backend/config"
)

type Repository interface {
	GetDailyVolume(ctx context.Context, date string) (totalTHB float64, totalLAK int64, err error)
	SaveReconciliation(ctx context.Context, r *Reconciliation) error
	GetReconciliation(ctx context.Context, date string) (*Reconciliation, error)
}

type FXService interface {
	ConvertTHBtoLAK(ctx context.Context, amountTHB float64) (int64, error)
	GetRate(ctx context.Context) (float64, float64, error)
}

type Reconciliation struct {
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

type Service struct {
	repo Repository
	fx   FXService
	cfg  *config.Config
}

func New(repo Repository, fx FXService, cfg *config.Config) *Service {
	return &Service{repo: repo, fx: fx, cfg: cfg}
}

func (s *Service) StartAutoConversion() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			ctx := context.Background()
			volTHB, _, err := s.repo.GetDailyVolume(ctx, time.Now().Format("2006-01-02"))
			if err != nil {
				continue
			}
			if volTHB > 100000 {
				s.executeConversion(ctx, volTHB*0.8)
			}
		}
	}()
}

func (s *Service) executeConversion(ctx context.Context, amountTHB float64) (int64, error) {
	laKamount, err := s.fx.ConvertTHBtoLAK(ctx, amountTHB)
	if err != nil {
		return 0, fmt.Errorf("convert: %w", err)
	}
	log.Printf("treasury: converted %.2f THB to %d LAK", amountTHB, laKamount)
	return laKamount, nil
}

func (s *Service) RunDailyReconciliation(ctx context.Context) error {
	date := time.Now().Add(-24 * time.Hour).Format("2006-01-02")
	existing, _ := s.repo.GetReconciliation(ctx, date)
	if existing != nil {
		return fmt.Errorf("reconciliation already exists for %s", date)
	}

	totalTHB, totalLAK, _ := s.repo.GetDailyVolume(ctx, date)

	recon := &Reconciliation{
		Date:             date,
		BankAccountID:    "KASIKORN-THB-001",
		BankCloseBalance: totalTHB,
		SystemBalance:    float64(totalLAK),
		Status:           "pending",
		CreatedAt:        time.Now(),
	}
	return s.repo.SaveReconciliation(ctx, recon)
}

func (s *Service) GetBalanceSummary(ctx context.Context) (map[string]interface{}, error) {
	return map[string]interface{}{
		"kasikorn_thb": 8450000,
		"bcel_lak":     452000000,
		"fx_position": map[string]interface{}{
			"pending_sells":   2150000,
			"avg_rate_locked": 574.5,
			"current_market":  577.0,
			"unrealized_pnl":  5375,
		},
	}, nil
}
