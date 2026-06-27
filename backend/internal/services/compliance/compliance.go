package compliance

import (
	"context"
	"fmt"
	"time"

	"github.com/ngoensai/backend/config"
)

type Repository interface {
	GetTransaction(ctx context.Context, ref string) (*Transaction, error)
	SaveAMLCheck(ctx context.Context, check *AMLCheck) error
	ListFlaggedTransactions(ctx context.Context, status string) ([]Transaction, error)
}

type Transaction struct {
	ID             string
	SenderID       string
	SourceAmount   float64
	RecipientPhone string
	SenderPhone    string
	PaymentMethod  string
	SenderDeviceID string
}

type AMLCheck struct {
	ID             string    `json:"id"`
	TransactionRef string    `json:"transaction_ref"`
	CheckType      string    `json:"check_type"`
	Status         string    `json:"status"`
	FlaggedReason  string    `json:"flagged_reason,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type Service struct {
	repo Repository
	cfg  *config.Config
}

func New(repo Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) ScreenTransaction(ctx context.Context, tx *Transaction) error {
	if tx.SourceAmount > 50000 {
		s.flag(ctx, tx, "amount_exceeds_threshold")
		return fmt.Errorf("flagged: amount exceeds threshold")
	}
	if tx.SenderDeviceID == "" {
		s.flag(ctx, tx, "no_device_id")
		return fmt.Errorf("flagged: no device id")
	}
	return nil
}

func (s *Service) ScreenSanctions(ctx context.Context, name string) error {
	return nil
}

func (s *Service) GenerateSAR(ctx context.Context, tx *Transaction) error {
	return nil
}

func (s *Service) flag(ctx context.Context, tx *Transaction, reason string) {
	s.repo.SaveAMLCheck(ctx, &AMLCheck{
		TransactionRef: tx.ID,
		CheckType:      "automated",
		Status:         "flagged",
		FlaggedReason:  reason,
		CreatedAt:      time.Now(),
	})
}
