package core

import "time"

type UserRole string

const (
	RoleSender    UserRole = "sender"
	RoleRecipient UserRole = "recipient"
	RoleAgent     UserRole = "agent"
	RoleAdmin     UserRole = "admin"
)

type KYCLevel string

const (
	KYCUnverified KYCLevel = "unverified"
	KYCLevel1     KYCLevel = "level_1"
	KYCLevel2     KYCLevel = "level_2"
	KYCLevel3     KYCLevel = "level_3"
)

type User struct {
	ID          string    `json:"id"`
	Phone       string    `json:"phone"`
	CountryCode string    `json:"country_code"`
	Name        string    `json:"name"`
	DateOfBirth string    `json:"date_of_birth,omitempty"`
	Role        UserRole  `json:"role"`
	KYCLevel    KYCLevel  `json:"kyc_level"`
	Language    string    `json:"language"`
	DeviceID    string    `json:"-"`
	FCMToken    string    `json:"-"`
	HMSToken    string    `json:"-"`
	IsActive    bool      `json:"is_active"`
	IsLocked    bool      `json:"is_locked"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
