package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/ngoensai/backend/internal/core"
)

type Postgres struct {
	mu sync.RWMutex

	users        map[string]*core.User
	usersByPhone map[string]*core.User
	txns         map[string]*core.Transaction
	txnLogs      []core.TransactionStatusLog
	agents       map[string]*core.Agent
	agentsByUser map[string]*core.Agent
	floatTxns    []core.FloatTransaction
	recons       map[string]*core.TreasuryReconciliation
	amlChecks    []core.AMLCheck
	autosends    map[string]*core.Autosend

	nextID int64
}

func NewPostgres(dsn string) (*Postgres, error) {
	return &Postgres{
		users:        make(map[string]*core.User),
		usersByPhone: make(map[string]*core.User),
		txns:         make(map[string]*core.Transaction),
		agents:       make(map[string]*core.Agent),
		agentsByUser: make(map[string]*core.Agent),
		recons:       make(map[string]*core.TreasuryReconciliation),
		autosends:    make(map[string]*core.Autosend),
	}, nil
}

func (p *Postgres) nextIDStr(prefix string) string {
	p.nextID++
	return fmt.Sprintf("%s-%d", prefix, p.nextID)
}

func (p *Postgres) Pool() interface{} { return nil }
func (p *Postgres) Close()            {}

// ── User ──

func (p *Postgres) CreateUser(ctx context.Context, user *core.User) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if user.ID == "" {
		user.ID = p.nextIDStr("USR")
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	p.users[user.ID] = user
	p.usersByPhone[user.Phone] = user
	return nil
}

func (p *Postgres) GetUserByPhone(ctx context.Context, phone string) (*core.User, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	u, ok := p.usersByPhone[phone]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (p *Postgres) GetUserByID(ctx context.Context, id string) (*core.User, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	u, ok := p.users[id]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

// ── Transaction ──

func (p *Postgres) CreateTransaction(ctx context.Context, tx *core.Transaction) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if tx.ID == "" {
		tx.ID = p.nextIDStr("TXN")
	}
	if tx.TransactionRef == "" {
		tx.TransactionRef = fmt.Sprintf("TXN-%s-%s", time.Now().Format("20060102"), p.nextIDStr(""))
	}
	tx.CreatedAt = time.Now()
	tx.UpdatedAt = time.Now()
	p.txns[tx.TransactionRef] = tx
	return nil
}

func (p *Postgres) GetTransaction(ctx context.Context, ref string) (*core.Transaction, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	tx, ok := p.txns[ref]
	if !ok {
		return nil, fmt.Errorf("transaction %s not found", ref)
	}
	return tx, nil
}

func (p *Postgres) UpdatePaymentStatus(ctx context.Context, ref string, status core.PaymentStatus, paidAt time.Time, payRef string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	tx, ok := p.txns[ref]
	if !ok {
		return fmt.Errorf("transaction not found")
	}
	tx.PaymentStatus = status
	tx.PaymentReference = payRef
	if !paidAt.IsZero() {
		tx.PaidAt = &paidAt
	}
	tx.UpdatedAt = time.Now()
	return nil
}

func (p *Postgres) UpdatePayoutStatus(ctx context.Context, ref string, status core.PayoutStatus, payoutRef string, completedAt *time.Time) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	tx, ok := p.txns[ref]
	if !ok {
		return fmt.Errorf("transaction not found")
	}
	tx.PayoutStatus = status
	tx.PayoutReference = payoutRef
	tx.CompletedAt = completedAt
	tx.UpdatedAt = time.Now()
	return nil
}

func (p *Postgres) UpdatePickupCollected(ctx context.Context, pickupCode string, collectedAt time.Time) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, tx := range p.txns {
		if tx.PickupCode == pickupCode {
			tx.CompletedAt = &collectedAt
			tx.PayoutStatus = core.POutCompleted
			tx.UpdatedAt = time.Now()
			return nil
		}
	}
	return fmt.Errorf("pickup code %s not found", pickupCode)
}

func (p *Postgres) ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var filtered []core.Transaction
	for _, tx := range p.txns {
		if tx.SenderID == senderID {
			filtered = append(filtered, *tx)
		}
	}
	total := len(filtered)
	start := (page - 1) * limit
	if start >= total {
		return []core.Transaction{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return filtered[start:end], total, nil
}

func (p *Postgres) GetTransactionByIdempotency(ctx context.Context, key string) (*core.Transaction, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	for _, tx := range p.txns {
		if tx.IdempotencyKey == key {
			return tx, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

func (p *Postgres) SaveTransactionLog(ctx context.Context, log *core.TransactionStatusLog) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.txnLogs = append(p.txnLogs, *log)
	return nil
}

func (p *Postgres) ListAllTransactions(ctx context.Context, page, limit int) ([]core.Transaction, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var all []core.Transaction
	for _, tx := range p.txns {
		all = append(all, *tx)
	}
	total := len(all)
	start := (page - 1) * limit
	if start >= total {
		return []core.Transaction{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return all[start:end], total, nil
}

// ── Agent ──

func (p *Postgres) CreateAgent(ctx context.Context, a *core.Agent) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if a.ID == "" {
		a.ID = p.nextIDStr("AGT")
	}
	a.CreatedAt = time.Now()
	a.UpdatedAt = time.Now()
	a.IsActive = true
	p.agents[a.ID] = a
	p.agentsByUser[a.UserID] = a
	return nil
}

func (p *Postgres) GetAgent(ctx context.Context, id string) (*core.Agent, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	a, ok := p.agents[id]
	if !ok {
		return nil, fmt.Errorf("agent not found")
	}
	return a, nil
}

func (p *Postgres) GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	a, ok := p.agentsByUser[userID]
	if !ok {
		return nil, fmt.Errorf("agent not found")
	}
	return a, nil
}

func (p *Postgres) ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var filtered []core.Agent
	for _, a := range p.agents {
		if country == "" || a.Country == country {
			filtered = append(filtered, *a)
		}
	}
	total := len(filtered)
	start := (page - 1) * limit
	if start >= total {
		return []core.Agent{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return filtered[start:end], total, nil
}

func (p *Postgres) UpdateFloat(ctx context.Context, agentID string, amount int64) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	a, ok := p.agents[agentID]
	if !ok {
		return fmt.Errorf("agent not found")
	}
	a.FloatBalanceLAK += amount
	a.UpdatedAt = time.Now()
	return nil
}

func (p *Postgres) AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if tx.ID == "" {
		tx.ID = p.nextIDStr("FLT")
	}
	tx.CreatedAt = time.Now()
	p.floatTxns = append(p.floatTxns, *tx)
	return nil
}

func (p *Postgres) GetFloatBalance(ctx context.Context, agentID string) (int64, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	a, ok := p.agents[agentID]
	if !ok {
		return 0, fmt.Errorf("agent not found")
	}
	return a.FloatBalanceLAK, nil
}

// ── Treasury ──

type TreasuryReconciliation struct {
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

func (p *Postgres) GetDailyVolume(ctx context.Context, date string) (totalTHB float64, totalLAK int64, err error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	for _, tx := range p.txns {
		if tx.CreatedAt.Format("2006-01-02") == date {
			totalTHB += tx.SourceAmount
			totalLAK += tx.TargetAmount
		}
	}
	return totalTHB, totalLAK, nil
}

func (p *Postgres) SaveReconciliation(ctx context.Context, r *TreasuryReconciliation) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if r.ID == "" {
		r.ID = p.nextIDStr("REC")
	}
	r.CreatedAt = time.Now()
	p.recons[r.ID] = r
	return nil
}

func (p *Postgres) GetReconciliation(ctx context.Context, date string) (*TreasuryReconciliation, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	for _, r := range p.recons {
		if r.Date == date {
			return r, nil
		}
	}
	return nil, fmt.Errorf("reconciliation not found for %s", date)
}

// ── Compliance ──

type coreTransaction struct {
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

func (p *Postgres) GetComplianceTransaction(ctx context.Context, ref string) (*coreTransaction, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	tx, ok := p.txns[ref]
	if !ok {
		return nil, fmt.Errorf("transaction not found")
	}
	user, _ := p.users[tx.SenderID]
	phone := ""
	if user != nil {
		phone = user.Phone
	}
	return &coreTransaction{
		ID:             tx.ID,
		SenderID:       tx.SenderID,
		SourceAmount:   tx.SourceAmount,
		RecipientPhone: tx.RecipientPhone,
		SenderPhone:    phone,
		PaymentMethod:  string(tx.PaymentMethod),
	}, nil
}

func (p *Postgres) SaveAMLCheck(ctx context.Context, check *AMLCheck) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if check.ID == "" {
		check.ID = p.nextIDStr("AML")
	}
	check.CreatedAt = time.Now()
	p.amlChecks = append(p.amlChecks, *check)
	return nil
}

func (p *Postgres) ListFlaggedTransactions(ctx context.Context, status string) ([]coreTransaction, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var result []coreTransaction
	for _, check := range p.amlChecks {
		if status == "" || check.Status == status {
			tx, ok := p.txns[check.TransactionRef]
			if ok {
				result = append(result, coreTransaction{
					ID:           tx.ID,
					SenderID:     tx.SenderID,
					SourceAmount: tx.SourceAmount,
				})
			}
		}
	}
	return result, nil
}

// ── Autosend ──

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

func (p *Postgres) ListDueAutosends(ctx context.Context) ([]Autosend, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	now := time.Now()
	var due []Autosend
	for _, a := range p.autosends {
		if a.IsActive && a.NextSendAt.Before(now) {
			due = append(due, *a)
		}
	}
	return due, nil
}

func (p *Postgres) GetAutosend(ctx context.Context, id string) (*Autosend, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	a, ok := p.autosends[id]
	if !ok {
		return nil, fmt.Errorf("autosend not found")
	}
	return a, nil
}

func (p *Postgres) UpdateLastSent(ctx context.Context, id string, lastSent time.Time, nextSend time.Time) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	a, ok := p.autosends[id]
	if !ok {
		return fmt.Errorf("autosend not found")
	}
	a.LastSendAt = &lastSent
	a.NextSendAt = nextSend
	return nil
}

func (p *Postgres) DeactivateAutosend(ctx context.Context, id string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	a, ok := p.autosends[id]
	if !ok {
		return fmt.Errorf("autosend not found")
	}
	a.IsActive = false
	return nil
}

func (p *Postgres) CreateAutosend(ctx context.Context, a *Autosend) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if a.ID == "" {
		a.ID = p.nextIDStr("AUTO")
	}
	a.IsActive = true
	p.autosends[a.ID] = a
	return nil
}
