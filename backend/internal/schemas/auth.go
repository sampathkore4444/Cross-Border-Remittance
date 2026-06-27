package schemas

type RegisterRequest struct {
	Phone       string `json:"phone" binding:"required"`
	CountryCode string `json:"country_code" binding:"required"`
	Language    string `json:"language" default:"lo"`
}

type VerifyRequest struct {
	Phone    string `json:"phone" binding:"required"`
	OTP      string `json:"otp" binding:"required,len=6"`
	DeviceID string `json:"device_id"`
	FCMToken string `json:"fcm_token"`
}

type AuthResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int         `json:"expires_in"`
	User         UserSummary `json:"user"`
}

type UserSummary struct {
	ID       string `json:"id"`
	Phone    string `json:"phone"`
	Name     string `json:"name"`
	KYCLevel string `json:"kyc_level"`
	IsNew    bool   `json:"is_new"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type KYCUploadRequest struct {
	DocumentType string `json:"document_type" binding:"required"`
	DocumentData string `json:"document_data" binding:"required"`
}
