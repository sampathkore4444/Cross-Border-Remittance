package tests

import (
	"context"
	"testing"
	"time"

	"github.com/ngoensai/backend/internal/core"
	"github.com/ngoensai/backend/internal/repositories"
	"github.com/ngoensai/backend/internal/services/agent"

	"github.com/redis/go-redis/v9"
)

func newTestPostgres() *repositories.Postgres {
	pg, err := repositories.NewPostgres("inmemory://")
	if err != nil {
		panic(err)
	}
	return pg
}

func newTestRedis() *redis.Client {
	return redis.NewClient(&redis.Options{Addr: "localhost:6379"})
}

func skipIfNoRedis(t *testing.T) {
	t.Helper()
	rdb := newTestRedis()
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		t.Skip("redis not available, skipping")
	}
	rdb.Close()
}

func TestCreateUser(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	user := &core.User{
		Phone:    "+66812345678",
		Role:     core.RoleSender,
		KYCLevel: core.KYCUnverified,
		Language: "lo",
		IsActive: true,
	}

	err := pg.CreateUser(ctx, user)
	if err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	if user.ID == "" {
		t.Fatal("expected user ID to be set")
	}

	got, err := pg.GetUserByPhone(ctx, "+66812345678")
	if err != nil {
		t.Fatalf("GetUserByPhone: %v", err)
	}
	if got.Phone != user.Phone {
		t.Fatalf("expected phone %s, got %s", user.Phone, got.Phone)
	}
}

func TestUpdateKYCLevel(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	user := &core.User{Phone: "+66812345678", Role: core.RoleSender}
	pg.CreateUser(ctx, user)

	err := pg.UpdateKYCLevel(ctx, user.ID, core.KYCLevel1)
	if err != nil {
		t.Fatalf("UpdateKYCLevel: %v", err)
	}

	got, _ := pg.GetUserByID(ctx, user.ID)
	if got.KYCLevel != core.KYCLevel1 {
		t.Fatalf("expected KYC level %s, got %s", core.KYCLevel1, got.KYCLevel)
	}
}

func TestCreateTransaction(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	tx := &core.Transaction{
		TransactionRef: "TXN-TEST-001",
		SourceCurrency: "THB",
		SourceAmount:   5000,
		TargetCurrency: "LAK",
		TargetAmount:   2875000,
		ExchangeRate:   575.0,
		PaymentStatus:  core.PayPending,
		PayoutStatus:   core.POutPending,
	}

	err := pg.CreateTransaction(ctx, tx)
	if err != nil {
		t.Fatalf("CreateTransaction: %v", err)
	}

	got, err := pg.GetTransaction(ctx, "TXN-TEST-001")
	if err != nil {
		t.Fatalf("GetTransaction: %v", err)
	}
	if got.SourceAmount != 5000 {
		t.Fatalf("expected 5000, got %f", got.SourceAmount)
	}
}

func TestListTransactions(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	user := &core.User{Phone: "+66812345678", Role: core.RoleSender}
	pg.CreateUser(ctx, user)

	for i := 0; i < 5; i++ {
		pg.CreateTransaction(ctx, &core.Transaction{
			SenderID:       user.ID,
			TransactionRef: "TXN-LIST-" + string(rune('0'+i)),
			SourceAmount:   1000,
			PaymentStatus:  core.PayPending,
			PayoutStatus:   core.POutPending,
		})
	}

	txs, total, err := pg.ListTransactions(ctx, user.ID, 1, 3)
	if err != nil {
		t.Fatalf("ListTransactions: %v", err)
	}
	if len(txs) != 3 {
		t.Fatalf("expected 3 transactions, got %d", len(txs))
	}
	if total != 5 {
		t.Fatalf("expected total 5, got %d", total)
	}
}

func TestCreateAgent(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	agent := &core.Agent{
		UserID:       "USR-001",
		ShopName:     "Test Shop",
		ShopProvince: "Bangkok",
		Country:      "TH",
		AgentType:    core.AgentCashOut,
	}

	err := pg.CreateAgent(ctx, agent)
	if err != nil {
		t.Fatalf("CreateAgent: %v", err)
	}

	got, err := pg.GetAgent(ctx, agent.ID)
	if err != nil {
		t.Fatalf("GetAgent: %v", err)
	}
	if got.ShopName != "Test Shop" {
		t.Fatalf("expected Test Shop, got %s", got.ShopName)
	}
}

func TestAutosendFullCycle(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()
	now := time.Now()

	auto := &core.Autosend{
		SenderID:   "USR-001",
		AmountTHB:  3000,
		Frequency:  "monthly",
		NextSendAt: now.Add(-1 * time.Hour),
		IsActive:   true,
	}

	err := pg.CreateAutosend(ctx, auto)
	if err != nil {
		t.Fatalf("CreateAutosend: %v", err)
	}

	due, err := pg.ListDueAutosends(ctx)
	if err != nil {
		t.Fatalf("ListDueAutosends: %v", err)
	}
	if len(due) != 1 {
		t.Fatalf("expected 1 due autosend, got %d", len(due))
	}

	nextSend := now.AddDate(0, 1, 0)
	err = pg.UpdateLastSent(ctx, auto.ID, now, nextSend)
	if err != nil {
		t.Fatalf("UpdateLastSent: %v", err)
	}

	deleted := pg.DeactivateAutosend(ctx, auto.ID)
	if deleted != nil {
		t.Fatalf("DeactivateAutosend: %v", deleted)
	}

	got, _ := pg.GetAutosend(ctx, auto.ID)
	if got.IsActive {
		t.Fatal("expected autosend to be inactive")
	}
}

func TestTreasuryReconciliation(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	recon := &core.TreasuryReconciliation{
		Date:             "2026-06-26",
		BankAccountID:    "KASIKORN-THB-001",
		BankCloseBalance: 500000,
		SystemBalance:    499500,
		Difference:       500,
		Status:           "pending",
	}

	err := pg.SaveReconciliation(ctx, recon)
	if err != nil {
		t.Fatalf("SaveReconciliation: %v", err)
	}

	got, err := pg.GetReconciliation(ctx, "2026-06-26")
	if err != nil {
		t.Fatalf("GetReconciliation: %v", err)
	}
	if got.BankCloseBalance != 500000 {
		t.Fatalf("expected 500000, got %f", got.BankCloseBalance)
	}
}

func TestComplianceAMLCheck(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	pg.CreateTransaction(ctx, &core.Transaction{
		TransactionRef: "TXN-AML-001",
		SourceAmount:   60000,
		SenderDeviceID: "",
		PaymentStatus:  core.PayPending,
		PayoutStatus:   core.POutPending,
	})

	check := &core.AMLCheck{
		TransactionRef: "TXN-AML-001",
		CheckType:      "automated",
		Status:         "flagged",
		FlaggedReason:  "amount_exceeds_threshold",
	}

	err := pg.SaveAMLCheck(ctx, check)
	if err != nil {
		t.Fatalf("SaveAMLCheck: %v", err)
	}

	flagged, err := pg.ListFlaggedTransactions(ctx, "flagged")
	if err != nil {
		t.Fatalf("ListFlaggedTransactions: %v", err)
	}
	if len(flagged) != 1 {
		t.Fatalf("expected 1 flagged tx, got %d", len(flagged))
	}
}

func TestAgentServiceIntegration(t *testing.T) {
	pg := newTestPostgres()
	ctx := context.Background()

	aSvc := agent.New(pg, nil, nil)

	ag := &core.Agent{
		UserID:          "USR-AGENT-001",
		ShopName:        "NgoenSai Agent Bangkok",
		ShopProvince:    "Bangkok",
		Country:         "TH",
		AgentType:       core.AgentCashOut,
		FloatBalanceLAK: 1000000,
	}

	err := aSvc.RegisterAgent(ctx, ag)
	if err != nil {
		t.Fatalf("RegisterAgent: %v", err)
	}

	got, err := aSvc.GetAgent(ctx, ag.ID)
	if err != nil {
		t.Fatalf("GetAgent: %v", err)
	}
	if got.ShopName != "NgoenSai Agent Bangkok" {
		t.Fatalf("unexpected shop name: %s", got.ShopName)
	}
}
