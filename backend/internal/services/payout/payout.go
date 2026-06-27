package payout

import (
	"context"
	"fmt"
	"time"

	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/core"
	"github.com/rabbitmq/amqp091-go"
)

type Repository interface {
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	UpdatePayoutStatus(ctx context.Context, ref string, status core.PayoutStatus, payoutRef string, completedAt *time.Time) error
	UpdatePickupCollected(ctx context.Context, pickupCode string, collectedAt time.Time) error
	SaveTransactionLog(ctx context.Context, log *core.TransactionStatusLog) error
}

type NotificationService interface {
	SendSMS(ctx context.Context, phone, message string) error
	SendPush(ctx context.Context, userID, title, body string) error
}

type Service struct {
	repo  Repository
	queue *amqp091.Channel
	notif NotificationService
	cfg   *config.Config
}

func New(repo Repository, q *amqp091.Channel, notif NotificationService, cfg *config.Config) *Service {
	return &Service{repo: repo, queue: q, notif: notif, cfg: cfg}
}

func (s *Service) ProcessPayout(ctx context.Context, ref string) error {
	tx, err := s.repo.GetTransaction(ctx, ref)
	if err != nil {
		return fmt.Errorf("get tx: %w", err)
	}

	switch tx.PayoutMethod {
	case core.PayoutBCELCash:
		return s.payoutBCEL(ctx, tx)
	case core.PayoutSevenEleven:
		return s.payoutSevenEleven(ctx, tx)
	case core.PayoutAgentCash:
		return s.payoutAgent(ctx, tx)
	case core.PayoutMobileTopUp:
		return s.payoutMobileTopUp(ctx, tx)
	case core.PayoutBCELWallet:
		return s.payoutBCELWallet(ctx, tx)
	default:
		return fmt.Errorf("unsupported payout method: %s", tx.PayoutMethod)
	}
}

func (s *Service) payoutBCEL(ctx context.Context, tx *core.Transaction) error {
	pickupCode := generatePickupCode()

	resp, err := s.callBCELAPI(ctx, map[string]interface{}{
		"reference_id":    tx.TransactionRef,
		"amount_LAK":      tx.TargetAmount,
		"pickup_code":     pickupCode,
		"recipient_phone": tx.RecipientPhone,
		"recipient_name":  tx.RecipientName,
		"expiry_days":     7,
	})
	if err != nil {
		return s.handlePayoutFailure(ctx, tx, err)
	}

	now := time.Now()
	ref := resp["transaction_id"].(string)
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutCompleted, ref, &now)

	msg := fmt.Sprintf(
		"ເງິນສົ່ງຈາກ %s ຈຳນວນ %d ກີບ ພ້ອມຮັບແລ້ວ! ໄປຮັບທີ່ BCEL: ໃຊ້ລະຫັດ %s + ເບີໂທ %s. ມີອາຍຸ 7 ວັນ.",
		tx.RecipientName, tx.TargetAmount, pickupCode, tx.RecipientPhone,
	)
	s.notif.SendSMS(ctx, tx.RecipientPhone, msg)
	s.notif.SendPush(ctx, tx.SenderID, "ເງິນພ້ອມຮັບແລ້ວ", msg)

	return nil
}

func (s *Service) payoutMobileTopUp(ctx context.Context, tx *core.Transaction) error {
	resp, err := s.callTelcoAPI(ctx, tx.RecipientPhone, tx.TargetAmount)
	if err != nil {
		return s.handlePayoutFailure(ctx, tx, err)
	}

	now := time.Now()
	ref := resp["transaction_id"].(string)
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutCompleted, ref, &now)

	msg := fmt.Sprintf("ທ່ານໄດ້ຮັບເງິນເຕີມໂທລະສັບ %d ກີບ ຈາກ %s ຜ່ານ NgoenSai",
		tx.TargetAmount, tx.RecipientName)
	s.notif.SendSMS(ctx, tx.RecipientPhone, msg)
	s.notif.SendPush(ctx, tx.SenderID, "ເຕີມເງິນສຳເລັດ", msg)

	return nil
}

func (s *Service) payoutSevenEleven(ctx context.Context, tx *core.Transaction) error {
	pickupCode := generatePickupCode()
	resp, err := s.callSevenElevenAPI(ctx, map[string]interface{}{
		"reference":       tx.TransactionRef,
		"amount":          tx.TargetAmount,
		"pickup_code":     pickupCode,
		"recipient_phone": tx.RecipientPhone,
	})
	if err != nil {
		return s.handlePayoutFailure(ctx, tx, err)
	}

	now := time.Now()
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutCompleted, resp["id"].(string), &now)

	msg := fmt.Sprintf("ຮັບເງິນ %d ກີບ ທີ່ 7-Eleven: ລະຫັດ %s", tx.TargetAmount, pickupCode)
	s.notif.SendSMS(ctx, tx.RecipientPhone, msg)
	return nil
}

func (s *Service) payoutAgent(ctx context.Context, tx *core.Transaction) error {
	agentRef := fmt.Sprintf("AGT-%s", tx.TransactionRef)
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutInitiated, agentRef, nil)

	msg := fmt.Sprintf("ກະລຸນາຈ່າຍເງິນ %d ກີບ ໃຫ້ %s. ລະຫັດ: %s",
		tx.TargetAmount, tx.RecipientPhone, agentRef)
	s.queue.Publish("ngoensai", "agent.payout_notify", false, false,
		amqp091.Publishing{ContentType: "application/json", Body: []byte(msg)})
	return nil
}

func (s *Service) payoutBCELWallet(ctx context.Context, tx *core.Transaction) error {
	resp, err := s.callBCELWalletAPI(ctx, tx.RecipientPhone, tx.TargetAmount)
	if err != nil {
		return s.handlePayoutFailure(ctx, tx, err)
	}
	now := time.Now()
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutCompleted, resp["ref"].(string), &now)
	return nil
}

func (s *Service) ConfirmPickup(ctx context.Context, pickupCode string) error {
	s.repo.UpdatePickupCollected(ctx, pickupCode, time.Now())
	return nil
}

func (s *Service) handlePayoutFailure(ctx context.Context, tx *core.Transaction, err error) error {
	s.repo.UpdatePayoutStatus(ctx, tx.TransactionRef, core.POutFailed, "", nil)
	s.repo.SaveTransactionLog(ctx, &core.TransactionStatusLog{
		TransactionID: tx.TransactionRef,
		StatusFrom:    string(core.POutInitiated),
		StatusTo:      string(core.POutFailed),
		Reason:        err.Error(),
	})
	s.queue.Publish("ngoensai", "payout.retry", false, false,
		amqp091.Publishing{ContentType: "application/json", Body: []byte(tx.TransactionRef)})
	return fmt.Errorf("payout failed, queued retry: %w", err)
}

func (s *Service) callBCELAPI(ctx context.Context, payload map[string]interface{}) (map[string]interface{}, error) {
	return map[string]interface{}{"transaction_id": "BCEL-" + payload["pickup_code"].(string)}, nil
}

func (s *Service) callTelcoAPI(ctx context.Context, phone string, amount int64) (map[string]interface{}, error) {
	return map[string]interface{}{"transaction_id": "TELCO-" + phone}, nil
}

func (s *Service) callSevenElevenAPI(ctx context.Context, payload map[string]interface{}) (map[string]interface{}, error) {
	return map[string]interface{}{"id": "7ELEVEN-" + payload["pickup_code"].(string)}, nil
}

func (s *Service) callBCELWalletAPI(ctx context.Context, phone string, amount int64) (map[string]interface{}, error) {
	return map[string]interface{}{"ref": "BCELW-" + phone}, nil
}

func generatePickupCode() string {
	return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
}
