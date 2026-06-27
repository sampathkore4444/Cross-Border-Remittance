package compliance

import (
	"context"
	"fmt"
	"time"

	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/core"
)

type Repository interface {
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	SaveAMLCheck(ctx context.Context, check *core.AMLCheck) error
	ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error)
}

type Service struct {
	repo Repository
	cfg  *config.Config
}

func New(repo Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) ScreenTransaction(ctx context.Context, tx *core.Transaction) error {
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

func (s *Service) GenerateSAR(ctx context.Context, tx *core.Transaction) error {
	return nil
}

func (s *Service) flag(ctx context.Context, tx *core.Transaction, reason string) {
	s.repo.SaveAMLCheck(ctx, &core.AMLCheck{
		TransactionRef: tx.ID,
		CheckType:      "automated",
		Status:         "flagged",
		FlaggedReason:  reason,
		CreatedAt:      time.Now(),
	})
}
