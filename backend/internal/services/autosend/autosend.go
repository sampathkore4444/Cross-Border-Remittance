package autosend

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ngoensai/backend/config"
)

type Autosend struct {
	ID           string     `json:"id"`
	SenderID     string     `json:"sender_id"`
	RecipientID  string     `json:"recipient_id"`
	AmountTHB    float64    `json:"amount_thb"`
	Frequency    string     `json:"frequency"`
	NextSendAt   time.Time  `json:"next_send_at"`
	LastSendAt   *time.Time `json:"last_send_at,omitempty"`
	PayoutMethod string     `json:"payout_method"`
	IsActive     bool       `json:"is_active"`
}

type Repository interface {
	ListDueAutosends(ctx context.Context) ([]Autosend, error)
	GetAutosend(ctx context.Context, id string) (*Autosend, error)
	UpdateLastSent(ctx context.Context, id string, lastSent time.Time, nextSend time.Time) error
	DeactivateAutosend(ctx context.Context, id string) error
}

type PaymentService interface {
	InitiatePayment(ctx context.Context, senderID, txRef string, method string) (map[string]interface{}, error)
}

type FXService interface {
	GetRate(ctx context.Context) (float64, float64, error)
}

type Service struct {
	repo   Repository
	paySvc PaymentService
	fxSvc  FXService
	cfg    *config.Config
}

func New(r Repository, p PaymentService, f FXService, cfg *config.Config) *Service {
	return &Service{repo: r, paySvc: p, fxSvc: f, cfg: cfg}
}

func (s *Service) StartScheduler() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			s.processDue()
		}
	}()
	log.Println("autosend: scheduler started")
}

func (s *Service) processDue() {
	ctx := context.Background()
	due, err := s.repo.ListDueAutosends(ctx)
	if err != nil {
		log.Printf("autosend: list error: %v", err)
		return
	}
	for _, a := range due {
		if err := s.execute(ctx, &a); err != nil {
			log.Printf("autosend: execute %s error: %v", a.ID, err)
		}
	}
}

func (s *Service) execute(ctx context.Context, a *Autosend) error {
	rate, _, err := s.fxSvc.GetRate(ctx)
	if err != nil {
		return fmt.Errorf("get rate: %w", err)
	}
	txRef := fmt.Sprintf("AUTO-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano())
	_, err = s.paySvc.InitiatePayment(ctx, a.SenderID, txRef, a.PayoutMethod)
	if err != nil {
		return fmt.Errorf("initiate: %w", err)
	}

	now := time.Now()
	nextSend := s.calculateNextSend(now, a.Frequency)
	s.repo.UpdateLastSent(ctx, a.ID, now, nextSend)
	log.Printf("autosend: executed %s, next: %s", a.ID, nextSend)
	return nil
}

func (s *Service) calculateNextSend(from time.Time, frequency string) time.Time {
	switch frequency {
	case "weekly":
		return from.AddDate(0, 0, 7)
	case "biweekly":
		return from.AddDate(0, 0, 14)
	case "monthly":
		return from.AddDate(0, 1, 0)
	default:
		return from.AddDate(0, 1, 0)
	}
}
