package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
)

type PayoutService interface {
	ProcessPayout(ctx context.Context, ref string) error
	ConfirmPickup(ctx context.Context, pickupCode string) error
}

type PayoutAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

func RegisterPayout(r *gin.Engine, payoutSvc PayoutService, authSvc PayoutAuthService) {
	g := r.Group("/v1/payouts", middleware.AuthRequired(authSvc))
	{
		g.POST("/process", func(c *gin.Context) {
			var req struct {
				TransactionRef string `json:"transaction_ref" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := payoutSvc.ProcessPayout(c.Request.Context(), req.TransactionRef); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "payout_initiated"})
		})

		g.POST("/confirm-pickup", func(c *gin.Context) {
			var req struct {
				PickupCode string `json:"pickup_code" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := payoutSvc.ConfirmPickup(c.Request.Context(), req.PickupCode); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "collected"})
		})
	}
}
