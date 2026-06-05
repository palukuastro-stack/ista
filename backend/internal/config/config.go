// Package config loads application configuration from environment variables.
// All required variables are validated at startup; missing values cause an
// immediate, explicit fatal error so that misconfiguration is never silent.
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds every setting the application needs to start.
type Config struct {
	// Server
	Port string
	Env  string // "development" | "production"

	// Database
	DatabaseURL string

	// JWT
	JWTSecret          string
	JWTExpiryHours     int
	RefreshExpiryHours int

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string

	// Resend (email)
	ResendAPIKey  string
	EmailFromName string
	EmailFromAddr string

	// Frontend
	FrontendURL string
}

// Load reads the .env file (if present) and then environment variables.
// Call once at startup.
func Load() (*Config, error) {
	// Load .env if it exists — ignore error (it's optional in production).
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("APP_ENV", "development"),
		DatabaseURL:        mustGetEnv("DATABASE_URL"),
		JWTSecret:          mustGetEnv("JWT_SECRET"),
		JWTExpiryHours:     getEnvInt("JWT_EXPIRY_HOURS", 24),
		RefreshExpiryHours: getEnvInt("REFRESH_EXPIRY_HOURS", 168),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		EmailFromName:      getEnv("EMAIL_FROM_NAME", "ISTA-GOMA"),
		EmailFromAddr:      getEnv("EMAIL_FROM_ADDR", "noreply@ista-goma.cd"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5000"),
	}

	return cfg, nil
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
