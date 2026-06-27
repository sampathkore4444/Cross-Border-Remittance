package routes

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
	"github.com/ngoensai/backend/internal/schemas"
)

type PaymentService interface {
	Quote(ctx context.Context, sourceAmount float64, payoutMethod core.PayoutMethod) (*core.Transaction, error)
	InitiatePayment(ctx context.Context, senderID, txRef string, method core.PaymentMethod) (map[string]interface{}, error)
	ConfirmPayment(ctx context.Context, ref, providerRef string) error
	ListTransactions(ctx context.Context, senderID string, page, limit int) ([]core.Transaction, int, error)
	GetTransaction(ctx context.Context, ref string) (*core.Transaction, error)
}

type PaymentAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

func RegisterPayment(r *gin.Engine, paySvc PaymentService, authSvc PaymentAuthService) {
	g := r.Group("/v1", middleware.AuthRequired(authSvc))
	{
		g.POST("/quote", func(c *gin.Context) {
			var req schemas.QuoteRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			tx, err := paySvc.Quote(c.Request.Context(), req.SourceAmount, core.PayoutMethod(req.PayoutMethod))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, schemas.QuoteResponse{
				QuoteID:      tx.ID,
				SourceAmount: tx.SourceAmount,
				ExchangeRate: tx.ExchangeRate,
				TargetAmount: tx.TargetAmount,
				FeeBreakdown: schemas.FeeBreakdown{
					FXMargin:        tx.SourceAmount - float64(tx.TargetAmount)/tx.ExchangeRate,
					TotalFeePercent: (1 - float64(tx.TargetAmount)/(tx.SourceAmount*tx.ExchangeRate)) * 100,
				},
				RateExpiresAt: tx.QuotedAt.Add(15 * time.Minute).Format(time.RFC3339),
			})
		})

		g.POST("/transactions/send", func(c *gin.Context) {
			var req schemas.SendRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			user := c.MustGet("user").(*core.User)
			paymentInfo, err := paySvc.InitiatePayment(c.Request.Context(), user.ID, req.QuoteID, core.PaymentMethod(req.PaymentMethod))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, schemas.SendResponse{
				TransactionRef: req.QuoteID,
				Status:         "pending",
				Payment: schemas.PaymentInfo{
					Method:    paymentInfo["method"].(string),
					QRCode:    paymentInfo["qr_code"].(string),
					Amount:    paymentInfo["amount"].(float64),
					ExpiresAt: paymentInfo["expires_at"].(time.Time).Format(time.RFC3339),
				},
			})
		})

		g.GET("/transactions", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
			transactions, total, err := paySvc.ListTransactions(c.Request.Context(), user.ID, page, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"transactions": transactions, "total": total, "page": page, "limit": limit})
		})

		g.GET("/transactions/:ref", func(c *gin.Context) {
			ref := c.Param("ref")
			tx, err := paySvc.GetTransaction(c.Request.Context(), ref)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, tx)
		})
	}
}
