package auth

import (
        "net/http"

        "github.com/gin-gonic/gin"
        "github.com/ista-goma/platform/pkg/apperror"
        "github.com/ista-goma/platform/pkg/response"
)

// Handler exposes auth endpoints through Gin.
type Handler struct {
        svc *Service
}

// NewHandler creates a new auth handler.
func NewHandler(svc *Service) *Handler {
        return &Handler{svc: svc}
}

// RegisterRoutes mounts public auth routes (no JWT required).
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
        rg.POST("/login", h.Login)
        rg.POST("/logout", h.Logout)
        rg.POST("/forgot-password", h.ForgotPassword)
        rg.POST("/reset-password", h.ResetPassword)
        rg.POST("/activate", h.Activate)
}

// RegisterProtectedRoutes mounts auth routes that require a valid JWT.
// Call this on the authenticated router group.
func (h *Handler) RegisterProtectedRoutes(rg *gin.RouterGroup) {
        rg.GET("/auth/me", h.Me)
}

// Login godoc
//
//      @Summary     Authenticate a user
//      @Description Validates email/password credentials and returns a JWT access token.
//      @Tags        auth
//      @Accept      json
//      @Produce     json
//      @Param       body body loginRequest true "Credentials"
//      @Success     200  {object} response.Envelope{data=LoginResponse}
//      @Failure     401  {object} response.Envelope
//      @Router      /v1/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
        var req loginRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                response.BadRequest(c, "invalid request body")
                return
        }
        if req.Email == "" || req.Password == "" {
                response.BadRequest(c, "email and password are required")
                return
        }

        res, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
        if err != nil {
                handleError(c, err)
                return
        }
        response.OK(c, res)
}

// Me returns the currently authenticated user's profile.
// Must be called on a route protected by the Authenticate middleware.
func (h *Handler) Me(c *gin.Context) {
        // Import inline to avoid circular deps — use the context key directly.
        claimsRaw, exists := c.Get("currentUser")
        if !exists {
                response.Unauthorized(c, "authentication required")
                return
        }
        claims, ok := claimsRaw.(*Claims)
        if !ok {
                response.Unauthorized(c, "invalid token claims")
                return
        }
        user, err := h.svc.Me(c.Request.Context(), claims.UserID)
        if err != nil {
                handleError(c, err)
                return
        }
        response.OK(c, gin.H{"user": user})
}

// Logout is a no-op on the server (JWT is stateless). The client is
// responsible for discarding the token. This endpoint exists so that the
// frontend has a consistent lifecycle hook for server-side cleanup if needed.
func (h *Handler) Logout(c *gin.Context) {
        c.Status(http.StatusNoContent)
}

// ForgotPassword sends a reset link to the provided email if it exists.
func (h *Handler) ForgotPassword(c *gin.Context) {
        var req struct{ Email string `json:"email"` }
        if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" {
                response.BadRequest(c, "email is required")
                return
        }
        // Always return 200 to prevent email enumeration.
        _ = h.svc.ForgotPassword(c.Request.Context(), req.Email)
        response.OKMessage(c, "if the email exists, a reset link has been sent", nil)
}

// ResetPassword consumes a reset token and sets a new password.
func (h *Handler) ResetPassword(c *gin.Context) {
        var req struct {
                Token    string `json:"token"`
                Password string `json:"password"`
        }
        if err := c.ShouldBindJSON(&req); err != nil || req.Token == "" || req.Password == "" {
                response.BadRequest(c, "token and password are required")
                return
        }
        if err := h.svc.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
                handleError(c, err)
                return
        }
        response.OKMessage(c, "password updated successfully", nil)
}

// Activate consumes an account activation token and sets the initial password.
func (h *Handler) Activate(c *gin.Context) {
        var req struct {
                Token    string `json:"token"`
                Password string `json:"password"`
        }
        if err := c.ShouldBindJSON(&req); err != nil || req.Token == "" || req.Password == "" {
                response.BadRequest(c, "token and password are required")
                return
        }
        res, err := h.svc.ActivateAccount(c.Request.Context(), req.Token, req.Password)
        if err != nil {
                handleError(c, err)
                return
        }
        response.OK(c, res)
}

// ─── Request types ────────────────────────────────────────────────────────────

type loginRequest struct {
        Email    string `json:"email"`
        Password string `json:"password"`
}

// ─── Error translation ────────────────────────────────────────────────────────

func handleError(c *gin.Context, err error) {
        if ae, ok := err.(*apperror.AppError); ok {
                switch ae.Kind {
                case apperror.KindNotFound:
                        response.NotFound(c, ae.Message)
                case apperror.KindConflict:
                        response.Conflict(c, ae.Message)
                case apperror.KindForbidden:
                        response.Forbidden(c, ae.Message)
                case apperror.KindBadRequest:
                        response.BadRequest(c, ae.Message)
                case apperror.KindUnauth:
                        response.Unauthorized(c, ae.Message)
                default:
                        response.InternalServerError(c, ae.Message)
                }
                return
        }
        response.InternalServerError(c, "an unexpected error occurred")
}
