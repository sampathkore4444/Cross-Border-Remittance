package repositories

import (
	"context"
	"fmt"
	"strings"
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
	recipients   map[string][]*core.RecipientProfile
	adminLogs    []core.AdminLog
	webhookLogs  []core.WebhookLog

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
		recipients:   make(map[string][]*core.RecipientProfile),
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

func (p *Postgres) UpdateKYCLevel(ctx context.Context, userID string, level core.KYCLevel) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	u, ok := p.users[userID]
	if !ok {
		return fmt.Errorf("user not found")
	}
	u.KYCLevel = level
	u.UpdatedAt = time.Now()
	return nil
}

func (p *Postgres) SaveKYCDocument(ctx context.Context, userID, docType, docNumber, frontURL, backURL, selfieURL string) error {
	return nil
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
	from := string(tx.PaymentStatus)
	tx.PaymentStatus = status
	tx.PaymentReference = payRef
	if !paidAt.IsZero() {
		tx.PaidAt = &paidAt
	}
	tx.UpdatedAt = time.Now()
	p.txnLogs = append(p.txnLogs, core.TransactionStatusLog{
		TransactionID: tx.TransactionRef,
		StatusFrom:    from,
		StatusTo:      string(status),
		ChangedBy:     "system",
		CreatedAt:     time.Now(),
	})
	return nil
}

func (p *Postgres) UpdatePayoutStatus(ctx context.Context, ref string, status core.PayoutStatus, payoutRef string, completedAt *time.Time) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	tx, ok := p.txns[ref]
	if !ok {
		return fmt.Errorf("transaction not found")
	}
	from := string(tx.PayoutStatus)
	tx.PayoutStatus = status
	tx.PayoutReference = payoutRef
	tx.CompletedAt = completedAt
	tx.UpdatedAt = time.Now()
	p.txnLogs = append(p.txnLogs, core.TransactionStatusLog{
		TransactionID: tx.TransactionRef,
		StatusFrom:    from,
		StatusTo:      string(status),
		ChangedBy:     "system",
		CreatedAt:     time.Now(),
	})
	return nil
}

func (p *Postgres) UpdatePickupCollected(ctx context.Context, pickupCode string, collectedAt time.Time) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, tx := range p.txns {
		if tx.PickupCode == pickupCode {
			from := string(tx.PayoutStatus)
			tx.CompletedAt = &collectedAt
			tx.PayoutStatus = core.POutCompleted
			tx.UpdatedAt = time.Now()
			p.txnLogs = append(p.txnLogs, core.TransactionStatusLog{
				TransactionID: tx.TransactionRef,
				StatusFrom:    from,
				StatusTo:      string(core.POutCompleted),
				ChangedBy:     "system",
				Reason:        "pickup collected",
				CreatedAt:     time.Now(),
			})
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

func (p *Postgres) SearchTransactions(ctx context.Context, query, senderPhone, dateFrom, dateTo string, page, limit int) ([]core.Transaction, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var filtered []core.Transaction
	for _, tx := range p.txns {
		if query != "" && !strings.Contains(tx.TransactionRef, query) && !strings.Contains(tx.RecipientName, query) && !strings.Contains(tx.RecipientPhone, query) {
			continue
		}
		if senderPhone != "" && !strings.Contains(tx.SenderID, senderPhone) {
			continue
		}
		if dateFrom != "" {
			t, err := time.Parse("2006-01-02", dateFrom)
			if err == nil && tx.CreatedAt.Before(t) {
				continue
			}
		}
		if dateTo != "" {
			t, err := time.Parse("2006-01-02", dateTo)
			if err == nil && tx.CreatedAt.After(t.Add(24*time.Hour)) {
				continue
			}
		}
		filtered = append(filtered, *tx)
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

func (p *Postgres) ListTransactionLogs(ctx context.Context, ref string) ([]core.TransactionStatusLog, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var result []core.TransactionStatusLog
	for _, l := range p.txnLogs {
		if l.TransactionID == ref {
			result = append(result, l)
		}
	}
	return result, nil
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

func (p *Postgres) UpdateAgentStatus(ctx context.Context, id string, isActive bool) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	a, ok := p.agents[id]
	if !ok {
		return fmt.Errorf("agent not found")
	}
	a.IsActive = isActive
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

func (p *Postgres) SaveReconciliation(ctx context.Context, r *core.TreasuryReconciliation) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if r.ID == "" {
		r.ID = p.nextIDStr("REC")
	}
	r.CreatedAt = time.Now()
	p.recons[r.ID] = r
	return nil
}

func (p *Postgres) GetReconciliation(ctx context.Context, date string) (*core.TreasuryReconciliation, error) {
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

func (p *Postgres) SaveAMLCheck(ctx context.Context, check *core.AMLCheck) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if check.ID == "" {
		check.ID = p.nextIDStr("AML")
	}
	check.CreatedAt = time.Now()
	p.amlChecks = append(p.amlChecks, *check)
	return nil
}

func (p *Postgres) UpdateAMLCheckStatus(ctx context.Context, id string, status string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	for i := range p.amlChecks {
		if p.amlChecks[i].ID == id {
			p.amlChecks[i].Status = status
			return nil
		}
	}
	return fmt.Errorf("aml check not found")
}

func (p *Postgres) ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var result []core.Transaction
	for _, check := range p.amlChecks {
		if status == "" || check.Status == status {
			tx, ok := p.txns[check.TransactionRef]
			if ok {
				result = append(result, *tx)
			}
		}
	}
	return result, nil
}

// ── Autosend ──

func (p *Postgres) ListDueAutosends(ctx context.Context) ([]core.Autosend, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	now := time.Now()
	var due []core.Autosend
	for _, a := range p.autosends {
		if a.IsActive && a.NextSendAt.Before(now) {
			due = append(due, *a)
		}
	}
	return due, nil
}

func (p *Postgres) GetAutosend(ctx context.Context, id string) (*core.Autosend, error) {
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

func (p *Postgres) CreateAutosend(ctx context.Context, a *core.Autosend) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if a.ID == "" {
		a.ID = p.nextIDStr("AUTO")
	}
	a.IsActive = true
	p.autosends[a.ID] = a
	return nil
}

// ── Recipient ──

func (p *Postgres) CreateRecipient(ctx context.Context, r *core.RecipientProfile) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if r.ID == "" {
		r.ID = p.nextIDStr("REC")
	}
	r.CreatedAt = time.Now()
	p.recipients[r.CreatedBy] = append(p.recipients[r.CreatedBy], r)
	return nil
}

func (p *Postgres) ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	recs := p.recipients[userID]
	if len(recs) == 0 {
		return []core.RecipientProfile{}, nil
	}
	result := make([]core.RecipientProfile, len(recs))
	for i, r := range recs {
		result[i] = *r
	}
	return result, nil
}

func (p *Postgres) GetUserCount(ctx context.Context) (int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.users), nil
}

func (p *Postgres) GetActiveAgentCount(ctx context.Context) (int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	count := 0
	for _, a := range p.agents {
		if a.IsActive {
			count++
		}
	}
	return count, nil
}

// ── Admin: Users ──

func (p *Postgres) ListUsers(ctx context.Context, page, limit int) ([]core.User, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	var all []core.User
	for _, u := range p.users {
		all = append(all, *u)
	}
	total := len(all)
	start := (page - 1) * limit
	if start >= total {
		return []core.User{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return all[start:end], total, nil
}

func (p *Postgres) UpdateUserStatus(ctx context.Context, id string, isActive bool) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	u, ok := p.users[id]
	if !ok {
		return fmt.Errorf("user not found")
	}
	u.IsActive = isActive
	u.UpdatedAt = time.Now()
	return nil
}

// ── Admin: Audit Log ──

func (p *Postgres) SaveAdminLog(ctx context.Context, log *core.AdminLog) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if log.ID == "" {
		log.ID = p.nextIDStr("ADL")
	}
	log.CreatedAt = time.Now()
	p.adminLogs = append(p.adminLogs, *log)
	return nil
}

func (p *Postgres) ListAdminLogs(ctx context.Context, page, limit int) ([]core.AdminLog, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	total := len(p.adminLogs)
	start := (page - 1) * limit
	if start >= total {
		return []core.AdminLog{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	// newest first
	var result []core.AdminLog
	for i := len(p.adminLogs) - 1; i >= 0; i-- {
		result = append(result, p.adminLogs[i])
	}
	return result[start:end], total, nil
}

func (p *Postgres) SaveWebhookLog(ctx context.Context, log *core.WebhookLog) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if log.ID == "" {
		log.ID = p.nextIDStr("WH")
	}
	log.CreatedAt = time.Now()
	p.webhookLogs = append(p.webhookLogs, *log)
	return nil
}

func (p *Postgres) ListWebhookLogs(ctx context.Context, page, limit int) ([]core.WebhookLog, int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	total := len(p.webhookLogs)
	start := (page - 1) * limit
	if start >= total {
		return []core.WebhookLog{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	var result []core.WebhookLog
	for i := len(p.webhookLogs) - 1; i >= 0; i-- {
		result = append(result, p.webhookLogs[i])
	}
	return result[start:end], total, nil
}
