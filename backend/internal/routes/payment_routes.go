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
	ListRecipients(ctx context.Context, userID string) ([]core.RecipientProfile, error)
	SaveRecipient(ctx context.Context, userID string, r core.RecipientProfile) error
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
					FXMargin:     tx.SourceAmount - float64(tx.TargetAmount)/tx.ExchangeRate,
					TotalPercent: (1 - float64(tx.TargetAmount)/(tx.SourceAmount*tx.ExchangeRate)) * 100,
				},
				PayoutOptions: []schemas.PayoutOption{
					{Method: "bcel_cash", TargetAmount: tx.TargetAmount, PickupTime: "15 min"},
					{Method: "seven_eleven_cash", TargetAmount: tx.TargetAmount - 10000, PickupTime: "15 min"},
					{Method: "mobile_topup", TargetAmount: int64(float64(tx.TargetAmount) * 0.97), PickupTime: "instant"},
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
				Status:         "awaiting_payment",
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
		g.POST("/recipients", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			var r schemas.RecipientRequest
			if err := c.ShouldBindJSON(&r); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			profile := core.RecipientProfile{
				Phone:        r.Phone,
				Name:         r.Name,
				Province:     r.Province,
				Relationship: r.Relationship,
			}
			if err := paySvc.SaveRecipient(c.Request.Context(), user.ID, profile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "recipient saved"})
		})

		g.GET("/recipients", func(c *gin.Context) {
			user := c.MustGet("user").(*core.User)
			recipients, err := paySvc.ListRecipients(c.Request.Context(), user.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"recipients": recipients})
		})
	}
}
