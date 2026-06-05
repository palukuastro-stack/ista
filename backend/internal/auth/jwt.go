// Package auth provides JWT generation and validation for the platform.
package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims is the payload embedded in every JWT issued by the platform.
type Claims struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	FacultyID string `json:"facultyId,omitempty"`
	jwt.RegisteredClaims
}

// JWTService signs and validates JWTs using HMAC-SHA256.
type JWTService struct {
	secret      []byte
	expiryHours int
}

// NewJWTService creates a JWTService.
func NewJWTService(secret string, expiryHours int) *JWTService {
	return &JWTService{
		secret:      []byte(secret),
		expiryHours: expiryHours,
	}
}

// Sign creates a signed JWT for the given user fields.
func (s *JWTService) Sign(userID, email, role, facultyID string) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		FacultyID: facultyID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(s.expiryHours) * time.Hour)),
			Issuer:    "ista-goma",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

// Validate parses and validates a JWT string, returning the embedded claims.
func (s *JWTService) Validate(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("validating token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}
