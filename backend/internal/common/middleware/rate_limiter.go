package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimiter(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := "rate:" + c.ClientIP() + ":" + c.FullPath()
		count, err := rdb.Incr(c.Request.Context(), key).Result()
		if err != nil {
			c.Next()
			return
		}
		if count == 1 {
			rdb.Expire(c.Request.Context(), key, 1*time.Minute)
		}
		if count > 100 {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			c.Abort()
			return
		}
		c.Next()
	}
}
