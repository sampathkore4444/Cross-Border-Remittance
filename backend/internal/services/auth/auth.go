package auth

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ngoensai/backend/config"
	"github.com/ngoensai/backend/internal/core"
	"github.com/ngoensai/backend/internal/services/minio"
	"github.com/redis/go-redis/v9"
)

type Repository interface {
	CreateUser(ctx context.Context, u *core.User) error
	GetUserByPhone(ctx context.Context, phone string) (*core.User, error)
	GetUserByID(ctx context.Context, id string) (*core.User, error)
	UpdateKYCLevel(ctx context.Context, userID string, level core.KYCLevel) error
	SaveKYCDocument(ctx context.Context, userID, docType, docNumber, frontURL, backURL, selfieURL string) error
}

type Service struct {
	repo  Repository
	redis *redis.Client
	minio *minio.Service
	cfg   *config.Config
}

func New(repo Repository, rdb *redis.Client, m *minio.Service, cfg *config.Config) *Service {
	return &Service{repo: repo, redis: rdb, minio: m, cfg: cfg}
}

func (s *Service) SendOTP(ctx context.Context, phone string) error {
	key := fmt.Sprintf("otp:%s", phone)
	exists, _ := s.redis.Exists(ctx, key).Result()
	if exists > 0 {
		ttl, _ := s.redis.TTL(ctx, key).Result()
		if ttl > 120 {
			return fmt.Errorf("otp already sent, retry in %.0f seconds", ttl.Seconds())
		}
	}
	code, err := generateOTP()
	if err != nil {
		return fmt.Errorf("generate otp: %w", err)
	}
	if s.cfg.SandboxMode {
		code = "999999"
	}
	s.redis.Set(ctx, key, code, 5*time.Minute)
	s.redis.Set(ctx, fmt.Sprintf("otp_attempts:%s", phone), 0, 1*time.Hour)
	return nil
}

func extractCountryCode(phone string) string {
	if len(phone) >= 4 && phone[:1] == "+" {
		if len(phone) >= 3 && phone[:3] == "+66" {
			return "+66"
		}
		if len(phone) >= 3 && phone[:3] == "+85" {
			return "+856"
		}
		if len(phone) >= 2 {
			return phone[:2]
		}
	}
	if len(phone) >= 3 {
		return phone[:3]
	}
	return phone
}

func (s *Service) VerifyOTP(ctx context.Context, phone, code string) (*core.User, error) {
	key := fmt.Sprintf("otp:%s", phone)
	attemptsKey := fmt.Sprintf("otp_attempts:%s", phone)

	attempts, _ := s.redis.Get(ctx, attemptsKey).Int()
	if attempts >= 5 {
		return nil, fmt.Errorf("too many attempts, try again in 1 hour")
	}

	stored, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("otp expired or invalid")
	}
	if stored != code {
		s.redis.Incr(ctx, attemptsKey)
		return nil, fmt.Errorf("incorrect otp")
	}

	s.redis.Del(ctx, key)
	s.redis.Del(ctx, attemptsKey)

	user, err := s.repo.GetUserByPhone(ctx, phone)
	if err != nil {
		user = &core.User{
			Phone:       phone,
			CountryCode: extractCountryCode(phone),
			Role:        core.RoleSender,
			KYCLevel:    core.KYCUnverified,
			Language:    "lo",
			IsActive:    true,
		}
		if err := s.repo.CreateUser(ctx, user); err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
	}
	return user, nil
}

func (s *Service) GenerateToken(ctx context.Context, user *core.User) (accessToken, refreshToken string, err error) {
	accessClaims := jwt.MapClaims{
		"sub":   user.ID,
		"phone": user.Phone,
		"role":  string(user.Role),
		"kyc":   string(user.KYCLevel),
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
		"iat":   time.Now().Unix(),
	}
	access := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = access.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", "", fmt.Errorf("sign access: %w", err)
	}

	refreshClaims := jwt.MapClaims{
		"sub":  user.ID,
		"type": "refresh",
		"exp":  time.Now().Add(30 * 24 * time.Hour).Unix(),
	}
	refresh := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refresh.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", "", fmt.Errorf("sign refresh: %w", err)
	}

	s.redis.Set(ctx, fmt.Sprintf("refresh:%s", user.ID), refreshToken, 30*24*time.Hour)
	return accessToken, refreshToken, nil
}

func (s *Service) ValidateToken(tokenStr string) (*core.User, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid claims")
	}
	sub, _ := claims["sub"].(string)
	phone, _ := claims["phone"].(string)
	roleStr, _ := claims["role"].(string)
	kycStr, _ := claims["kyc"].(string)

	return &core.User{
		ID:       sub,
		Phone:    phone,
		Role:     core.UserRole(roleStr),
		KYCLevel: core.KYCLevel(kycStr),
	}, nil
}

func (s *Service) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	token, err := jwt.Parse(refreshToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid refresh token")
	}
	claims := token.Claims.(jwt.MapClaims)
	if claims["type"] != "refresh" {
		return "", "", fmt.Errorf("not a refresh token")
	}
	userID := claims["sub"].(string)

	stored, _ := s.redis.Get(ctx, fmt.Sprintf("refresh:%s", userID)).Result()
	if stored != refreshToken {
		return "", "", fmt.Errorf("refresh token revoked")
	}

	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return "", "", fmt.Errorf("user not found")
	}
	return s.GenerateToken(ctx, user)
}

func generateOTP() (string, error) {
	code := make([]byte, 6)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code[i] = byte('0') + byte(n.Int64())
	}
	return string(code), nil
}
