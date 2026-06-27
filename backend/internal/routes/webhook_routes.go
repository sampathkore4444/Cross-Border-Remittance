package routes

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

var webhookSecret = getWebhookSecret()

func getWebhookSecret() string {
	s := os.Getenv("WEBHOOK_SECRET")
	if s == "" {
		return "ngoensai-webhook-secret-dev"
	}
	return s
}

func verifyWebhookSignature(body []byte, signatureHeader string) error {
	if signatureHeader == "" {
		return fmt.Errorf("missing x-webhook-signature header")
	}
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signatureHeader), []byte(expected)) {
		return fmt.Errorf("invalid webhook signature")
	}
	return nil
}

type WebhookPaymentService interface {
	ConfirmPayment(ctx context.Context, ref, providerRef string) error
}

type WebhookPayoutService interface {
	ProcessPayout(ctx context.Context, ref string) error
}

func RegisterWebhooks(r *gin.Engine, paySvc WebhookPaymentService, payoutSvc WebhookPayoutService) {
	paymentHandler := func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read body"})
			return
		}
		sig := c.GetHeader("X-Signature")
		if err := verifyWebhookSignature(body, sig); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

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
	}

	g := r.Group("/v1/webhooks")
	{
		g.POST("/payment/confirmed", paymentHandler)
		g.POST("/payout/completed", func(c *gin.Context) {
			body, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read body"})
				return
			}
			sig := c.GetHeader("X-Signature")
			if err := verifyWebhookSignature(body, sig); err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

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

	r.POST("/webhooks/kasikorn", paymentHandler)
}
