package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/internal/email"
	"github.com/ista-goma/platform/pkg/apperror"
	"golang.org/x/crypto/bcrypt"
)

// Service encapsulates all authentication business logic.
type Service struct {
	repo    *Repository
	jwtSvc  *JWTService
	emailSvc *email.Service
	frontendURL string
}

// NewService creates a new auth service.
func NewService(repo *Repository, jwtSvc *JWTService, emailSvc *email.Service, frontendURL string) *Service {
	return &Service{
		repo:        repo,
		jwtSvc:      jwtSvc,
		emailSvc:    emailSvc,
		frontendURL: frontendURL,
	}
}

// LoginResponse is the data returned on successful login.
type LoginResponse struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

// Login validates email/password and returns a signed JWT on success.
func (s *Service) Login(ctx context.Context, email_, password string) (*LoginResponse, error) {
	user, err := s.repo.FindUserByEmail(ctx, email_)
	if err != nil {
		return nil, apperror.Unauthorized("invalid credentials")
	}

	if !user.Active {
		return nil, apperror.Unauthorized("account not yet activated")
	}

	creds, err := s.repo.GetCredentials(ctx, user.ID)
	if err != nil {
		return nil, apperror.Unauthorized("invalid credentials")
	}

	if creds.ActivatedAt == nil {
		return nil, apperror.Unauthorized("account not yet activated — check your email")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(password)); err != nil {
		return nil, apperror.Unauthorized("invalid credentials")
	}

	token, err := s.jwtSvc.Sign(user.ID, user.Email, string(user.Role), user.FacultyID)
	if err != nil {
		return nil, fmt.Errorf("signing token: %w", err)
	}

	return &LoginResponse{Token: token, User: user}, nil
}

// Me returns the authenticated user profile.
func (s *Service) Me(ctx context.Context, userID string) (*domain.User, error) {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, apperror.NotFound("user")
	}
	return user, nil
}

// ForgotPassword sends a password reset email to the user if they exist.
// The function always returns nil to prevent email enumeration attacks.
func (s *Service) ForgotPassword(ctx context.Context, emailAddr string) error {
	user, err := s.repo.FindUserByEmail(ctx, emailAddr)
	if err != nil {
		// Do not reveal whether the email exists.
		return nil
	}

	token, err := generateSecureToken()
	if err != nil {
		return fmt.Errorf("generating reset token: %w", err)
	}

	if err := s.repo.SavePasswordResetToken(ctx, user.ID, token, time.Now().Add(2*time.Hour)); err != nil {
		return fmt.Errorf("saving reset token: %w", err)
	}

	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, token)
	return s.emailSvc.SendPasswordReset(emailAddr, user.FirstName+" "+user.LastName, resetURL)
}

// ResetPassword validates the token and sets a new password.
func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	if err := validatePassword(newPassword); err != nil {
		return err
	}

	userID, err := s.repo.ConsumePasswordResetToken(ctx, token)
	if err != nil {
		return apperror.BadRequest("invalid or expired reset token")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hashing password: %w", err)
	}

	return s.repo.SavePasswordHash(ctx, userID, string(hash))
}

// ActivateAccount validates the activation token and sets the user's initial password.
func (s *Service) ActivateAccount(ctx context.Context, token, password string) (*LoginResponse, error) {
	if err := validatePassword(password); err != nil {
		return nil, err
	}

	userID, err := s.repo.ConsumeActivationToken(ctx, token)
	if err != nil {
		return nil, apperror.BadRequest("invalid or expired activation token")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}

	if err := s.repo.SavePasswordHash(ctx, userID, string(hash)); err != nil {
		return nil, fmt.Errorf("saving password: %w", err)
	}

	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("loading activated user: %w", err)
	}

	jwtToken, err := s.jwtSvc.Sign(user.ID, user.Email, string(user.Role), user.FacultyID)
	if err != nil {
		return nil, fmt.Errorf("signing token: %w", err)
	}

	return &LoginResponse{Token: jwtToken, User: user}, nil
}

// SendActivationEmail creates an activation token and sends it to the new user.
// Called by admin workflows when a new user account is provisioned.
func (s *Service) SendActivationEmail(ctx context.Context, userID string) error {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return apperror.NotFound("user")
	}

	token, err := generateSecureToken()
	if err != nil {
		return fmt.Errorf("generating activation token: %w", err)
	}

	if err := s.repo.SaveActivationToken(ctx, userID, token, time.Now().Add(72*time.Hour)); err != nil {
		return fmt.Errorf("saving activation token: %w", err)
	}

	activationURL := fmt.Sprintf("%s/activate?token=%s", s.frontendURL, token)
	fullName := user.FirstName + " " + user.LastName
	return s.emailSvc.SendAccountActivation(user.Email, fullName, activationURL)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func generateID() string {
	return uuid.New().String()
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return apperror.BadRequest("password must be at least 8 characters")
	}
	return nil
}
