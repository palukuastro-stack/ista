package grades

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
	"github.com/ista-goma/platform/pkg/response"
)

// Handler exposes grade, appeal, assignment, submission, and resource endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new grades handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all grade-related routes.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	// Grades
	rg.GET("/grades", h.ListGrades)
	rg.POST("/grades", h.UpsertGrade)
	rg.PATCH("/grades/:id/status", h.UpdateGradeStatus)

	// Appeals
	rg.GET("/appeals", h.ListAppeals)
	rg.POST("/appeals", h.CreateAppeal)
	rg.PATCH("/appeals/:id/resolve", h.ResolveAppeal)

	// Assignments
	rg.GET("/assignments", h.ListAssignments)
	rg.POST("/assignments", h.CreateAssignment)
	rg.DELETE("/assignments/:id", h.DeleteAssignment)

	// Submissions
	rg.GET("/submissions", h.ListSubmissions)
	rg.POST("/submissions", h.CreateSubmission)
	rg.PATCH("/submissions/:id/grade", h.GradeSubmission)

	// Resources
	rg.GET("/resources", h.ListResources)
	rg.POST("/resources", h.CreateResource)
	rg.DELETE("/resources/:id", h.DeleteResource)
}

// ─── Grades ───────────────────────────────────────────────────────────────────

func (h *Handler) ListGrades(c *gin.Context) {
	data, err := h.svc.ListGrades(c.Request.Context(), c.Query("studentId"), c.Query("courseId"), c.Query("promotionId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) UpsertGrade(c *gin.Context) {
	var g domain.Grade
	if err := c.ShouldBindJSON(&g); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	result, err := h.svc.UpsertGrade(c.Request.Context(), &g)
	if err != nil {
		handleError(c, err); return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": result})
}

func (h *Handler) UpdateGradeStatus(c *gin.Context) {
	var req struct{ Status string `json:"status"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "status is required"); return
	}
	if err := h.svc.UpdateGradeStatus(c.Request.Context(), c.Param("id"), req.Status); err != nil {
		handleError(c, err); return
	}
	response.OKMessage(c, "grade status updated", nil)
}

// ─── Appeals ──────────────────────────────────────────────────────────────────

func (h *Handler) ListAppeals(c *gin.Context) {
	data, err := h.svc.ListAppeals(c.Request.Context(), c.Query("studentId"), c.Query("status"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateAppeal(c *gin.Context) {
	var a domain.GradeAppeal
	if err := c.ShouldBindJSON(&a); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateAppeal(c.Request.Context(), &a)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func (h *Handler) ResolveAppeal(c *gin.Context) {
	var req struct {
		Status   string `json:"status"`
		Response string `json:"response"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "status and response are required"); return
	}
	if err := h.svc.ResolveAppeal(c.Request.Context(), c.Param("id"), req.Status, req.Response); err != nil {
		handleError(c, err); return
	}
	response.OKMessage(c, "appeal resolved", nil)
}

// ─── Assignments ──────────────────────────────────────────────────────────────

func (h *Handler) ListAssignments(c *gin.Context) {
	data, err := h.svc.ListAssignments(c.Request.Context(), c.Query("courseId"), c.Query("teacherId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateAssignment(c *gin.Context) {
	var a domain.Assignment
	if err := c.ShouldBindJSON(&a); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateAssignment(c.Request.Context(), &a)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func (h *Handler) DeleteAssignment(c *gin.Context) {
	if err := h.svc.DeleteAssignment(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

// ─── Submissions ──────────────────────────────────────────────────────────────

func (h *Handler) ListSubmissions(c *gin.Context) {
	data, err := h.svc.ListSubmissions(c.Request.Context(), c.Query("assignmentId"), c.Query("studentId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateSubmission(c *gin.Context) {
	var s domain.Submission
	if err := c.ShouldBindJSON(&s); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateSubmission(c.Request.Context(), &s)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func (h *Handler) GradeSubmission(c *gin.Context) {
	var req struct {
		Grade    string `json:"grade"`
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "grade and feedback are required"); return
	}
	g, err := strconv.ParseFloat(req.Grade, 64)
	if err != nil {
		response.BadRequest(c, "grade must be a number"); return
	}
	if err := h.svc.GradeSubmission(c.Request.Context(), c.Param("id"), g, req.Feedback); err != nil {
		handleError(c, err); return
	}
	response.OKMessage(c, "submission graded", nil)
}

// ─── Resources ────────────────────────────────────────────────────────────────

func (h *Handler) ListResources(c *gin.Context) {
	data, err := h.svc.ListResources(c.Request.Context(), c.Query("courseId"), c.Query("teacherId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateResource(c *gin.Context) {
	var res domain.CourseResource
	if err := c.ShouldBindJSON(&res); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateResource(c.Request.Context(), &res)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func (h *Handler) DeleteResource(c *gin.Context) {
	if err := h.svc.DeleteResource(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
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
