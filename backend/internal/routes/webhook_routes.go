package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

type WebhookPaymentService interface {
	ConfirmPayment(ctx context.Context, ref, providerRef string) error
}

type WebhookPayoutService interface {
	ProcessPayout(ctx context.Context, ref string) error
}

func RegisterWebhooks(r *gin.Engine, paySvc WebhookPaymentService, payoutSvc WebhookPayoutService) {
	g := r.Group("/v1/webhooks")
	{
		g.POST("/payment/confirmed", func(c *gin.Context) {
			var req struct {
				TransactionRef string `json:"transaction_ref" binding:"required"`
				ProviderRef    string `json:"provider_ref"`
				Status         string `json:"status" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if req.Status != "success" {
				c.JSON(http.StatusOK, gin.H{"status": "ignored"})
				return
			}
			if err := paySvc.ConfirmPayment(c.Request.Context(), req.TransactionRef, req.ProviderRef); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "confirmed"})
		})

		g.POST("/payout/completed", func(c *gin.Context) {
			var req struct {
				TransactionRef string `json:"transaction_ref" binding:"required"`
				Status         string `json:"status" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := payoutSvc.ProcessPayout(c.Request.Context(), req.TransactionRef); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "completed"})
		})
	}
}
