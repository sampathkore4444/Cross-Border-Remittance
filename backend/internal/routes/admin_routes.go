package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/core"
)

type AdminAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

type AdminTreasuryService interface {
	GetBalanceSummary(ctx context.Context) (map[string]interface{}, error)
}

type AdminComplianceService interface {
	ScreenSanctions(ctx context.Context, name string) error
}

func RegisterAdmin(r *gin.Engine, authSvc AdminAuthService, treasurySvc AdminTreasuryService, complianceSvc AdminComplianceService) {
	g := r.Group("/v1/admin")
	{
		g.POST("/login", func(c *gin.Context) {
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
		})

		g.GET("/stats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"today_volume":       "8.9M THB",
				"transactions_today": 1245,
				"active_agents":      48,
				"revenue_today":      "245,670 THB",
				"total_users":        12580,
			})
		})

		g.GET("/treasury", func(c *gin.Context) {
			summary, err := treasurySvc.GetBalanceSummary(c.Request.Context())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, summary)
		})

		g.POST("/sanctions/check", func(c *gin.Context) {
			var req struct {
				Name string `json:"name" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := complianceSvc.ScreenSanctions(c.Request.Context(), req.Name); err != nil {
				c.JSON(http.StatusOK, gin.H{"status": "flagged", "reason": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "clear"})
		})
	}
}
