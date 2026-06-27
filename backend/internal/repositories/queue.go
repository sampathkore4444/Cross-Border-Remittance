package repositories

import (
	"github.com/rabbitmq/amqp091-go"
)

func NewQueue(url string) (*amqp091.Channel, error) {
	conn, err := amqp091.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	queues := []string{"payout.initiate", "payout.retry", "notification.send", "agent.payout_notify"}
	for _, q := range queues {
		ch.QueueDeclare(q, true, false, false, false, nil)
	}
	return ch, nil
}
