package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
)

type TreasuryService interface {
	GetBalanceSummary(ctx context.Context) (map[string]interface{}, error)
	RunDailyReconciliation(ctx context.Context) error
}

type TreasuryAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

func RegisterTreasury(r *gin.Engine, treasurySvc TreasuryService, authSvc TreasuryAuthService) {
	g := r.Group("/v1/treasury", middleware.AuthRequired(authSvc))
	{
		g.GET("/balances", func(c *gin.Context) {
			summary, err := treasurySvc.GetBalanceSummary(c.Request.Context())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, summary)
		})

		g.POST("/reconciliation", func(c *gin.Context) {
			if err := treasurySvc.RunDailyReconciliation(c.Request.Context()); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "reconciliation_completed"})
		})
	}
}
