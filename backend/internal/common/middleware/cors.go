package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/config"
)

func CORS(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Idempotency-Key")
		c.Header("Access-Control-Expose-Headers", "X-Request-Id")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
