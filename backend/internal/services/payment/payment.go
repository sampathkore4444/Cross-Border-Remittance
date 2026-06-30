package payment

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/core"
	"github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type Repository interface {
	CreateTransaction(ctx context.Context, tx *core.Transaction) error
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	UpdatePaymentStatus(ctx context.Context, ref string, status core.PaymentStatus, paidAt time.Time, payRef string) error
	ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error)
	GetTransactionByIdempotency(ctx context.Context, key string) (*core.Transaction, error)
	CreateRecipient(ctx context.Context, r *core.RecipientProfile) error
	ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error)
}

type FXService interface {
	GetRate(ctx context.Context) (float64, float64, error)
	LockRate(ctx context.Context, txRef string, rate float64) error
}

type Service struct {
	repo  Repository
	redis *redis.Client
	queue *amqp091.Channel
	fxSvc FXService
	cfg   *config.Config
}

func New(repo Repository, rdb *redis.Client, q *amqp091.Channel, fxSvc FXService, cfg *config.Config) *Service {
	return &Service{repo: repo, redis: rdb, queue: q, fxSvc: fxSvc, cfg: cfg}
}

func (s *Service) Quote(ctx context.Context, sourceAmount float64, payoutMethod core.PayoutMethod) (*core.Transaction, error) {
	rate, midRate, err := s.fxSvc.GetRate(ctx)
	if err != nil {
		return nil, fmt.Errorf("get rate: %w", err)
	}
	targetAmount := int64(sourceAmount * rate)

	switch payoutMethod {
	case core.PayoutSevenEleven:
		targetAmount -= 10000
	case core.PayoutMobileTopUp:
		targetAmount = int64(float64(targetAmount) * 0.97)
	}

	tx := &core.Transaction{
		ID:             uuid.New().String(),
		TransactionRef: fmt.Sprintf("TXN-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:8]),
		SourceCurrency: "THB",
		SourceAmount:   sourceAmount,
		ExchangeRate:   rate,
		MidMarketRate:  midRate,
		TargetCurrency: "LAK",
		TargetAmount:   targetAmount,
		PayoutMethod:   payoutMethod,
		PaymentStatus:  core.PayPending,
		PayoutStatus:   core.POutPending,
		QuotedAt:       time.Now(),
	}
	return tx, nil
}

func (s *Service) InitiatePayment(ctx context.Context, senderID string, txRef string, method core.PaymentMethod) (map[string]interface{}, error) {
	tx, err := s.repo.GetTransaction(ctx, txRef)
	if err != nil {
		return nil, fmt.Errorf("transaction not found")
	}
	tx.PaymentMethod = method
	tx.SenderID = senderID
	tx.IdempotencyKey = uuid.New().String()

	if err := s.repo.CreateTransaction(ctx, tx); err != nil {
		return nil, fmt.Errorf("save tx: %w", err)
	}

	switch method {
	case core.PayPromptPayQR:
		qr, expiresAt, err := s.generatePromptPayQR(ctx, tx.SourceAmount, tx.TransactionRef)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{
			"method":     "promptpay_qr",
			"qr_code":    qr,
			"amount":     tx.SourceAmount,
			"expires_at": expiresAt,
		}, nil

	case core.PayTrueMoney:
		url, err := s.generateTrueMoneyURL(ctx, tx.SourceAmount, tx.TransactionRef)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{
			"method": "truemoney",
			"url":    url,
			"amount": tx.SourceAmount,
		}, nil

	case core.PayAgentCash:
		return map[string]interface{}{
			"method":          "agent_cash",
			"amount":          tx.SourceAmount,
			"agent_code":      tx.TransactionRef,
			"instructions_lo": "ນຳລະຫັດນີ້ໄປຈ່າຍທີ່ຮ້ານຕົວແທນ",
		}, nil

	default:
		return nil, fmt.Errorf("unsupported payment method: %s", method)
	}
}

func (s *Service) ConfirmPayment(ctx context.Context, ref, providerRef string) error {
	now := time.Now()
	err := s.repo.UpdatePaymentStatus(ctx, ref, core.PayReceived, now, providerRef)
	if err != nil {
		return fmt.Errorf("update payment: %w", err)
	}
	s.enqueuePayout(ctx, ref)
	return nil
}

func (s *Service) ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error) {
	return s.repo.ListTransactions(ctx, senderID, page, limit)
}

func (s *Service) GetTransaction(ctx context.Context, ref string) (*core.Transaction, error) {
	return s.repo.GetTransaction(ctx, ref)
}

func (s *Service) ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error) {
	return s.repo.ListRecipients(ctx, userID)
}

func (s *Service) SaveRecipient(ctx context.Context, userID string, r core.RecipientProfile) error {
	r.CreatedBy = userID
	return s.repo.CreateRecipient(ctx, &r)
}

func (s *Service) generatePromptPayQR(ctx context.Context, amount float64, ref string) (string, time.Time, error) {
	expiresAt := time.Now().Add(15 * time.Minute)
	qrPayload := map[string]interface{}{
		"amount":      amount,
		"reference":   ref,
		"type":        "promptpay_merchant",
		"merchant_id": s.cfg.KasikornAcctNo,
	}
	data, _ := json.Marshal(qrPayload)
	return string(data), expiresAt, nil
}

func (s *Service) generateTrueMoneyURL(ctx context.Context, amount float64, ref string) (string, error) {
	return fmt.Sprintf("https://truemoney.com/pay?merchant=%s&amount=%.2f&ref=%s",
		s.cfg.TrueMoneyKey, amount, ref), nil
}

func (s *Service) enqueuePayout(ctx context.Context, ref string) {
	body, _ := json.Marshal(map[string]string{"ref": ref})
	s.queue.Publish("ngoensai", "payout.initiate", false, false,
		amqp091.Publishing{ContentType: "application/json", Body: body})
}
