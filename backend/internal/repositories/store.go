package repositories

import (
	"context"
	"time"

	"github.com/ngoensai/backend/internal/core"
)

type Store interface {
	Pool() interface{}
	Close()

	CreateUser(ctx context.Context, user *core.User) error
	GetUserByPhone(ctx context.Context, phone string) (*core.User, error)
	GetUserByID(ctx context.Context, id string) (*core.User, error)
	UpdateKYCLevel(ctx context.Context, userID string, level core.KYCLevel) error
	SaveKYCDocument(ctx context.Context, userID, docType, docNumber, frontURL, backURL, selfieURL string) error

	CreateTransaction(ctx context.Context, tx *core.Transaction) error
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	UpdatePaymentStatus(ctx context.Context, ref string, status core.PaymentStatus, paidAt time.Time, payRef string) error
	UpdatePayoutStatus(ctx context.Context, ref string, status core.PayoutStatus, payoutRef string, completedAt *time.Time) error
	UpdatePickupCollected(ctx context.Context, pickupCode string, collectedAt time.Time) error
	ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error)
	GetTransactionByIdempotency(ctx context.Context, key string) (*core.Transaction, error)
	SaveTransactionLog(ctx context.Context, log *core.TransactionStatusLog) error
	ListTransactionLogs(ctx context.Context, ref string) ([]core.TransactionStatusLog, error)
	SearchTransactions(ctx context.Context, query, senderPhone, dateFrom, dateTo string, page, limit int) ([]core.Transaction, int, error)
	ListAllTransactions(ctx context.Context, page, limit int) ([]core.Transaction, int, error)

	CreateAgent(ctx context.Context, a *core.Agent) error
	GetAgent(ctx context.Context, id string) (*core.Agent, error)
	GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error)
	ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error)
	UpdateFloat(ctx context.Context, agentID string, amount int64) error
	AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error
	ListAgentTransactions(ctx context.Context, agentID string, limit int) ([]core.FloatTransaction, error)
	GetFloatBalance(ctx context.Context, agentID string) (int64, error)
	UpdateAgentStatus(ctx context.Context, id string, isActive bool) error

	GetDailyVolume(ctx context.Context, date string) (totalTHB float64, totalLAK int64, err error)
	SaveReconciliation(ctx context.Context, r *core.TreasuryReconciliation) error
	GetReconciliation(ctx context.Context, date string) (*core.TreasuryReconciliation, error)

	SaveAMLCheck(ctx context.Context, check *core.AMLCheck) error
	UpdateAMLCheckStatus(ctx context.Context, id string, status string) error
	ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error)

	ListDueAutosends(ctx context.Context) ([]core.Autosend, error)
	GetAutosend(ctx context.Context, id string) (*core.Autosend, error)
	UpdateLastSent(ctx context.Context, id string, lastSent time.Time, nextSend time.Time) error
	DeactivateAutosend(ctx context.Context, id string) error
	CreateAutosend(ctx context.Context, a *core.Autosend) error

	CreateRecipient(ctx context.Context, r *core.RecipientProfile) error
	ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error)

	ListUsers(ctx context.Context, page, limit int) ([]core.User, int, error)
	UpdateUserStatus(ctx context.Context, id string, isActive bool) error

	ListKYCDocuments(ctx context.Context, status string, page, limit int) ([]core.KYCDocument, int, error)
	UpdateKYCDocumentStatus(ctx context.Context, id int, status, reviewerID string) error

	ListAdminUsers(ctx context.Context) ([]core.AdminUser, error)
	GetAdminUserByUsername(ctx context.Context, username string) (*core.AdminUser, error)
	CreateAdminUser(ctx context.Context, u *core.AdminUser) error
	UpdateAdminUser(ctx context.Context, u *core.AdminUser) error
	DeleteAdminUser(ctx context.Context, id string) error

	SaveAdminLog(ctx context.Context, log *core.AdminLog) error
	ListAdminLogs(ctx context.Context, page, limit int) ([]core.AdminLog, int, error)

	SaveWebhookLog(ctx context.Context, log *core.WebhookLog) error
	ListWebhookLogs(ctx context.Context, page, limit int) ([]core.WebhookLog, int, error)

	GetUserCount(ctx context.Context) (int, error)
	GetActiveAgentCount(ctx context.Context) (int, error)

	Ping(ctx context.Context) error
}
