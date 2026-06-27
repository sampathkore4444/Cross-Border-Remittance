package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/core"
)

type TokenValidator interface {
	ValidateToken(token string) (*core.User, error)
}

func AuthRequired(validator TokenValidator) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			c.Abort()
			return
		}
		token := strings.TrimPrefix(auth, "Bearer ")
		user, err := validator.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}
		c.Set("user", user)
		c.Next()
	}
}
