package notifications

import (
	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/internal/middleware"
	"github.com/ista-goma/platform/pkg/apperror"
	"github.com/ista-goma/platform/pkg/response"
)

// Handler exposes notification and announcement endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new notifications handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all notification routes.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/notifications", h.ListNotifications)
	rg.PATCH("/notifications/:id/read", h.MarkRead)
	rg.PATCH("/notifications/read-all", h.MarkAllRead)

	rg.GET("/announcements", h.ListAnnouncements)
	rg.POST("/announcements", h.CreateAnnouncement)
}

func (h *Handler) ListNotifications(c *gin.Context) {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		response.Unauthorized(c, "authentication required"); return
	}
	data, err := h.svc.ListNotifications(c.Request.Context(), claims.Role)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) MarkRead(c *gin.Context) {
	if err := h.svc.MarkRead(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

func (h *Handler) MarkAllRead(c *gin.Context) {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		response.Unauthorized(c, "authentication required"); return
	}
	if err := h.svc.MarkAllRead(c.Request.Context(), claims.Role); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

func (h *Handler) ListAnnouncements(c *gin.Context) {
	data, err := h.svc.ListAnnouncements(c.Request.Context(), c.Query("audience"), c.Query("scope"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateAnnouncement(c *gin.Context) {
	var a domain.Announcement
	if err := c.ShouldBindJSON(&a); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateAnnouncement(c.Request.Context(), &a)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func handleError(c *gin.Context, err error) {
	if ae, ok := err.(*apperror.AppError); ok {
		switch ae.Kind {
		case apperror.KindNotFound:
			response.NotFound(c, ae.Message)
		case apperror.KindBadRequest:
			response.BadRequest(c, ae.Message)
		default:
			response.InternalServerError(c, ae.Message)
		}
		return
	}
	response.InternalServerError(c, "an unexpected error occurred")
}
