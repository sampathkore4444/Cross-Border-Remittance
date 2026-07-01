package routes

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
)

type AgentService interface {
	RegisterAgent(ctx context.Context, agent *core.Agent) error
	ProcessCashIn(ctx context.Context, agentID string, amountTHB float64, senderPhone, recipientPhone string) (string, error)
	ProcessCashOut(ctx context.Context, agentID string, amountLAK int64, recipientPhone string) (string, error)
	DepositFloat(ctx context.Context, agentID string, amount int64, method string) error
	GetAgent(ctx context.Context, id string) (*core.Agent, error)
	GetAgentByUserID(ctx context.Context, userID string) (*core.Agent, error)
	ListAgentTransactions(ctx context.Context, agentID string, limit int) ([]core.FloatTransaction, error)
}

type AgentAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

func RegisterAgent(r *gin.Engine, agentSvc AgentService, authSvc AgentAuthService) {
	g := r.Group("/v1/agents", middleware.AuthRequired(authSvc))
	{
		g.POST("/register", func(c *gin.Context) {
			var req struct {
				ShopName     string  `json:"shop_name" binding:"required"`
				ShopAddress  string  `json:"shop_address"`
				ShopProvince string  `json:"shop_province" binding:"required"`
				ShopLat      float64 `json:"shop_lat"`
				ShopLng      float64 `json:"shop_lng"`
				Country      string  `json:"country" binding:"required"`
				AgentType    string  `json:"agent_type" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			user := c.MustGet("user").(*core.User)
			agent := &core.Agent{
				UserID:       user.ID,
				Name:         user.Name,
				Phone:        user.Phone,
				ShopName:     req.ShopName,
				ShopAddress:  req.ShopAddress,
				ShopProvince: req.ShopProvince,
				ShopLat:      req.ShopLat,
				ShopLng:      req.ShopLng,
				Country:      req.Country,
				AgentType:    core.AgentType(req.AgentType),
			}
			if err := agentSvc.RegisterAgent(c.Request.Context(), agent); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "registered", "agent_id": agent.ID})
		})

		g.GET("/me", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			agent, err := agentSvc.GetAgentByUserID(c.Request.Context(), user.ID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "agent not found"})
				return
			}
			c.JSON(http.StatusOK, agent)
		})

		g.GET("/transactions", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			agent, err := agentSvc.GetAgentByUserID(c.Request.Context(), user.ID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "agent not found"})
				return
			}
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
			if limit < 1 || limit > 200 {
				limit = 50
			}
			txns, err := agentSvc.ListAgentTransactions(c.Request.Context(), agent.ID, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"transactions": txns})
		})

		g.GET("/commission", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			agent, err := agentSvc.GetAgentByUserID(c.Request.Context(), user.ID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "agent not found"})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"commission_rate":  agent.CommissionRate,
				"commission_total": agent.CommissionTotal,
			})
		})

		g.POST("/cash-in", func(c *gin.Context) {
			var req struct {
				AgentID        string  `json:"agent_id" binding:"required"`
				AmountTHB      float64 `json:"amount_thb" binding:"required"`
				SenderPhone    string  `json:"sender_phone" binding:"required"`
				RecipientPhone string  `json:"recipient_phone" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			ref, err := agentSvc.ProcessCashIn(c.Request.Context(), req.AgentID, req.AmountTHB, req.SenderPhone, req.RecipientPhone)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "cash_in_ok", "reference": ref})
		})

		g.POST("/cash-out", func(c *gin.Context) {
			var req struct {
				AgentID        string `json:"agent_id" binding:"required"`
				AmountLAK      int64  `json:"amount_lak" binding:"required"`
				RecipientPhone string `json:"recipient_phone" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			ref, err := agentSvc.ProcessCashOut(c.Request.Context(), req.AgentID, req.AmountLAK, req.RecipientPhone)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "cash_out_ok", "reference": ref})
		})

		g.POST("/float/deposit", func(c *gin.Context) {
			var req struct {
				AgentID string `json:"agent_id" binding:"required"`
				Amount  int64  `json:"amount" binding:"required"`
				Method  string `json:"method" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := agentSvc.DepositFloat(c.Request.Context(), req.AgentID, req.Amount, req.Method); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deposited"})
		})
	}
}
