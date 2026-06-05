package students

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
	"github.com/ista-goma/platform/pkg/response"
)

// Handler exposes student endpoints through Gin.
type Handler struct {
	svc *Service
}

// NewHandler creates a new students handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all student routes.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/students", h.List)
	rg.GET("/students/:id", h.Get)
	rg.POST("/students", h.Create)
	rg.PUT("/students/:id", h.Update)
	rg.PATCH("/students/:id/status", h.UpdateStatus)
}

func (h *Handler) List(c *gin.Context) {
	data, err := h.svc.List(c.Request.Context(), c.Query("facultyId"), c.Query("promotionId"), c.Query("status"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) Get(c *gin.Context) {
	st, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, st)
}

func (h *Handler) Create(c *gin.Context) {
	var st domain.Student
	if err := c.ShouldBindJSON(&st); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.Create(c.Request.Context(), &st)
	if err != nil {
		handleError(c, err); return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *Handler) Update(c *gin.Context) {
	var st domain.Student
	if err := c.ShouldBindJSON(&st); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	st.ID = c.Param("id")
	updated, err := h.svc.Update(c.Request.Context(), &st)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, updated)
}

func (h *Handler) UpdateStatus(c *gin.Context) {
	var req struct{ Status string `json:"status"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "status is required"); return
	}
	if err := h.svc.UpdateStatus(c.Request.Context(), c.Param("id"), req.Status); err != nil {
		handleError(c, err); return
	}
	response.OKMessage(c, "status updated", nil)
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
