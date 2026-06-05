// Package middleware contains Gin middleware used across all routes.
package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/auth"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/response"
)

const userKey = "currentUser"

// Authenticate validates the Bearer JWT in the Authorization header and
// injects the parsed User into the Gin context. Requests without a valid
// token receive a 401 response and are aborted.
func Authenticate(jwtSvc *auth.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c, "missing or malformed Authorization header")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtSvc.Validate(token)
		if err != nil {
			response.Unauthorized(c, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set(userKey, claims)
		c.Next()
	}
}

// RequireRoles is an authorization middleware that ensures the authenticated
// user holds one of the allowed roles. Must be chained after Authenticate.
func RequireRoles(roles ...domain.Role) gin.HandlerFunc {
	allowed := make(map[domain.Role]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		claims, ok := GetClaims(c)
		if !ok {
			response.Unauthorized(c, "authentication required")
			c.Abort()
			return
		}
		if !allowed[domain.Role(claims.Role)] {
			response.Forbidden(c, "you do not have permission to access this resource")
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetClaims retrieves the JWT claims injected by Authenticate.
func GetClaims(c *gin.Context) (*auth.Claims, bool) {
	v, exists := c.Get(userKey)
	if !exists {
		return nil, false
	}
	claims, ok := v.(*auth.Claims)
	return claims, ok
}

// CurrentUserID is a convenience helper that extracts the user ID from context.
func CurrentUserID(c *gin.Context) string {
	claims, ok := GetClaims(c)
	if !ok {
		return ""
	}
	return claims.UserID
}
