package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations related to authentication.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new auth repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// FindUserByEmail looks up a user by their email address.
func (r *Repository) FindUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	const q = `
		SELECT id, first_name, last_name, middle_name, email, role,
		       faculty_id, ref_id, phone, avatar, description, active, created_at, updated_at
		  FROM users
		 WHERE email = $1`

	u := &domain.User{}
	err := r.db.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.MiddleName, &u.Email, &u.Role,
		&u.FacultyID, &u.RefID, &u.Phone, &u.Avatar, &u.Description,
		&u.Active, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("finding user by email: %w", err)
	}
	return u, nil
}

// FindUserByID looks up a user by their primary key.
func (r *Repository) FindUserByID(ctx context.Context, id string) (*domain.User, error) {
	const q = `
		SELECT id, first_name, last_name, middle_name, email, role,
		       faculty_id, ref_id, phone, avatar, description, active, created_at, updated_at
		  FROM users
		 WHERE id = $1`

	u := &domain.User{}
	err := r.db.QueryRow(ctx, q, id).Scan(
		&u.ID, &u.FirstName, &u.LastName, &u.MiddleName, &u.Email, &u.Role,
		&u.FacultyID, &u.RefID, &u.Phone, &u.Avatar, &u.Description,
		&u.Active, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("finding user by id: %w", err)
	}
	return u, nil
}

// GetCredentials returns the stored password hash for a user.
func (r *Repository) GetCredentials(ctx context.Context, userID string) (*domain.UserCredentials, error) {
	const q = `SELECT user_id, password_hash, activated_at FROM user_credentials WHERE user_id = $1`
	creds := &domain.UserCredentials{}
	err := r.db.QueryRow(ctx, q, userID).Scan(&creds.UserID, &creds.PasswordHash, &creds.ActivatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting credentials: %w", err)
	}
	return creds, nil
}

// SavePasswordHash stores or updates the bcrypt hash for a user's password.
func (r *Repository) SavePasswordHash(ctx context.Context, userID, hash string) error {
	const q = `
		INSERT INTO user_credentials (user_id, password_hash, activated_at)
		     VALUES ($1, $2, NOW())
		ON CONFLICT (user_id) DO UPDATE
		       SET password_hash = EXCLUDED.password_hash,
		           activated_at  = COALESCE(user_credentials.activated_at, NOW())`
	_, err := r.db.Exec(ctx, q, userID, hash)
	return err
}

// SaveActivationToken stores a time-limited token used to activate a new account.
func (r *Repository) SaveActivationToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	const q = `
		INSERT INTO activation_tokens (id, user_id, token, expires_at)
		     VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE
		       SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`
	_, err := r.db.Exec(ctx, q, uuid.New().String(), userID, token, expiresAt)
	return err
}

// ConsumeActivationToken validates and deletes an activation token.
// Returns the userID it belongs to, or an error if invalid/expired.
func (r *Repository) ConsumeActivationToken(ctx context.Context, token string) (string, error) {
	const q = `
		DELETE FROM activation_tokens
		 WHERE token = $1 AND expires_at > NOW()
		RETURNING user_id`
	var userID string
	err := r.db.QueryRow(ctx, q, token).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("activation token invalid or expired: %w", err)
	}
	return userID, nil
}

// SavePasswordResetToken stores a time-limited token for password recovery.
func (r *Repository) SavePasswordResetToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	const q = `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
		     VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE
		       SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`
	_, err := r.db.Exec(ctx, q, uuid.New().String(), userID, token, expiresAt)
	return err
}

// ConsumePasswordResetToken validates and deletes a password reset token.
func (r *Repository) ConsumePasswordResetToken(ctx context.Context, token string) (string, error) {
	const q = `
		DELETE FROM password_reset_tokens
		 WHERE token = $1 AND expires_at > NOW()
		RETURNING user_id`
	var userID string
	err := r.db.QueryRow(ctx, q, token).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("reset token invalid or expired: %w", err)
	}
	return userID, nil
}
