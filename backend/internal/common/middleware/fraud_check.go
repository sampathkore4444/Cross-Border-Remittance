package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/internal/core"
)

type FraudRecord struct {
	UserID    string
	Count     int
	FirstSeen time.Time
	LastSeen  time.Time
}

type FraudEngine struct {
	mu      sync.Mutex
	records map[string]*FraudRecord

	velocityThreshold int
	velocityWindow    time.Duration
}

func NewFraudEngine() *FraudEngine {
	return &FraudEngine{
		records:           make(map[string]*FraudRecord),
		velocityThreshold: 5,
		velocityWindow:    1 * time.Hour,
	}
}

func (e *FraudEngine) CheckVelocity(ctx context.Context, userID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	now := time.Now()
	rec, ok := e.records[userID]
	if !ok {
		e.records[userID] = &FraudRecord{
			UserID:    userID,
			Count:     1,
			FirstSeen: now,
			LastSeen:  now,
		}
		return nil
	}

	if now.Sub(rec.FirstSeen) > e.velocityWindow {
		rec.Count = 1
		rec.FirstSeen = now
		rec.LastSeen = now
		return nil
	}

	rec.Count++
	rec.LastSeen = now

	if rec.Count > e.velocityThreshold {
		return fmt.Errorf("velocity check failed: %d transactions in %v (limit %d)",
			rec.Count, e.velocityWindow, e.velocityThreshold)
	}
	return nil
}

func (e *FraudEngine) CheckAmountRoundness(amount float64) error {
	if amount > 10000 && amount == float64(int64(amount)) && int64(amount)%1000 == 0 {
		return fmt.Errorf("amount roundness flag: %.2f is suspiciously round", amount)
	}
	return nil
}

func FraudVelocityCheck(engine *FraudEngine) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.Next()
			return
		}
		u, ok := user.(*core.User)
		if !ok || u == nil {
			c.Next()
			return
		}
		if err := engine.CheckVelocity(c.Request.Context(), u.ID); err != nil {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   err.Error(),
				"flagged": true,
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
