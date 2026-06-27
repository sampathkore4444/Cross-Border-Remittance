package notification

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ngoensai/backend/config"
	"github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	queue *amqp091.Channel
	redis *redis.Client
	cfg   *config.Config
}

func New(q *amqp091.Channel, rdb *redis.Client, cfg *config.Config) *Service {
	return &Service{queue: q, redis: rdb, cfg: cfg}
}

func (s *Service) SendSMS(ctx context.Context, phone, message string) error {
	payload, _ := json.Marshal(map[string]string{
		"phone":   phone,
		"message": message,
		"type":    "sms",
	})
	return s.queue.Publish("ngoensai", "notification.send", false, false,
		amqp091.Publishing{ContentType: "application/json", Body: payload})
}

func (s *Service) SendPush(ctx context.Context, userID, title, body string) error {
	tokenKey := fmt.Sprintf("fcm_token:%s", userID)
	token, err := s.redis.Get(ctx, tokenKey).Result()
	if err != nil {
		return nil
	}

	payload, _ := json.Marshal(map[string]string{
		"token": token,
		"title": title,
		"body":  body,
		"type":  "push",
	})
	return s.queue.Publish("ngoensai", "notification.send", false, false,
		amqp091.Publishing{ContentType: "application/json", Body: payload})
}

func (s *Service) SendSMSDirect(ctx context.Context, phone, message string) error {
	return nil
}

func (s *Service) SendPushDirect(ctx context.Context, token, title, body string) error {
	return nil
}
