package config

import "os"

type Config struct {
	Port        string
	Environment string
	DatabaseURL string
	RedisURL    string
	RabbitMQURL string

	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIOUseSSL    bool

	KasikornAPIKey string
	KasikornSecret string
	KasikornAcctNo string

	BCELAPIKey string
	BCELSecret string
	BCELAcctNo string

	TrueMoneyKey    string
	TrueMoneySecret string

	UnitelAPIKey string
	UnitelSecret string

	LaoSMSAPIKey string
	FCMKey       string
	HMSKey       string

	JWTSecret string
	JWTExpiry string

	FXUpdateInterval string
	FXSpreadLAK      float64
	SandboxMode      bool
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENV", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://ngoensai:pass@localhost:5432/ngoensai"),
		RedisURL:    getEnv("REDIS_URL", "localhost:6379"),
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672"),

		MinIOEndpoint:  getEnv("MINIO_ENDPOINT", "minio.ngoensai.la:9000"),
		MinIOAccessKey: getEnv("MINIO_ACCESS_KEY", "ngoensai"),
		MinIOSecretKey: getEnv("MINIO_SECRET_KEY", "change-me-in-prod"),
		MinIOBucket:    getEnv("MINIO_BUCKET", "ngoensai-docs"),
		MinIOUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",

		KasikornAPIKey: getEnv("KASIKORN_API_KEY", ""),
		KasikornSecret: getEnv("KASIKORN_SECRET", ""),
		KasikornAcctNo: getEnv("KASIKORN_ACCT", ""),

		BCELAPIKey: getEnv("BCEL_API_KEY", ""),
		BCELSecret: getEnv("BCEL_SECRET", ""),
		BCELAcctNo: getEnv("BCEL_ACCT", ""),

		TrueMoneyKey:    getEnv("TRUEMONEY_KEY", ""),
		TrueMoneySecret: getEnv("TRUEMONEY_SECRET", ""),

		UnitelAPIKey: getEnv("UNITEL_API_KEY", ""),
		JWTSecret:    getEnv("JWT_SECRET", "dev-secret-do-not-use-in-prod"),
		JWTExpiry:    getEnv("JWT_EXPIRY", "15m"),

		FXUpdateInterval: getEnv("FX_UPDATE_INTERVAL", "15m"),
		FXSpreadLAK:      3.0,
		SandboxMode:      getEnv("SANDBOX", "true") == "true",
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
