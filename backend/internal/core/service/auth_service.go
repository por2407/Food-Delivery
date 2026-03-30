package service

import (
	"context"
	"errors"
	"fmt"
	"food_delivery/config"
	"food_delivery/internal/core/domain"
	"food_delivery/internal/core/ports"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	oauth2v2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

type AuthService struct {
	repo ports.AuthRepositoryPort
	cfg  *config.Config
}

func NewAuthService(repo ports.AuthRepositoryPort, cfg *config.Config) *AuthService {
	return &AuthService{repo: repo, cfg: cfg}
}

func (s *AuthService) Register(ctx context.Context, req ports.RegisterRequest) (*ports.RegisterRequest, error) {
	// Check if user already exists
	existingUser, err := s.repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("email already in use")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Default role กำหนดที่ service layer (business logic ไม่ใช่ repo)
	if err := s.repo.RegisterUser(ctx, &domain.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Role:     req.Role,
		Phone:    req.Phone,
	}); err != nil {
		return nil, fmt.Errorf("failed to register user: %w", err)
	}

	return &req, nil
}

func (s *AuthService) generateToken(user *domain.User, secret string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(expiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (s *AuthService) Login(ctx context.Context, req ports.LoginRequest) (*ports.LoginResponse, error) {
	user, err := s.repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Access token: 7 วัน → ส่งเป็น Cookie
	accessToken, err := s.generateToken(user, s.cfg.JWT.Secret,
		time.Duration(s.cfg.JWT.ExpireHours)*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return &ports.LoginResponse{
		AccessToken: accessToken,
		Info: ports.InfoResponse{
			Name:   user.Name,
			Email:  user.Email,
			Role:   user.Role,
			Phone:  user.Phone,
			Avatar: user.Avatar,
		},
	}, nil
}

func (s *AuthService) EditProfileByID(ctx context.Context, userID int, req ports.EditProfileRequest) (*ports.InfoResponse, error) {
	user := &domain.User{
		ID:     userID,
		Name:   req.Name,
		Phone:  req.Phone,
		Avatar: req.Avatar,
	}

	if err := s.repo.EditProfileByID(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to edit profile: %w", err)
	}

	// ประกอบ response จาก req + JWT locals (email, role)
	// ไม่ต้อง query DB อีกรอบ เพราะ email/role ไม่มีการเปลี่ยนแปลง
	return &ports.InfoResponse{
		Name:   req.Name,
		Email:  req.Email,
		Role:   req.Role,
		Phone:  req.Phone,
		Avatar: req.Avatar,
	}, nil
}

// ChangePassword → login อยู่แล้ว ยืนยันรหัสเก่าก่อน
func (s *AuthService) ChangePassword(ctx context.Context, userID int, req ports.ChangePasswordRequest) error {
	// ดึง user จาก DB เพื่อเอา hashed password เก่ามาตรวจ
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return errors.New("user not found")
	}

	// ตรวจสอบรหัสผ่านเก่า
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return errors.New("old password is incorrect")
	}

	// ห้ามตั้งรหัสเดิม
	if req.OldPassword == req.NewPassword {
		return errors.New("new password must be different from old password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	if err := s.repo.UpdatePasswordByID(ctx, userID, string(hashedPassword)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}

// ResetPassword → login ไม่ได้ ยืนยัน email + เบอร์โทรแทน
func (s *AuthService) ResetPassword(ctx context.Context, req ports.ResetPasswordRequest) error {
	// หา user ด้วย email
	user, err := s.repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return errors.New("email or phone number is incorrect")
	}

	// ตรวจสอบเบอร์โทรตรงกับ DB ไหม (ข้อความ error เดียวกัน เพื่อไม่บอก attacker ว่าอันไหนผิด)
	if user.Phone != req.Phone {
		return errors.New("email or phone number is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	if err := s.repo.UpdatePasswordByID(ctx, user.ID, string(hashedPassword)); err != nil {
		return fmt.Errorf("failed to reset password: %w", err)
	}
	return nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID int) (*ports.InfoResponse, error) {
	user, err := s.repo.FindProfileByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user profile: %w", err)
	}

	return &ports.InfoResponse{
		Name:   user.Name,
		Email:  user.Email,
		Role:   user.Role,
		Phone:  user.Phone,
		Avatar: user.Avatar,
	}, nil
}

// ─── Google OAuth ────────────────────────────────────────────────────

func (s *AuthService) oauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     s.cfg.Google.ClientID,
		ClientSecret: s.cfg.Google.ClientSecret,
		RedirectURL:  s.cfg.Google.RedirectURL,
		Endpoint:     google.Endpoint,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}
}

func (s *AuthService) GoogleLogin(ctx context.Context) (string, error) {
	// สร้าง state (ในโปรเจคจริงควรเก็บใน session หรือ cookie เพื่อป้องกัน CSRF)
	url := s.oauthConfig().AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	return url, nil
}

func (s *AuthService) GoogleCallback(ctx context.Context, code string) (*ports.LoginResponse, error) {
	config := s.oauthConfig()

	// 1. แลกเปลี่ยน code เป็น token
	tok, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange token: %w", err)
	}

	// 2. ดึงข้อมูล User จาก Google API
	oauth2Service, err := oauth2v2.NewService(ctx, option.WithTokenSource(config.TokenSource(ctx, tok)))
	if err != nil {
		return nil, fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	userinfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	// 3. ตรวจสอบว่า User มีอยู่แล้วหรือไม่
	user, err := s.repo.FindUserByEmail(ctx, userinfo.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// 4. ถ้าไม่มีให้ Create ใหม่ (Social Login ไม่มี password)
	if user == nil {
		user = &domain.User{
			Email:  userinfo.Email,
			Name:   userinfo.Name,
			Avatar: userinfo.Picture,
			Role:   "user", // Default role for social login
		}
		if err := s.repo.RegisterUser(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to auto-register user: %w", err)
		}
		// ดึงมาใหม่เพื่อให้ได้ ID
		user, _ = s.repo.FindUserByEmail(ctx, userinfo.Email)
	}

	// 5. ออก Access Token (JWT)
	accessToken, err := s.generateToken(user, s.cfg.JWT.Secret,
		time.Duration(s.cfg.JWT.ExpireHours)*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return &ports.LoginResponse{
		AccessToken: accessToken,
		Info: ports.InfoResponse{
			Name:   user.Name,
			Email:  user.Email,
			Role:   user.Role,
			Phone:  user.Phone,
			Avatar: user.Avatar,
		},
	}, nil
}
