package fx

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/ngoensai/backend/config"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	redis        *redis.Client
	cfg          *config.Config
	mu           sync.RWMutex
	currentRate  float64
	midMarket    float64
	lastUpdated  time.Time
	overrideRate *float64
	overrideMid  *float64
}

func New(rdb *redis.Client, cfg *config.Config) *Service {
	return &Service{redis: rdb, cfg: cfg}
}

func (s *Service) StartRateUpdater() {
	ticker := time.NewTicker(15 * time.Minute)
	go func() {
		for range ticker.C {
			s.refreshRate()
		}
	}()
	s.refreshRate()
}

func (s *Service) refreshRate() {
	ctx := context.Background()
	mid, err := s.fetchMidMarketRate(ctx)
	if err != nil {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.midMarket = mid
	s.currentRate = mid - s.cfg.FXSpreadLAK
	s.lastUpdated = time.Now()

	rateData, _ := json.Marshal(map[string]interface{}{
		"rate":       s.currentRate,
		"mid_market": s.midMarket,
		"updated":    s.lastUpdated,
	})
	s.redis.Set(ctx, "fx:current_rate", rateData, 20*time.Minute)
	s.redis.Set(ctx, "fx:mid_market", mid, 20*time.Minute)
}

func (s *Service) GetRate(ctx context.Context) (float64, float64, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.currentRate == 0 {
		data, err := s.redis.Get(ctx, "fx:current_rate").Bytes()
		if err != nil {
			return 0, 0, fmt.Errorf("rate not available")
		}
		var cached struct {
			Rate      float64 `json:"rate"`
			MidMarket float64 `json:"mid_market"`
		}
		json.Unmarshal(data, &cached)
		return cached.Rate, cached.MidMarket, nil
	}
	return s.currentRate, s.midMarket, nil
}

func (s *Service) LockRate(ctx context.Context, txRef string, rate float64) error {
	return s.redis.Set(ctx, fmt.Sprintf("fx:lock:%s", txRef), rate, 15*time.Minute).Err()
}

func (s *Service) GetLockedRate(ctx context.Context, txRef string) (float64, error) {
	rate, err := s.redis.Get(ctx, fmt.Sprintf("fx:lock:%s", txRef)).Float64()
	if err != nil {
		return 0, fmt.Errorf("rate lock expired")
	}
	return rate, nil
}

func (s *Service) ConvertTHBtoLAK(ctx context.Context, amountTHB float64) (int64, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	rate := s.currentRate
	if rate == 0 {
		return 0, fmt.Errorf("rate not available")
	}
	return int64(amountTHB * rate), nil
}

func (s *Service) fetchMidMarketRate(ctx context.Context) (float64, error) {
	rate := s.cfg.FXBaseRate + rand.Float64()*s.cfg.FXRateVariance
	return rate, nil
}

func (s *Service) SetOverrideRate(ctx context.Context, rate, midMarket float64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.overrideRate = &rate
	s.overrideMid = &midMarket
	s.currentRate = rate
	s.midMarket = midMarket
	s.lastUpdated = time.Now()
	return nil
}

func (s *Service) ClearOverrideRate(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.overrideRate = nil
	s.overrideMid = nil
	s.refreshRate()
	return nil
}

func (s *Service) GetOverrideStatus(ctx context.Context) (bool, float64, float64) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.overrideRate != nil {
		return true, *s.overrideRate, *s.overrideMid
	}
	return false, 0, 0
}
