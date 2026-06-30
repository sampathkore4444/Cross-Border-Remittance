package routes

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
	"github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type AdminAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

type AdminTreasuryService interface {
	GetBalanceSummary(ctx context.Context) (map[string]interface{}, error)
	GetAdminStats(ctx context.Context) (map[string]interface{}, error)
}

type AdminComplianceService interface {
	ScreenSanctions(ctx context.Context, name string) error
}

type AdminFXService interface {
	GetRate(ctx context.Context) (float64, float64, error)
	SetOverrideRate(ctx context.Context, rate, midMarket float64) error
	ClearOverrideRate(ctx context.Context) error
	GetOverrideStatus(ctx context.Context) (bool, float64, float64)
}

type AdminNotificationService interface {
	SendPush(ctx context.Context, userID, title, body string) error
}

type AdminStore interface {
	ListAllTransactions(ctx context.Context, page, limit int) ([]core.Transaction, int, error)
	SearchTransactions(ctx context.Context, query, senderPhone, dateFrom, dateTo string, page, limit int) ([]core.Transaction, int, error)
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	ListTransactionLogs(ctx context.Context, ref string) ([]core.TransactionStatusLog, error)
	ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error)
	ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error)
	UpdateAgentStatus(ctx context.Context, id string, isActive bool) error
	UpdateFloat(ctx context.Context, agentID string, amount int64) error
	AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error
	GetAgent(ctx context.Context, id string) (*core.Agent, error)
	GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error)
	ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error)
	UpdateAMLCheckStatus(ctx context.Context, id string, status string) error
	ListUsers(ctx context.Context, page, limit int) ([]core.User, int, error)
	UpdateUserStatus(ctx context.Context, id string, isActive bool) error
	GetUserByID(ctx context.Context, id string) (*core.User, error)
	ListKYCDocuments(ctx context.Context, status string, page, limit int) ([]core.KYCDocument, int, error)
	UpdateKYCDocumentStatus(ctx context.Context, id int, status, reviewerID string) error
	ListAdminUsers(ctx context.Context) ([]core.AdminUser, error)
	GetAdminUserByUsername(ctx context.Context, username string) (*core.AdminUser, error)
	CreateAdminUser(ctx context.Context, u *core.AdminUser) error
	UpdateAdminUser(ctx context.Context, u *core.AdminUser) error
	DeleteAdminUser(ctx context.Context, id string) error
	SaveAdminLog(ctx context.Context, log *core.AdminLog) error
	ListAdminLogs(ctx context.Context, page, limit int) ([]core.AdminLog, int, error)
	ListWebhookLogs(ctx context.Context, page, limit int) ([]core.WebhookLog, int, error)
	Ping(ctx context.Context) error
}

type adminHandler struct {
	authSvc       AdminAuthService
	treasurySvc   AdminTreasuryService
	complianceSvc AdminComplianceService
	fxSvc         AdminFXService
	notifSvc      AdminNotificationService
	redis         *redis.Client
	queue         *amqp091.Channel
	jwtSecret     string
	store         AdminStore
}

func RegisterAdmin(r *gin.Engine, authSvc AdminAuthService, treasurySvc AdminTreasuryService, complianceSvc AdminComplianceService, fxSvc AdminFXService, notifSvc AdminNotificationService, redisClient *redis.Client, queue *amqp091.Channel, jwtSecret string, store AdminStore) {
	h := &adminHandler{
		authSvc:       authSvc,
		treasurySvc:   treasurySvc,
		complianceSvc: complianceSvc,
		fxSvc:         fxSvc,
		notifSvc:      notifSvc,
		redis:         redisClient,
		queue:         queue,
		jwtSecret:     jwtSecret,
		store:         store,
	}

	auth := middleware.AdminAuthRequired(jwtSecret)

	g := r.Group("/v1/admin")
	{
		g.POST("/login", h.login)

		g.GET("/stats", auth, middleware.RequirePermission(core.PermViewTreasury), h.stats)
		g.GET("/treasury", auth, middleware.RequirePermission(core.PermViewTreasury), h.treasury)

		g.GET("/transactions", auth, middleware.RequirePermission(core.PermViewTransactions), h.listTransactions)
		g.GET("/transactions/:ref", auth, middleware.RequirePermission(core.PermViewTransactions), h.getTransactionDetail)

		g.GET("/agents", auth, middleware.RequirePermission(core.PermViewAgents), h.listAgents)
		g.PUT("/agents/:id/status", auth, middleware.RequirePermission(core.PermManageAgents), h.updateAgentStatus)
		g.POST("/agents/:id/float", auth, middleware.RequirePermission(core.PermManageAgents), h.depositAgentFloat)

		g.GET("/flagged", auth, middleware.RequirePermission(core.PermViewCompliance), h.listFlagged)
		g.PUT("/flagged/:id/review", auth, middleware.RequirePermission(core.PermManageCompliance), h.reviewFlagged)
		g.POST("/sanctions/check", auth, middleware.RequirePermission(core.PermManageCompliance), h.sanctionsCheck)

		g.GET("/users", auth, middleware.RequirePermission(core.PermViewUsers), h.listUsers)
		g.GET("/users/:id", auth, middleware.RequirePermission(core.PermViewUsers), h.getUserDetail)
		g.PUT("/users/:id/status", auth, middleware.RequirePermission(core.PermManageUsers), h.updateUserStatus)

		g.GET("/kyc-documents", auth, middleware.RequirePermission(core.PermReviewKYC), h.listKYCDocuments)
		g.PUT("/kyc-documents/:id/review", auth, middleware.RequirePermission(core.PermReviewKYC), h.reviewKYCDocument)

		g.GET("/admin-users", auth, middleware.RequirePermission(core.PermManageAdminUsers), h.listAdminUsers)
		g.POST("/admin-users", auth, middleware.RequirePermission(core.PermManageAdminUsers), h.createAdminUser)
		g.PUT("/admin-users/:id", auth, middleware.RequirePermission(core.PermManageAdminUsers), h.updateAdminUser)
		g.DELETE("/admin-users/:id", auth, middleware.RequirePermission(core.PermManageAdminUsers), h.deleteAdminUser)

		g.POST("/notifications/broadcast", auth, middleware.RequirePermission(core.PermNotifyBroadcast), h.broadcastNotification)
		g.GET("/notifications/history", auth, middleware.RequirePermission(core.PermNotifyBroadcast), h.notificationHistory)

		g.GET("/health", auth, middleware.RequirePermission(core.PermViewHealth), h.health)

		g.GET("/logs", auth, middleware.RequirePermission(core.PermViewLogs), h.listLogs)

		g.GET("/webhook-logs", auth, middleware.RequirePermission(core.PermViewWebhookLogs), h.listWebhookLogs)

		g.GET("/fx/rate", auth, middleware.RequirePermission(core.PermManageFX), h.getFXRate)
		g.POST("/fx/rate", auth, middleware.RequirePermission(core.PermManageFX), h.setFXOverride)
		g.DELETE("/fx/rate", auth, middleware.RequirePermission(core.PermManageFX), h.clearFXOverride)
	}
}

func (h *adminHandler) login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, err := h.store.GetAdminUserByUsername(c.Request.Context(), req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if !admin.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "account disabled"})
		return
	}

	hash := sha256.Sum256([]byte(req.Password))
	passwordHash := hex.EncodeToString(hash[:])
	if passwordHash != admin.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	claims := jwt.MapClaims{
		"sub":  admin.Username,
		"role": string(admin.Role),
		"exp":  time.Now().Add(2 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	h.auditLog(c.Request.Context(), admin.Username, "login", "", "Role: "+string(admin.Role))

	c.JSON(http.StatusOK, gin.H{
		"access_token":  tokenStr,
		"refresh_token": "admin-refresh-" + admin.Username,
		"expires_in":    7200,
		"role":          string(admin.Role),
	})
}

func (h *adminHandler) stats(c *gin.Context) {
	stats, err := h.treasurySvc.GetAdminStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *adminHandler) treasury(c *gin.Context) {
	summary, err := h.treasurySvc.GetBalanceSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *adminHandler) listTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	q := c.Query("q")
	sender := c.Query("sender")
	dateFrom := c.Query("from")
	dateTo := c.Query("to")

	var txs []core.Transaction
	var total int
	var err error

	if q != "" || sender != "" || dateFrom != "" || dateTo != "" {
		txs, total, err = h.store.SearchTransactions(c.Request.Context(), q, sender, dateFrom, dateTo, page, limit)
	} else {
		txs, total, err = h.store.ListAllTransactions(c.Request.Context(), page, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"transactions": txs,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

func (h *adminHandler) listAgents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	country := c.Query("country")
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	agents, total, err := h.store.ListAgents(c.Request.Context(), country, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"agents": agents,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *adminHandler) listFlagged(c *gin.Context) {
	status := c.DefaultQuery("status", "flagged")
	txs, err := h.store.ListFlaggedTransactions(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"transactions": txs,
		"total":        len(txs),
	})
}

func (h *adminHandler) sanctionsCheck(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.complianceSvc.ScreenSanctions(c.Request.Context(), req.Name); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "flagged", "reason": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "clear"})
}

func (h *adminHandler) updateAgentStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.store.UpdateAgentStatus(c.Request.Context(), id, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	status := "suspended"
	if req.IsActive {
		status = "active"
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "update_agent_status", id, "Status: "+status)
	c.JSON(http.StatusOK, gin.H{"status": status})
}

func (h *adminHandler) depositAgentFloat(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Amount int64 `json:"amount" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be positive"})
		return
	}
	if err := h.store.UpdateFloat(c.Request.Context(), id, req.Amount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.store.AddFloatTransaction(c.Request.Context(), &core.FloatTransaction{
		AgentID: id,
		Type:    "deposit",
		Amount:  req.Amount,
		Method:  "admin_topup",
		Status:  "completed",
	})
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "deposit_float", id, "Amount: "+fmt.Sprintf("%d", req.Amount)+" LAK")
	c.JSON(http.StatusOK, gin.H{"status": "deposited", "amount": req.Amount})
}

func (h *adminHandler) reviewFlagged(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Action string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	newStatus := "reviewed"
	if req.Action == "escalate" {
		newStatus = "escalated"
	}
	if err := h.store.UpdateAMLCheckStatus(c.Request.Context(), id, newStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "review_flagged", id, "Action: "+req.Action)
	c.JSON(http.StatusOK, gin.H{"status": newStatus})
}

func (h *adminHandler) getTransactionDetail(c *gin.Context) {
	ref := c.Param("ref")
	tx, err := h.store.GetTransaction(c.Request.Context(), ref)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	logs, err := h.store.ListTransactionLogs(c.Request.Context(), ref)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"transaction": tx,
		"logs":        logs,
	})
}

func (h *adminHandler) listUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	users, total, err := h.store.ListUsers(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *adminHandler) updateUserStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.store.UpdateUserStatus(c.Request.Context(), id, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	status := "suspended"
	if req.IsActive {
		status = "activated"
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "update_user_status", id, "Status: "+status)
	c.JSON(http.StatusOK, gin.H{"status": status})
}

func (h *adminHandler) listLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	logs, total, err := h.store.ListAdminLogs(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *adminHandler) listWebhookLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	logs, total, err := h.store.ListWebhookLogs(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *adminHandler) getFXRate(c *gin.Context) {
	rate, midRate, err := h.fxSvc.GetRate(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "rate not available"})
		return
	}
	overridden, overrideRate, overrideMid := h.fxSvc.GetOverrideStatus(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"rate":          rate,
		"mid_market":    midRate,
		"spread":        midRate - rate,
		"currency":      "THB_LAK",
		"overridden":    overridden,
		"override_rate": overrideRate,
		"override_mid":  overrideMid,
	})
}

func (h *adminHandler) setFXOverride(c *gin.Context) {
	var req struct {
		Rate      float64 `json:"rate" binding:"required"`
		MidMarket float64 `json:"mid_market" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.fxSvc.SetOverrideRate(c.Request.Context(), req.Rate, req.MidMarket); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "fx_override", "", fmt.Sprintf("Rate: %.4f, Mid: %.4f", req.Rate, req.MidMarket))
	c.JSON(http.StatusOK, gin.H{"status": "overridden"})
}

func (h *adminHandler) clearFXOverride(c *gin.Context) {
	if err := h.fxSvc.ClearOverrideRate(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "fx_override_clear", "", "")
	c.JSON(http.StatusOK, gin.H{"status": "cleared"})
}

// ── KYC Documents ──

func (h *adminHandler) listKYCDocuments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	docs, total, err := h.store.ListKYCDocuments(c.Request.Context(), status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"documents": docs,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *adminHandler) reviewKYCDocument(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Status != "approved" && req.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'approved' or 'rejected'"})
		return
	}

	adminID, _ := c.Get("admin_id")
	if err := h.store.UpdateKYCDocumentStatus(c.Request.Context(), id, req.Status, adminID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.auditLog(c.Request.Context(), adminID.(string), "review_kyc", idStr, "Status: "+req.Status)
	c.JSON(http.StatusOK, gin.H{"status": req.Status})
}

// ── Admin Users ──

func (h *adminHandler) listAdminUsers(c *gin.Context) {
	users, err := h.store.ListAdminUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// strip passwords from response
	type safeUser struct {
		ID        string        `json:"id"`
		Username  string        `json:"username"`
		Role      core.UserRole `json:"role"`
		IsActive  bool          `json:"is_active"`
		CreatedAt time.Time     `json:"created_at"`
		UpdatedAt time.Time     `json:"updated_at"`
	}
	var result []safeUser
	for _, u := range users {
		result = append(result, safeUser{
			ID: u.ID, Username: u.Username, Role: u.Role,
			IsActive: u.IsActive, CreatedAt: u.CreatedAt, UpdatedAt: u.UpdatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"admin_users": result})
}

func (h *adminHandler) createAdminUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash := sha256.Sum256([]byte(req.Password))
	passwordHash := hex.EncodeToString(hash[:])

	u := &core.AdminUser{
		Username: req.Username,
		Password: passwordHash,
		Role:     core.UserRole(req.Role),
		IsActive: true,
	}
	if err := h.store.CreateAdminUser(c.Request.Context(), u); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "create_admin_user", u.ID, "Username: "+req.Username)
	c.JSON(http.StatusCreated, gin.H{"id": u.ID})
}

func (h *adminHandler) updateAdminUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Role     string `json:"role"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u := &core.AdminUser{ID: id}
	if req.Username != "" {
		u.Username = req.Username
	}
	if req.Password != "" {
		hash := sha256.Sum256([]byte(req.Password))
		u.Password = hex.EncodeToString(hash[:])
	}
	if req.Role != "" {
		u.Role = core.UserRole(req.Role)
	}
	if req.IsActive != nil {
		u.IsActive = *req.IsActive
	}

	if err := h.store.UpdateAdminUser(c.Request.Context(), u); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "update_admin_user", id, "")
	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func (h *adminHandler) deleteAdminUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.store.DeleteAdminUser(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "delete_admin_user", id, "")
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ── User Detail ──

func (h *adminHandler) getUserDetail(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()

	user, err := h.store.GetUserByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	kycDocs, _, _ := h.store.ListKYCDocuments(ctx, "", 1, 100)
	txns, _, _ := h.store.ListTransactions(ctx, id, 1, 50)
	agent, _ := h.store.GetAgentByUserID(ctx, id)

	c.JSON(http.StatusOK, gin.H{
		"user":          user,
		"kyc_documents": kycDocs,
		"transactions":  txns,
		"agent":         agent,
	})
}

// ── Notification Broadcast ──

func (h *adminHandler) broadcastNotification(c *gin.Context) {
	var req struct {
		Title string `json:"title" binding:"required"`
		Body  string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	users, _, err := h.store.ListUsers(c.Request.Context(), 1, 10000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sent := 0
	for _, u := range users {
		if err := h.notifSvc.SendPush(c.Request.Context(), u.ID, req.Title, req.Body); err == nil {
			sent++
		}
	}

	adminID, _ := c.Get("admin_id")
	h.auditLog(c.Request.Context(), adminID.(string), "broadcast_notification", "", fmt.Sprintf("Title: %s, Sent: %d/%d", req.Title, sent, len(users)))
	c.JSON(http.StatusOK, gin.H{
		"sent":  sent,
		"total": len(users),
	})
}

// ── Health ──

func (h *adminHandler) health(c *gin.Context) {
	checks := map[string]string{}

	if err := h.store.Ping(c.Request.Context()); err != nil {
		checks["database"] = "down"
	} else {
		checks["database"] = "up"
	}

	if _, err := h.redis.Ping(c.Request.Context()).Result(); err != nil {
		checks["redis"] = "down"
	} else {
		checks["redis"] = "up"
	}

	if h.queue != nil {
		checks["queue"] = "connected"
	} else {
		checks["queue"] = "down"
	}

	c.JSON(http.StatusOK, checks)
}

// ── Notification History ──

func (h *adminHandler) notificationHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}

	logs, _, err := h.store.ListAdminLogs(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var filtered []core.AdminLog
	for _, l := range logs {
		if l.Action == "broadcast_notification" {
			filtered = append(filtered, l)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":  filtered,
		"total": len(filtered),
		"page":  page,
		"limit": limit,
	})
}

func (h *adminHandler) auditLog(ctx context.Context, adminID, action, targetID, detail string) {
	h.store.SaveAdminLog(ctx, &core.AdminLog{
		AdminID:  adminID,
		Action:   action,
		TargetID: targetID,
		Detail:   detail,
	})
}
