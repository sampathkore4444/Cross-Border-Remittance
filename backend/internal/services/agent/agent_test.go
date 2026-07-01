package agent

import (
	"context"
	"testing"
	"time"

	"github.com/ngoensai/backend/internal/core"
)

type mockRepo struct {
	agents map[string]*core.Agent
	txns   []core.FloatTransaction
}

func (m *mockRepo) CreateAgent(ctx context.Context, a *core.Agent) error {
	a.ID = "test-agent-1"
	m.agents[a.ID] = a
	return nil
}
func (m *mockRepo) GetAgent(ctx context.Context, id string) (*core.Agent, error) {
	return m.agents[id], nil
}
func (m *mockRepo) GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error) {
	for _, a := range m.agents {
		if a.UserID == userID {
			return a, nil
		}
	}
	return nil, nil
}
func (m *mockRepo) ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) ListAgentTransactions(ctx context.Context, agentID string, limit int) ([]core.FloatTransaction, error) {
	return m.txns, nil
}
func (m *mockRepo) UpdateFloat(ctx context.Context, agentID string, amount int64) error {
	a := m.agents[agentID]
	a.FloatBalanceLAK += amount
	return nil
}
func (m *mockRepo) AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error {
	m.txns = append(m.txns, *tx)
	return nil
}
func (m *mockRepo) GetFloatBalance(ctx context.Context, agentID string) (int64, error) {
	a := m.agents[agentID]
	return a.FloatBalanceLAK, nil
}
func (m *mockRepo) UpdateCommission(ctx context.Context, agentID string, amount int64) error {
	a := m.agents[agentID]
	a.CommissionTotal += amount
	return nil
}

func newTestRepo() *mockRepo {
	return &mockRepo{
		agents: map[string]*core.Agent{
			"test-agent-1": {
				ID:              "test-agent-1",
				UserID:          "user-1",
				Name:            "Test Agent",
				FloatBalanceLAK: 5000000,
				CommissionRate:  0.5,
				CommissionTotal: 0,
				IsActive:        true,
				CreatedAt:       time.Now(),
			},
		},
	}
}

func TestProcessCashOutCommission(t *testing.T) {
	repo := newTestRepo()
	svc := &Service{repo: repo}

	_, err := svc.ProcessCashOut(context.Background(), "test-agent-1", 100000, "856201234567")
	if err != nil {
		t.Fatalf("ProcessCashOut failed: %v", err)
	}

	agent := repo.agents["test-agent-1"]
	// CommissionRate is 0.5%, so 100000 * 0.5 / 100 = 500
	if agent.CommissionTotal != 500 {
		t.Fatalf("expected commission 500, got %d", agent.CommissionTotal)
	}
}

func TestProcessCashInCommission(t *testing.T) {
	repo := newTestRepo()
	svc := &Service{repo: repo}

	_, err := svc.ProcessCashIn(context.Background(), "test-agent-1", 1000.0, "856201234567", "856209876543")
	if err != nil {
		t.Fatalf("ProcessCashIn failed: %v", err)
	}

	agent := repo.agents["test-agent-1"]
	// amountTHB=1000, converted to satang = 100000 satang
	// CommissionRate is 0.5%, so 100000 * 0.5 / 100 = 500
	if agent.CommissionTotal != 500 {
		t.Fatalf("expected commission 500, got %d", agent.CommissionTotal)
	}
}

func TestProcessCashOutInsufficientFloat(t *testing.T) {
	repo := newTestRepo()
	svc := &Service{repo: repo}

	_, err := svc.ProcessCashOut(context.Background(), "test-agent-1", 10000000, "856201234567")
	if err == nil {
		t.Fatal("expected insufficient float error, got nil")
	}
}
