package academic

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
	"github.com/ista-goma/platform/pkg/response"
)

// Handler exposes academic endpoints through Gin.
type Handler struct {
	svc *Service
}

// NewHandler creates a new academic handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all academic routes.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	// Faculties
	rg.GET("/faculties", h.ListFaculties)
	rg.GET("/faculties/:id", h.GetFaculty)
	rg.POST("/faculties", h.CreateFaculty)
	rg.PUT("/faculties/:id", h.UpdateFaculty)
	rg.DELETE("/faculties/:id", h.DeleteFaculty)

	// Promotions
	rg.GET("/promotions", h.ListPromotions)
	rg.POST("/promotions", h.CreatePromotion)
	rg.PUT("/promotions/:id", h.UpdatePromotion)
	rg.DELETE("/promotions/:id", h.DeletePromotion)

	// Courses
	rg.GET("/courses", h.ListCourses)
	rg.GET("/courses/:id", h.GetCourse)
	rg.POST("/courses", h.CreateCourse)
	rg.PUT("/courses/:id", h.UpdateCourse)
	rg.PATCH("/courses/:id/teacher", h.AssignTeacher)
	rg.DELETE("/courses/:id", h.DeleteCourse)

	// Schedules
	rg.GET("/schedules", h.ListSchedules)
	rg.POST("/schedules", h.CreateScheduleSlot)
	rg.DELETE("/schedules/:id", h.DeleteScheduleSlot)

	// Rooms
	rg.GET("/rooms", h.ListRooms)
	rg.POST("/rooms", h.CreateRoom)
	rg.DELETE("/rooms/:id", h.DeleteRoom)
}

// ─── Faculties ────────────────────────────────────────────────────────────────

func (h *Handler) ListFaculties(c *gin.Context) {
	data, err := h.svc.ListFaculties(c.Request.Context())
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) GetFaculty(c *gin.Context) {
	f, err := h.svc.GetFaculty(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, f)
}

func (h *Handler) CreateFaculty(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
		Code string `json:"code"`
		Dean string `json:"dean"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	f, err := h.svc.CreateFaculty(c.Request.Context(), req.Name, req.Code, req.Dean)
	if err != nil {
		handleError(c, err); return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": f})
}

func (h *Handler) UpdateFaculty(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
		Code string `json:"code"`
		Dean string `json:"dean"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	f, err := h.svc.UpdateFaculty(c.Request.Context(), c.Param("id"), req.Name, req.Code, req.Dean)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, f)
}

func (h *Handler) DeleteFaculty(c *gin.Context) {
	if err := h.svc.DeleteFaculty(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

// ─── Promotions ───────────────────────────────────────────────────────────────

func (h *Handler) ListPromotions(c *gin.Context) {
	data, err := h.svc.ListPromotions(c.Request.Context(), c.Query("facultyId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreatePromotion(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		FacultyID string `json:"facultyId"`
		Level     string `json:"level"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	p, err := h.svc.CreatePromotion(c.Request.Context(), req.Name, req.FacultyID, req.Level)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, p)
}

func (h *Handler) UpdatePromotion(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		FacultyID string `json:"facultyId"`
		Level     string `json:"level"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	p, err := h.svc.UpdatePromotion(c.Request.Context(), c.Param("id"), req.Name, req.FacultyID, req.Level)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, p)
}

func (h *Handler) DeletePromotion(c *gin.Context) {
	if err := h.svc.DeletePromotion(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

// ─── Courses ──────────────────────────────────────────────────────────────────

func (h *Handler) ListCourses(c *gin.Context) {
	data, err := h.svc.ListCourses(c.Request.Context(), c.Query("facultyId"), c.Query("promotionId"), c.Query("teacherId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) GetCourse(c *gin.Context) {
	course, err := h.svc.GetCourse(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, course)
}

func (h *Handler) CreateCourse(c *gin.Context) {
	var req struct {
		Code        string `json:"code"`
		Name        string `json:"name"`
		FacultyID   string `json:"facultyId"`
		PromotionID string `json:"promotionId"`
		TeacherID   string `json:"teacherId"`
		RoomID      string `json:"roomId"`
		Credits     int    `json:"credits"`
		Hours       int    `json:"hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	course, err := h.svc.CreateCourse(c.Request.Context(), req.Code, req.Name, req.FacultyID, req.PromotionID, req.TeacherID, req.RoomID, req.Credits, req.Hours)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, course)
}

func (h *Handler) UpdateCourse(c *gin.Context) {
	var req domain.Course
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	req.ID = c.Param("id")
	course, err := h.svc.UpdateCourse(c.Request.Context(), &req)
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, course)
}

func (h *Handler) AssignTeacher(c *gin.Context) {
	var req struct{ TeacherID string `json:"teacherId"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "teacherId is required"); return
	}
	if err := h.svc.AssignTeacher(c.Request.Context(), c.Param("id"), req.TeacherID); err != nil {
		handleError(c, err); return
	}
	response.OKMessage(c, "teacher assigned", nil)
}

func (h *Handler) DeleteCourse(c *gin.Context) {
	if err := h.svc.DeleteCourse(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

// ─── Schedules ────────────────────────────────────────────────────────────────

func (h *Handler) ListSchedules(c *gin.Context) {
	data, err := h.svc.ListSchedules(c.Request.Context(), c.Query("promotionId"), c.Query("teacherId"))
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateScheduleSlot(c *gin.Context) {
	var slot domain.ScheduleSlot
	if err := c.ShouldBindJSON(&slot); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	created, err := h.svc.CreateScheduleSlot(c.Request.Context(), &slot)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, created)
}

func (h *Handler) DeleteScheduleSlot(c *gin.Context) {
	if err := h.svc.DeleteScheduleSlot(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

func (h *Handler) ListRooms(c *gin.Context) {
	data, err := h.svc.ListRooms(c.Request.Context())
	if err != nil {
		handleError(c, err); return
	}
	response.OK(c, data)
}

func (h *Handler) CreateRoom(c *gin.Context) {
	var req struct {
		Name        string               `json:"name"`
		Capacity    int                  `json:"capacity"`
		Description string               `json:"description"`
		Category    domain.RoomCategory  `json:"category"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body"); return
	}
	room, err := h.svc.CreateRoom(c.Request.Context(), req.Name, req.Capacity, req.Description, req.Category)
	if err != nil {
		handleError(c, err); return
	}
	response.Created(c, room)
}

func (h *Handler) DeleteRoom(c *gin.Context) {
	if err := h.svc.DeleteRoom(c.Request.Context(), c.Param("id")); err != nil {
		handleError(c, err); return
	}
	response.NoContent(c)
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
		default:
			response.InternalServerError(c, ae.Message)
		}
		return
	}
	response.InternalServerError(c, "an unexpected error occurred")
}
