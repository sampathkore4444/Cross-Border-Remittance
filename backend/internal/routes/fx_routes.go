package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/core"
)

type FXService interface {
	GetRate(ctx context.Context) (float64, float64, error)
	LockRate(ctx context.Context, txRef string, rate float64) error
	GetLockedRate(ctx context.Context, txRef string) (float64, error)
}

type FXAuthService interface {
	ValidateToken(token string) (*core.User, error)
}

func RegisterFX(r *gin.Engine, fxSvc FXService, authSvc FXAuthService) {
	g := r.Group("/v1/fx", middleware.AuthRequired(authSvc))
	{
		g.GET("/rate", func(c *gin.Context) {
			rate, midRate, err := fxSvc.GetRate(c.Request.Context())
			if err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "rate not available"})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"rate":       rate,
				"mid_market": midRate,
				"spread":     midRate - rate,
				"currency":   "THB_LAK",
			})
		})

		g.POST("/rate/lock", func(c *gin.Context) {
			var req struct {
				TransactionRef string  `json:"transaction_ref" binding:"required"`
				Rate           float64 `json:"rate" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := fxSvc.LockRate(c.Request.Context(), req.TransactionRef, req.Rate); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "locked"})
		})

		g.GET("/rate/lock/:tx_ref", func(c *gin.Context) {
			txRef := c.Param("tx_ref")
			rate, err := fxSvc.GetLockedRate(c.Request.Context(), txRef)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"rate": rate})
		})
	}
}
