package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/core"
	"github.com/ngoensai/backend/internal/schemas"
)

type AuthService interface {
	SendOTP(ctx context.Context, phone string) error
	VerifyOTP(ctx context.Context, phone, code string) (*core.User, error)
	GenerateToken(ctx context.Context, user *core.User) (string, string, error)
	RefreshToken(ctx context.Context, token string) (string, string, error)
}

func RegisterAuth(r *gin.Engine, authSvc AuthService) {
	g := r.Group("/v1/auth")
	{
		g.POST("/register", func(c *gin.Context) {
			var req schemas.RegisterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := authSvc.SendOTP(c.Request.Context(), req.Phone); err != nil {
				c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "otp_sent", "retry_after_seconds": 60})
		})

		g.POST("/verify", func(c *gin.Context) {
			var req schemas.VerifyRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			user, err := authSvc.VerifyOTP(c.Request.Context(), req.Phone, req.OTP)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			access, refresh, err := authSvc.GenerateToken(c.Request.Context(), user)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
				return
			}
			c.JSON(http.StatusOK, schemas.AuthResponse{
				AccessToken:  access,
				RefreshToken: refresh,
				ExpiresIn:    900,
				User: schemas.UserSummary{
					ID:       user.ID,
					Phone:    req.Phone,
					KYCLevel: string(user.KYCLevel),
					IsNew:    true,
				},
			})
		})

		g.POST("/refresh", func(c *gin.Context) {
			var req schemas.RefreshRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			access, refresh, err := authSvc.RefreshToken(c.Request.Context(), req.RefreshToken)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"access_token": access, "refresh_token": refresh})
		})
	}
}
