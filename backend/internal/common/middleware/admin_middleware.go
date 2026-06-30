package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ngoensai/backend/internal/core"
)

type AdminTokenValidator interface {
	ValidateToken(token string) (*core.User, error)
}

func AdminAuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			c.Abort()
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid claims"})
			c.Abort()
			return
		}

		role := core.UserRole(claims["role"].(string))
		c.Set("admin_id", claims["sub"].(string))
		c.Set("admin_role", string(role))
		c.Next()
	}
}

func RequirePermission(permissions ...core.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleStr, _ := c.Get("admin_role")
		role := core.UserRole(roleStr.(string))

		allowed, ok := core.RolePermissions[role]
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "unknown role"})
			c.Abort()
			return
		}

		permMap := make(map[core.Permission]bool)
		for _, p := range allowed {
			permMap[p] = true
		}

		for _, required := range permissions {
			if permMap[required] {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		c.Abort()
	}
}
