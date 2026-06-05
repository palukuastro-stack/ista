package teachers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
	"github.com/ista-goma/platform/pkg/response"
)

// Handler exposes teacher endpoints through Gin.
type Handler struct {
	svc *Service
}

// NewHandler creates a new teachers handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all teacher routes.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/teachers", h.List)
	rg.GET("/teachers/titles", h.Titles)
	rg.GET("/teachers/:id", h.Get)
	rg.POST("/teachers", h.Create)
	rg.PUT("/teachers/:id", h.Update)
}

func (h *Handler) List(c *gin.Context) {
	data, err := h.svc.List(c.Request.Context(), c.Query("facultyId"), c.Query("status"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) Titles(c *gin.Context) {
	response.OK(c, h.svc.Titles())
}

func (h *Handler) Get(c *gin.Context) {
	t, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, t)
}

func (h *Handler) Create(c *gin.Context) {
	var t domain.Teacher
	if err := c.ShouldBindJSON(&t); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.Create(c.Request.Context(), &t)
	if err != nil {
		handleError(c, err); return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *Handler) Update(c *gin.Context) {
	var t domain.Teacher
	if err := c.ShouldBindJSON(&t); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	t.ID = c.Param("id")
	updated, err := h.svc.Update(c.Request.Context(), &t)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, updated)
}

func handleError(c *gin.Context, err error) {
	if ae, ok := err.(*apperror.AppError); ok {
		switch ae.Kind {
		case apperror.KindNotFound:
			response.NotFound(c, ae.Message)
		case apperror.KindConflict:
			response.Conflict(c, ae.Message)
		case apperror.KindBadRequest:
			response.BadRequest(c, ae.Message)
		default:
			response.InternalServerError(c, ae.Message)
		}
		return
	}
	response.InternalServerError(c, "an unexpected error occurred")
}
