package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/common/middleware"
	"github.com/ngoensai/backend/internal/repositories"
	"github.com/ngoensai/backend/internal/routes"
	"github.com/ngoensai/backend/internal/services/agent"
	"github.com/ngoensai/backend/internal/services/auth"
	"github.com/ngoensai/backend/internal/services/autosend"
	"github.com/ngoensai/backend/internal/services/compliance"
	"github.com/ngoensai/backend/internal/services/fx"
	"github.com/ngoensai/backend/internal/services/minio"
	"github.com/ngoensai/backend/internal/services/notification"
	"github.com/ngoensai/backend/internal/services/payment"
	"github.com/ngoensai/backend/internal/services/payout"
	"github.com/ngoensai/backend/internal/services/treasury"
)

func main() {
	cfg := config.Load()
	pg, err := repositories.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	redis, err := repositories.NewRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("redis: %v", err)
	}
	queue, err := repositories.NewQueue(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("rabbitmq: %v", err)
	}
	minioSvc, err := minio.New(cfg.MinIOEndpoint, cfg.MinIOAccessKey, cfg.MinIOSecretKey, cfg.MinIOBucket)
	if err != nil {
		log.Fatalf("minio: %v", err)
	}

	authSvc := auth.New(pg, redis, minioSvc, cfg)
	paymentSvc := payment.New(pg, redis, queue, cfg)
	payoutSvc := payout.New(pg, queue, cfg)
	fxSvc := fx.New(redis, cfg)
	notifSvc := notification.New(queue, redis, cfg)
	agentSvc := agent.New(pg, redis, cfg)
	complianceSvc := compliance.New(pg, cfg)
	treasurySvc := treasury.New(pg, fxSvc, cfg)
	autoSvc := autosend.New(pg, paymentSvc, fxSvc, cfg)

	r := gin.Default()
	r.Use(middleware.CORS(cfg))
	r.Use(middleware.RateLimiter(redis))
	r.Use(middleware.RequestLogger())

	routes.RegisterAuth(r, authSvc)
	routes.RegisterPayment(r, paymentSvc, authSvc)
	routes.RegisterPayout(r, payoutSvc, authSvc)
	routes.RegisterFX(r, fxSvc, authSvc)
	routes.RegisterAgent(r, agentSvc, authSvc)
	routes.RegisterTreasury(r, treasurySvc, authSvc)
	routes.RegisterWebhooks(r, paymentSvc, payoutSvc)
	routes.RegisterAdmin(r, authSvc, treasurySvc, complianceSvc)

	treasurySvc.StartAutoConversion()
	autoSvc.StartScheduler()

	r.Run(":" + cfg.Port)
}
