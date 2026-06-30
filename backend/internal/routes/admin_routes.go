package routes

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/core"
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

type AdminStore interface {
	ListAllTransactions(ctx context.Context, page, limit int) ([]core.Transaction, int, error)
	SearchTransactions(ctx context.Context, query, senderPhone, dateFrom, dateTo string, page, limit int) ([]core.Transaction, int, error)
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
	ListTransactionLogs(ctx context.Context, ref string) ([]core.TransactionStatusLog, error)
	ListAgents(ctx context.Context, country string, page, limit int) ([]core.Agent, int, error)
	UpdateAgentStatus(ctx context.Context, id string, isActive bool) error
	UpdateFloat(ctx context.Context, agentID string, amount int64) error
	AddFloatTransaction(ctx context.Context, tx *core.FloatTransaction) error
	GetAgent(ctx context.Context, id string) (*core.Agent, error)
	ListFlaggedTransactions(ctx context.Context, status string) ([]core.Transaction, error)
	UpdateAMLCheckStatus(ctx context.Context, id string, status string) error
	ListUsers(ctx context.Context, page, limit int) ([]core.User, int, error)
	UpdateUserStatus(ctx context.Context, id string, isActive bool) error
	SaveAdminLog(ctx context.Context, log *core.AdminLog) error
	ListAdminLogs(ctx context.Context, page, limit int) ([]core.AdminLog, int, error)
}

type adminHandler struct {
	authSvc       AdminAuthService
	treasurySvc   AdminTreasuryService
	complianceSvc AdminComplianceService
	store         AdminStore
}

func RegisterAdmin(r *gin.Engine, authSvc AdminAuthService, treasurySvc AdminTreasuryService, complianceSvc AdminComplianceService, store AdminStore) {
	h := &adminHandler{
		authSvc:       authSvc,
		treasurySvc:   treasurySvc,
		complianceSvc: complianceSvc,
		store:         store,
	}

	g := r.Group("/v1/admin")
	{
		g.POST("/login", h.login)
		g.GET("/stats", h.stats)
		g.GET("/treasury", h.treasury)
		g.GET("/transactions", h.listTransactions)
		g.GET("/transactions/:ref", h.getTransactionDetail)
		g.GET("/agents", h.listAgents)
		g.PUT("/agents/:id/status", h.updateAgentStatus)
		g.POST("/agents/:id/float", h.depositAgentFloat)
		g.GET("/flagged", h.listFlagged)
		g.PUT("/flagged/:id/review", h.reviewFlagged)
		g.POST("/sanctions/check", h.sanctionsCheck)
		g.GET("/users", h.listUsers)
		g.PUT("/users/:id/status", h.updateUserStatus)
		g.GET("/logs", h.listLogs)
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
	c.JSON(http.StatusOK, gin.H{
		"access_token":  "admin-" + req.Username + "-token",
		"refresh_token": "admin-refresh-" + req.Username,
		"expires_in":    3600,
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
	h.auditLog(c.Request.Context(), "admin", "update_agent_status", id, "Status: "+status)
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
	h.auditLog(c.Request.Context(), "admin", "deposit_float", id, "Amount: "+fmt.Sprintf("%d", req.Amount)+" LAK")
	c.JSON(http.StatusOK, gin.H{"status": "deposited", "amount": req.Amount})
}

func (h *adminHandler) reviewFlagged(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Action string `json:"action" binding:"required"` // "dismiss" or "escalate"
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
	h.auditLog(c.Request.Context(), "admin", "review_flagged", id, "Action: "+req.Action)
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
	h.auditLog(c.Request.Context(), "admin", "update_user_status", id, "Status: "+status)
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

func (h *adminHandler) auditLog(ctx context.Context, adminID, action, targetID, detail string) {
	entry := &core.AdminLog{
		ID:       "",
		AdminID:  adminID,
		Action:   action,
		TargetID: targetID,
		Detail:   detail,
	}
	h.store.SaveAdminLog(ctx, entry)
}
