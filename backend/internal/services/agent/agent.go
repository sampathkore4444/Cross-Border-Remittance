package agent

import (
	"context"
	"fmt"
	"time"

	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/core"
	"github.com/redis/go-redis/v9"
)

type Repository interface {
	CreateAgent(ctx context.Context, a *core.Agent) error
	GetAgent(ctx context.Context, id string) (*core.Agent, error)
	GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error)
	ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error)
	UpdateFloat(ctx context.Context, agentID string, amount int64) error
	AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error
	GetFloatBalance(ctx context.Context, agentID string) (int64, error)
}

type Service struct {
	repo  Repository
	redis *redis.Client
	cfg   *config.Config
}

func New(repo Repository, rdb *redis.Client, cfg *config.Config) *Service {
	return &Service{repo: repo, redis: rdb, cfg: cfg}
}

func (s *Service) RegisterAgent(ctx context.Context, agent *core.Agent) error {
	agent.CreatedAt = time.Now()
	agent.IsActive = true
	return s.repo.CreateAgent(ctx, agent)
}

func (s *Service) ProcessCashIn(ctx context.Context, agentID string, amountTHB float64, senderPhone, recipientPhone string) (string, error) {
	balance, err := s.repo.GetFloatBalance(ctx, agentID)
	if err != nil {
		return "", fmt.Errorf("get float: %w", err)
	}
	if balance < int64(amountTHB*100) {
		return "", fmt.Errorf("insufficient float balance")
	}

	ref := fmt.Sprintf("CI-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)
	s.repo.UpdateFloat(ctx, agentID, -int64(amountTHB*100))
	s.repo.AddFloatTransaction(ctx, &core.FloatTransaction{
		AgentID:       agentID,
		Type:          "cash_in",
		Amount:        int64(amountTHB * 100),
		BalanceBefore: balance,
		BalanceAfter:  balance - int64(amountTHB*100),
		Reference:     ref,
	})
	return ref, nil
}

func (s *Service) ProcessCashOut(ctx context.Context, agentID string, amountLAK int64, recipientPhone string) (string, error) {
	balance, err := s.repo.GetFloatBalance(ctx, agentID)
	if err != nil {
		return "", fmt.Errorf("get float: %w", err)
	}
	if balance < amountLAK {
		return "", fmt.Errorf("insufficient float: have %d, need %d", balance, amountLAK)
	}

	code := fmt.Sprintf("CO-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)
	s.repo.UpdateFloat(ctx, agentID, -amountLAK)
	s.repo.AddFloatTransaction(ctx, &core.FloatTransaction{
		AgentID:       agentID,
		Type:          "cash_out",
		Amount:        amountLAK,
		BalanceBefore: balance,
		BalanceAfter:  balance - amountLAK,
		Reference:     code,
	})
	return code, nil
}

func (s *Service) GetAgent(ctx context.Context, id string) (*core.Agent, error) {
	return s.repo.GetAgent(ctx, id)
}

func (s *Service) DepositFloat(ctx context.Context, agentID string, amount int64, method string) error {
	balance, err := s.repo.GetFloatBalance(ctx, agentID)
	if err != nil {
		return err
	}
	s.repo.UpdateFloat(ctx, agentID, amount)
	s.repo.AddFloatTransaction(ctx, &core.FloatTransaction{
		AgentID:       agentID,
		Type:          "deposit",
		Amount:        amount,
		BalanceBefore: balance,
		BalanceAfter:  balance + amount,
		Method:        method,
	})
	return nil
}
