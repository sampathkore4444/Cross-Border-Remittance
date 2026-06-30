package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"

	"github.com/ngoensai/backend/internal/core"
)

type RealPostgres struct {
	db *sql.DB
}

func NewRealPostgres(dsn string) (*RealPostgres, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}
	return &RealPostgres{db: db}, nil
}

func (p *RealPostgres) Pool() interface{} { return p.db }
func (p *RealPostgres) Close()            { p.db.Close() }

func (p *RealPostgres) exec(ctx context.Context, query string, args ...interface{}) error {
	_, err := p.db.ExecContext(ctx, query, args...)
	return err
}

func (p *RealPostgres) queryRow(ctx context.Context, dest []interface{}, query string, args ...interface{}) error {
	return p.db.QueryRowContext(ctx, query, args...).Scan(dest...)
}

func (p *RealPostgres) query(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	return p.db.QueryContext(ctx, query, args...)
}

// ── User ──

func (p *RealPostgres) CreateUser(ctx context.Context, user *core.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO users (id, phone, country_code, name, role, kyc_level, language, is_active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		user.ID, user.Phone, user.CountryCode, user.Name, string(user.Role), string(user.KYCLevel), user.Language, user.IsActive, user.CreatedAt, user.UpdatedAt)
}

func (p *RealPostgres) GetUserByPhone(ctx context.Context, phone string) (*core.User, error) {
	u := &core.User{}
	err := p.queryRow(ctx, []interface{}{&u.ID, &u.Phone, &u.CountryCode, &u.Name, &u.Role, &u.KYCLevel, &u.Language, &u.IsActive, &u.CreatedAt, &u.UpdatedAt},
		`SELECT id, phone, country_code, name, role, kyc_level, language, is_active, created_at, updated_at FROM users WHERE phone=$1`, phone)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (p *RealPostgres) GetUserByID(ctx context.Context, id string) (*core.User, error) {
	u := &core.User{}
	err := p.queryRow(ctx, []interface{}{&u.ID, &u.Phone, &u.CountryCode, &u.Name, &u.Role, &u.KYCLevel, &u.Language, &u.IsActive, &u.CreatedAt, &u.UpdatedAt},
		`SELECT id, phone, country_code, name, role, kyc_level, language, is_active, created_at, updated_at FROM users WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (p *RealPostgres) UpdateKYCLevel(ctx context.Context, userID string, level core.KYCLevel) error {
	return p.exec(ctx, `UPDATE users SET kyc_level=$1, updated_at=NOW() WHERE id=$2`, string(level), userID)
}

func (p *RealPostgres) SaveKYCDocument(ctx context.Context, userID, docType, docNumber, frontURL, backURL, selfieURL string) error {
	return p.exec(ctx,
		`INSERT INTO kyc_documents (user_id, doc_type, doc_number, front_url, back_url, selfie_url, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
		userID, docType, docNumber, frontURL, backURL, selfieURL)
}

// ── Transaction ──

func (p *RealPostgres) CreateTransaction(ctx context.Context, tx *core.Transaction) error {
	tx.CreatedAt = time.Now()
	tx.UpdatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO transactions (id, transaction_ref, sender_id, source_currency, source_amount, exchange_rate, mid_market_rate, target_currency, target_amount, recipient_name, recipient_phone, recipient_province, payout_method, payment_method, payment_status, payout_status, pickup_code, idempotency_key, quoted_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
		tx.ID, tx.TransactionRef, tx.SenderID, tx.SourceCurrency, tx.SourceAmount, tx.ExchangeRate, tx.MidMarketRate, tx.TargetCurrency, tx.TargetAmount, tx.RecipientName, tx.RecipientPhone, tx.RecipientProvince, string(tx.PayoutMethod), string(tx.PaymentMethod), string(tx.PaymentStatus), string(tx.PayoutStatus), tx.PickupCode, tx.IdempotencyKey, tx.QuotedAt, tx.CreatedAt, tx.UpdatedAt)
}

func (p *RealPostgres) GetTransaction(ctx context.Context, ref string) (*core.Transaction, error) {
	tx := &core.Transaction{}
	var paidAt, completedAt, pickedUpAt sql.NullTime
	err := p.queryRow(ctx, []interface{}{&tx.ID, &tx.TransactionRef, &tx.SenderID, &tx.SourceCurrency, &tx.SourceAmount, &tx.ExchangeRate, &tx.MidMarketRate, &tx.TargetCurrency, &tx.TargetAmount, &tx.RecipientName, &tx.RecipientPhone, &tx.RecipientProvince, &tx.PayoutMethod, &tx.PaymentMethod, &tx.PaymentStatus, &tx.PayoutStatus, &tx.PickupCode, &tx.PaymentReference, &tx.PayoutReference, &tx.IdempotencyKey, &tx.QuotedAt, &paidAt, &completedAt, &pickedUpAt, &tx.CreatedAt, &tx.UpdatedAt},
		`SELECT id, transaction_ref, sender_id, source_currency, source_amount, exchange_rate, mid_market_rate, target_currency, target_amount, recipient_name, recipient_phone, recipient_province, payout_method, payment_method, payment_status, payout_status, pickup_code, payment_reference, payout_reference, idempotency_key, quoted_at, paid_at, completed_at, picked_up_at, created_at, updated_at FROM transactions WHERE transaction_ref=$1`, ref)
	if err != nil {
		return nil, fmt.Errorf("transaction %s not found", ref)
	}
	if paidAt.Valid {
		tx.PaidAt = &paidAt.Time
	}
	if completedAt.Valid {
		tx.CompletedAt = &completedAt.Time
	}
	if pickedUpAt.Valid {
		tx.PickedUpAt = &pickedUpAt.Time
	}
	return tx, nil
}

func (p *RealPostgres) UpdatePaymentStatus(ctx context.Context, ref string, status core.PaymentStatus, paidAt time.Time, payRef string) error {
	return p.exec(ctx,
		`UPDATE transactions SET payment_status=$1, paid_at=$2, payment_reference=$3, updated_at=NOW() WHERE transaction_ref=$4`,
		string(status), paidAt, payRef, ref)
}

func (p *RealPostgres) UpdatePayoutStatus(ctx context.Context, ref string, status core.PayoutStatus, payoutRef string, completedAt *time.Time) error {
	return p.exec(ctx,
		`UPDATE transactions SET payout_status=$1, payout_reference=$2, completed_at=$3, updated_at=NOW() WHERE transaction_ref=$4`,
		string(status), payoutRef, completedAt, ref)
}

func (p *RealPostgres) UpdatePickupCollected(ctx context.Context, pickupCode string, collectedAt time.Time) error {
	res, err := p.db.ExecContext(ctx,
		`UPDATE transactions SET payout_status='completed', picked_up_at=$1, updated_at=NOW() WHERE pickup_code=$2`,
		collectedAt, pickupCode)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("pickup code %s not found", pickupCode)
	}
	return nil
}

func (p *RealPostgres) ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error) {
	offset := (page - 1) * limit
	rows, err := p.query(ctx,
		`SELECT id, transaction_ref, sender_id, source_currency, source_amount, exchange_rate, mid_market_rate, target_currency, target_amount, recipient_name, recipient_phone, recipient_province, payout_method, payment_method, payment_status, payout_status, pickup_code, payment_reference, payout_reference, idempotency_key, quoted_at, paid_at, completed_at, picked_up_at, created_at, updated_at FROM transactions WHERE sender_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		senderID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.Transaction
	for rows.Next() {
		var tx core.Transaction
		var paidAt, completedAt, pickedUpAt sql.NullTime
		if err := rows.Scan(&tx.ID, &tx.TransactionRef, &tx.SenderID, &tx.SourceCurrency, &tx.SourceAmount, &tx.ExchangeRate, &tx.MidMarketRate, &tx.TargetCurrency, &tx.TargetAmount, &tx.RecipientName, &tx.RecipientPhone, &tx.RecipientProvince, &tx.PayoutMethod, &tx.PaymentMethod, &tx.PaymentStatus, &tx.PayoutStatus, &tx.PickupCode, &tx.PaymentReference, &tx.PayoutReference, &tx.IdempotencyKey, &tx.QuotedAt, &paidAt, &completedAt, &pickedUpAt, &tx.CreatedAt, &tx.UpdatedAt); err != nil {
			return nil, 0, err
		}
		if paidAt.Valid {
			tx.PaidAt = &paidAt.Time
		}
		if completedAt.Valid {
			tx.CompletedAt = &completedAt.Time
		}
		if pickedUpAt.Valid {
			tx.PickedUpAt = &pickedUpAt.Time
		}
		result = append(result, tx)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM transactions WHERE sender_id=$1`, senderID).Scan(&total)
	return result, total, nil
}

func (p *RealPostgres) GetTransactionByIdempotency(ctx context.Context, key string) (*core.Transaction, error) {
	tx := &core.Transaction{}
	err := p.queryRow(ctx, []interface{}{&tx.ID, &tx.TransactionRef},
		`SELECT id, transaction_ref FROM transactions WHERE idempotency_key=$1`, key)
	if err != nil {
		return nil, fmt.Errorf("not found")
	}
	return tx, nil
}

func (p *RealPostgres) SaveTransactionLog(ctx context.Context, log *core.TransactionStatusLog) error {
	return p.exec(ctx,
		`INSERT INTO transaction_logs (transaction_id, status_from, status_to, changed_by, reason, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		log.TransactionID, log.StatusFrom, log.StatusTo, log.ChangedBy, log.Reason, time.Now())
}

func (p *RealPostgres) ListTransactionLogs(ctx context.Context, ref string) ([]core.TransactionStatusLog, error) {
	rows, err := p.query(ctx,
		`SELECT id, transaction_id, status_from, status_to, changed_by, reason, created_at FROM transaction_logs WHERE transaction_id=$1 ORDER BY created_at ASC`, ref)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []core.TransactionStatusLog
	for rows.Next() {
		var l core.TransactionStatusLog
		if err := rows.Scan(&l.ID, &l.TransactionID, &l.StatusFrom, &l.StatusTo, &l.ChangedBy, &l.Reason, &l.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, l)
	}
	return result, rows.Err()
}

func (p *RealPostgres) SearchTransactions(ctx context.Context, query, senderPhone, dateFrom, dateTo string, page, limit int) ([]core.Transaction, int, error) {
	offset := (page - 1) * limit
	where := " WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if query != "" {
		where += fmt.Sprintf(" AND (transaction_ref ILIKE '%%' || $%d || '%%' OR recipient_name ILIKE '%%' || $%d || '%%' OR recipient_phone ILIKE '%%' || $%d || '%%')", argIdx, argIdx+1, argIdx+2)
		args = append(args, query, query, query)
		argIdx += 3
	}
	if senderPhone != "" {
		where += fmt.Sprintf(" AND sender_id ILIKE '%%' || $%d || '%%'", argIdx)
		args = append(args, senderPhone)
		argIdx++
	}
	if dateFrom != "" {
		where += fmt.Sprintf(" AND created_at >= $%d::date", argIdx)
		args = append(args, dateFrom)
		argIdx++
	}
	if dateTo != "" {
		where += fmt.Sprintf(" AND created_at < ($%d::date + '1 day'::interval)", argIdx)
		args = append(args, dateTo)
		argIdx++
	}

	row := p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM transactions`+where, args...)
	var total int
	row.Scan(&total)

	querySQL := `SELECT id, transaction_ref, sender_id, source_currency, source_amount, exchange_rate, mid_market_rate, target_currency, target_amount, recipient_name, recipient_phone, recipient_province, payout_method, payment_method, payment_status, payout_status, pickup_code, payment_reference, payout_reference, idempotency_key, quoted_at, paid_at, completed_at, picked_up_at, created_at, updated_at FROM transactions` + where + ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argIdx) + ` OFFSET $` + fmt.Sprintf("%d", argIdx+1)
	args = append(args, limit, offset)

	rows, err := p.query(ctx, querySQL, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.Transaction
	for rows.Next() {
		var tx core.Transaction
		var paidAt, completedAt, pickedUpAt sql.NullTime
		if err := rows.Scan(&tx.ID, &tx.TransactionRef, &tx.SenderID, &tx.SourceCurrency, &tx.SourceAmount, &tx.ExchangeRate, &tx.MidMarketRate, &tx.TargetCurrency, &tx.TargetAmount, &tx.RecipientName, &tx.RecipientPhone, &tx.RecipientProvince, &tx.PayoutMethod, &tx.PaymentMethod, &tx.PaymentStatus, &tx.PayoutStatus, &tx.PickupCode, &tx.PaymentReference, &tx.PayoutReference, &tx.IdempotencyKey, &tx.QuotedAt, &paidAt, &completedAt, &pickedUpAt, &tx.CreatedAt, &tx.UpdatedAt); err != nil {
			return nil, 0, err
		}
		if paidAt.Valid {
			tx.PaidAt = &paidAt.Time
		}
		if completedAt.Valid {
			tx.CompletedAt = &completedAt.Time
		}
		if pickedUpAt.Valid {
			tx.PickedUpAt = &pickedUpAt.Time
		}
		result = append(result, tx)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return result, total, nil
}

func (p *RealPostgres) ListAllTransactions(ctx context.Context, page, limit int) ([]core.Transaction, int, error) {
	offset := (page - 1) * limit
	rows, err := p.query(ctx,
		`SELECT id, transaction_ref, sender_id, source_currency, source_amount, exchange_rate, mid_market_rate, target_currency, target_amount, recipient_name, recipient_phone, recipient_province, payout_method, payment_method, payment_status, payout_status, pickup_code, payment_reference, payout_reference, idempotency_key, quoted_at, paid_at, completed_at, picked_up_at, created_at, updated_at FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.Transaction
	for rows.Next() {
		var tx core.Transaction
		var paidAt, completedAt, pickedUpAt sql.NullTime
		if err := rows.Scan(&tx.ID, &tx.TransactionRef, &tx.SenderID, &tx.SourceCurrency, &tx.SourceAmount, &tx.ExchangeRate, &tx.MidMarketRate, &tx.TargetCurrency, &tx.TargetAmount, &tx.RecipientName, &tx.RecipientPhone, &tx.RecipientProvince, &tx.PayoutMethod, &tx.PaymentMethod, &tx.PaymentStatus, &tx.PayoutStatus, &tx.PickupCode, &tx.PaymentReference, &tx.PayoutReference, &tx.IdempotencyKey, &tx.QuotedAt, &paidAt, &completedAt, &pickedUpAt, &tx.CreatedAt, &tx.UpdatedAt); err != nil {
			return nil, 0, err
		}
		if paidAt.Valid {
			tx.PaidAt = &paidAt.Time
		}
		if completedAt.Valid {
			tx.CompletedAt = &completedAt.Time
		}
		if pickedUpAt.Valid {
			tx.PickedUpAt = &pickedUpAt.Time
		}
		result = append(result, tx)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM transactions`).Scan(&total)
	return result, total, nil
}

// ── Agent ──

func (p *RealPostgres) CreateAgent(ctx context.Context, a *core.Agent) error {
	a.CreatedAt = time.Now()
	a.UpdatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO agents (id, user_id, name, phone, country, province, float_balance_lak, is_active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		a.ID, a.UserID, a.Name, a.Phone, a.Country, a.Province, a.FloatBalanceLAK, a.IsActive, a.CreatedAt, a.UpdatedAt)
}

func (p *RealPostgres) GetAgent(ctx context.Context, id string) (*core.Agent, error) {
	a := &core.Agent{}
	err := p.queryRow(ctx, []interface{}{&a.ID, &a.UserID, &a.Name, &a.Phone, &a.Country, &a.Province, &a.FloatBalanceLAK, &a.IsActive, &a.CreatedAt, &a.UpdatedAt},
		`SELECT id, user_id, name, phone, country, province, float_balance_lak, is_active, created_at, updated_at FROM agents WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("agent not found")
	}
	return a, nil
}

func (p *RealPostgres) GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error) {
	a := &core.Agent{}
	err := p.queryRow(ctx, []interface{}{&a.ID, &a.UserID, &a.Name, &a.Phone, &a.Country, &a.Province, &a.FloatBalanceLAK, &a.IsActive, &a.CreatedAt, &a.UpdatedAt},
		`SELECT id, user_id, name, phone, country, province, float_balance_lak, is_active, created_at, updated_at FROM agents WHERE user_id=$1`, userID)
	if err != nil {
		return nil, fmt.Errorf("agent not found")
	}
	return a, nil
}

func (p *RealPostgres) ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error) {
	offset := (page - 1) * limit
	var rows *sql.Rows
	var err error
	if country == "" {
		rows, err = p.query(ctx, `SELECT id, user_id, name, phone, country, province, float_balance_lak, is_active, created_at, updated_at FROM agents ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	} else {
		rows, err = p.query(ctx, `SELECT id, user_id, name, phone, country, province, float_balance_lak, is_active, created_at, updated_at FROM agents WHERE country=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, country, limit, offset)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.Agent
	for rows.Next() {
		var a core.Agent
		if err := rows.Scan(&a.ID, &a.UserID, &a.Name, &a.Phone, &a.Country, &a.Province, &a.FloatBalanceLAK, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, 0, err
		}
		result = append(result, a)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	if country == "" {
		p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM agents`).Scan(&total)
	} else {
		p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM agents WHERE country=$1`, country).Scan(&total)
	}
	return result, total, nil
}

func (p *RealPostgres) UpdateFloat(ctx context.Context, agentID string, amount int64) error {
	return p.exec(ctx, `UPDATE agents SET float_balance_lak = float_balance_lak + $1, updated_at = NOW() WHERE id=$2`, amount, agentID)
}

func (p *RealPostgres) UpdateAgentStatus(ctx context.Context, id string, isActive bool) error {
	return p.exec(ctx, `UPDATE agents SET is_active=$1, updated_at=NOW() WHERE id=$2`, isActive, id)
}

func (p *RealPostgres) AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error {
	return p.exec(ctx,
		`INSERT INTO float_transactions (id, agent_id, type, amount, reference, created_at)
		 VALUES ($1,$2,$3,$4,$5,NOW())`,
		tx.ID, tx.AgentID, tx.Type, tx.Amount, tx.Reference)
}

func (p *RealPostgres) GetFloatBalance(ctx context.Context, agentID string) (int64, error) {
	var balance int64
	err := p.db.QueryRowContext(ctx, `SELECT float_balance_lak FROM agents WHERE id=$1`, agentID).Scan(&balance)
	if err != nil {
		return 0, fmt.Errorf("agent not found")
	}
	return balance, nil
}

// ── Treasury ──

func (p *RealPostgres) GetDailyVolume(ctx context.Context, date string) (float64, int64, error) {
	var totalTHB sql.NullFloat64
	var totalLAK sql.NullInt64
	p.db.QueryRowContext(ctx,
		`SELECT COALESCE(SUM(source_amount),0), COALESCE(SUM(target_amount),0) FROM transactions WHERE DATE(created_at)=$1`,
		date).Scan(&totalTHB, &totalLAK)
	return totalTHB.Float64, totalLAK.Int64, nil
}

func (p *RealPostgres) SaveReconciliation(ctx context.Context, r *core.TreasuryReconciliation) error {
	return p.exec(ctx,
		`INSERT INTO treasury_reconciliations (id, date, bank_account_id, bank_close_balance, system_balance, status, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
		r.ID, r.Date, r.BankAccountID, r.BankCloseBalance, r.SystemBalance, r.Status)
}

func (p *RealPostgres) GetReconciliation(ctx context.Context, date string) (*core.TreasuryReconciliation, error) {
	r := &core.TreasuryReconciliation{}
	err := p.queryRow(ctx, []interface{}{&r.ID, &r.Date, &r.BankAccountID, &r.BankCloseBalance, &r.SystemBalance, &r.Status, &r.CreatedAt},
		`SELECT id, date, bank_account_id, bank_close_balance, system_balance, status, created_at FROM treasury_reconciliations WHERE date=$1`, date)
	if err != nil {
		return nil, fmt.Errorf("reconciliation not found for %s", date)
	}
	return r, nil
}

// ── Compliance ──

func (p *RealPostgres) SaveAMLCheck(ctx context.Context, check *core.AMLCheck) error {
	return p.exec(ctx,
		`INSERT INTO aml_checks (id, transaction_ref, name, status, reason, created_at)
		 VALUES ($1,$2,$3,$4,$5,NOW())`,
		check.ID, check.TransactionRef, check.Name, check.Status, check.Reason)
}

func (p *RealPostgres) UpdateAMLCheckStatus(ctx context.Context, id string, status string) error {
	return p.exec(ctx, `UPDATE aml_checks SET status=$1 WHERE id=$2`, status, id)
}

func (p *RealPostgres) ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error) {
	query := `SELECT t.id, t.transaction_ref, t.sender_id, t.source_currency, t.source_amount, t.target_amount, t.recipient_name, t.payment_status, t.payout_status, t.created_at
		FROM transactions t INNER JOIN aml_checks a ON t.transaction_ref = a.transaction_ref`
	var rows *sql.Rows
	var err error
	if status == "" {
		rows, err = p.query(ctx, query+` ORDER BY t.created_at DESC`)
	} else {
		rows, err = p.query(ctx, query+` WHERE a.status=$1 ORDER BY t.created_at DESC`, status)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []core.Transaction
	for rows.Next() {
		var tx core.Transaction
		if err := rows.Scan(&tx.ID, &tx.TransactionRef, &tx.SenderID, &tx.SourceCurrency, &tx.SourceAmount, &tx.TargetAmount, &tx.RecipientName, &tx.PaymentStatus, &tx.PayoutStatus, &tx.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, tx)
	}
	return result, rows.Err()
}

// ── Autosend ──

func (p *RealPostgres) ListDueAutosends(ctx context.Context) ([]core.Autosend, error) {
	rows, err := p.query(ctx,
		`SELECT id, user_id, recipient_id, amount, frequency, next_send_at, last_send_at, is_active, created_at FROM autosends WHERE is_active=true AND next_send_at <= NOW()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []core.Autosend
	for rows.Next() {
		var a core.Autosend
		if err := rows.Scan(&a.ID, &a.UserID, &a.RecipientID, &a.Amount, &a.Frequency, &a.NextSendAt, &a.LastSendAt, &a.IsActive, &a.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (p *RealPostgres) GetAutosend(ctx context.Context, id string) (*core.Autosend, error) {
	a := &core.Autosend{}
	err := p.queryRow(ctx, []interface{}{&a.ID, &a.UserID, &a.RecipientID, &a.Amount, &a.Frequency, &a.NextSendAt, &a.LastSendAt, &a.IsActive, &a.CreatedAt},
		`SELECT id, user_id, recipient_id, amount, frequency, next_send_at, last_send_at, is_active, created_at FROM autosends WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("autosend not found")
	}
	return a, nil
}

func (p *RealPostgres) UpdateLastSent(ctx context.Context, id string, lastSent time.Time, nextSend time.Time) error {
	return p.exec(ctx, `UPDATE autosends SET last_send_at=$1, next_send_at=$2 WHERE id=$3`, lastSent, nextSend, id)
}

func (p *RealPostgres) DeactivateAutosend(ctx context.Context, id string) error {
	return p.exec(ctx, `UPDATE autosends SET is_active=false WHERE id=$1`, id)
}

func (p *RealPostgres) CreateAutosend(ctx context.Context, a *core.Autosend) error {
	return p.exec(ctx,
		`INSERT INTO autosends (id, user_id, recipient_id, amount, frequency, next_send_at, is_active, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
		a.ID, a.UserID, a.RecipientID, a.Amount, a.Frequency, a.NextSendAt, a.IsActive)
}

// ── Recipient ──

func (p *RealPostgres) CreateRecipient(ctx context.Context, r *core.RecipientProfile) error {
	return p.exec(ctx,
		`INSERT INTO recipient_profiles (id, user_id, phone, name, province, relationship, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
		r.ID, r.CreatedBy, r.Phone, r.Name, r.Province, r.Relationship)
}

func (p *RealPostgres) ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error) {
	rows, err := p.query(ctx,
		`SELECT id, user_id, phone, name, province, relationship, created_at FROM recipient_profiles WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []core.RecipientProfile
	for rows.Next() {
		var r core.RecipientProfile
		rows.Scan(&r.ID, &r.CreatedBy, &r.Phone, &r.Name, &r.Province, &r.Relationship, &r.CreatedAt)
		result = append(result, r)
	}
	return result, nil
}

// ── Stats ──

func (p *RealPostgres) GetUserCount(ctx context.Context) (int, error) {
	var count int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, nil
}

func (p *RealPostgres) Ping(ctx context.Context) error {
	return p.db.PingContext(ctx)
}

func (p *RealPostgres) GetActiveAgentCount(ctx context.Context) (int, error) {
	var count int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM agents WHERE is_active=true`).Scan(&count)
	return count, nil
}

// ── Admin: Users ──

func (p *RealPostgres) ListUsers(ctx context.Context, page, limit int) ([]core.User, int, error) {
	offset := (page - 1) * limit
	rows, err := p.query(ctx,
		`SELECT id, phone, country_code, name, role, kyc_level, language, is_active, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.User
	for rows.Next() {
		var u core.User
		if err := rows.Scan(&u.ID, &u.Phone, &u.CountryCode, &u.Name, &u.Role, &u.KYCLevel, &u.Language, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		result = append(result, u)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)
	return result, total, nil
}

func (p *RealPostgres) UpdateUserStatus(ctx context.Context, id string, isActive bool) error {
	return p.exec(ctx, `UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2`, isActive, id)
}

// ── Admin: Audit Log ──

func (p *RealPostgres) SaveAdminLog(ctx context.Context, log *core.AdminLog) error {
	log.CreatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO admin_logs (id, admin_id, action, target_id, detail, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		log.ID, log.AdminID, log.Action, log.TargetID, log.Detail, log.CreatedAt)
}

func (p *RealPostgres) SaveWebhookLog(ctx context.Context, log *core.WebhookLog) error {
	log.CreatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO webhook_logs (id, event_type, source, transaction_ref, request_body, response_status, signature_valid, error, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		log.ID, log.EventType, log.Source, log.TransactionRef, log.RequestBody, log.ResponseStatus, log.SignatureValid, log.Error, log.CreatedAt)
}

func (p *RealPostgres) ListWebhookLogs(ctx context.Context, page, limit int) ([]core.WebhookLog, int, error) {
	offset := (page - 1) * limit
	rows, err := p.query(ctx,
		`SELECT id, event_type, source, transaction_ref, request_body, response_status, signature_valid, error, created_at FROM webhook_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.WebhookLog
	for rows.Next() {
		var l core.WebhookLog
		if err := rows.Scan(&l.ID, &l.EventType, &l.Source, &l.TransactionRef, &l.RequestBody, &l.ResponseStatus, &l.SignatureValid, &l.Error, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		result = append(result, l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM webhook_logs`).Scan(&total)
	return result, total, nil
}

func (p *RealPostgres) ListAdminLogs(ctx context.Context, page, limit int) ([]core.AdminLog, int, error) {
	offset := (page - 1) * limit
	rows, err := p.query(ctx,
		`SELECT id, admin_id, action, target_id, detail, created_at FROM admin_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.AdminLog
	for rows.Next() {
		var l core.AdminLog
		if err := rows.Scan(&l.ID, &l.AdminID, &l.Action, &l.TargetID, &l.Detail, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		result = append(result, l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM admin_logs`).Scan(&total)
	return result, total, nil
}

// ── Admin: KYC Documents ──

func (p *RealPostgres) ListKYCDocuments(ctx context.Context, status string, page, limit int) ([]core.KYCDocument, int, error) {
	offset := (page - 1) * limit
	query := `SELECT id, user_id, doc_type, doc_number, front_url, back_url, selfie_url, status, created_at FROM kyc_documents`
	var rows *sql.Rows
	var err error
	if status == "" {
		rows, err = p.query(ctx, query+` ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	} else {
		rows, err = p.query(ctx, query+` WHERE status=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, status, limit, offset)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var result []core.KYCDocument
	for rows.Next() {
		var d core.KYCDocument
		if err := rows.Scan(&d.ID, &d.UserID, &d.DocType, &d.DocNumber, &d.FrontURL, &d.BackURL, &d.SelfieURL, &d.Status, &d.CreatedAt); err != nil {
			return nil, 0, err
		}
		result = append(result, d)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	if status == "" {
		p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM kyc_documents`).Scan(&total)
	} else {
		p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM kyc_documents WHERE status=$1`, status).Scan(&total)
	}
	return result, total, nil
}

func (p *RealPostgres) UpdateKYCDocumentStatus(ctx context.Context, id int, status, reviewerID string) error {
	return p.exec(ctx, `UPDATE kyc_documents SET status=$1, reviewer_id=$2 WHERE id=$3`, status, reviewerID, id)
}

// ── Admin: Admin Users ──

func (p *RealPostgres) ListAdminUsers(ctx context.Context) ([]core.AdminUser, error) {
	rows, err := p.query(ctx,
		`SELECT id, username, password, role, is_active, created_at, updated_at FROM admin_users ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []core.AdminUser
	for rows.Next() {
		var u core.AdminUser
		if err := rows.Scan(&u.ID, &u.Username, &u.Password, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, u)
	}
	return result, rows.Err()
}

func (p *RealPostgres) GetAdminUserByUsername(ctx context.Context, username string) (*core.AdminUser, error) {
	u := &core.AdminUser{}
	err := p.queryRow(ctx, []interface{}{&u.ID, &u.Username, &u.Password, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt},
		`SELECT id, username, password, role, is_active, created_at, updated_at FROM admin_users WHERE username=$1`, username)
	if err != nil {
		return nil, fmt.Errorf("admin user not found")
	}
	return u, nil
}

func (p *RealPostgres) CreateAdminUser(ctx context.Context, u *core.AdminUser) error {
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	return p.exec(ctx,
		`INSERT INTO admin_users (id, username, password, role, is_active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		u.ID, u.Username, u.Password, string(u.Role), u.IsActive, u.CreatedAt, u.UpdatedAt)
}

func (p *RealPostgres) UpdateAdminUser(ctx context.Context, u *core.AdminUser) error {
	return p.exec(ctx,
		`UPDATE admin_users SET username=$1, password=$2, role=$3, is_active=$4, updated_at=NOW() WHERE id=$5`,
		u.Username, u.Password, string(u.Role), u.IsActive, u.ID)
}

func (p *RealPostgres) DeleteAdminUser(ctx context.Context, id string) error {
	return p.exec(ctx, `DELETE FROM admin_users WHERE id=$1`, id)
}
