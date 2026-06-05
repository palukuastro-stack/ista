package academic

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
)

// Service contains the business logic for academic entities.
type Service struct {
	repo *Repository
}

// NewService creates a new academic service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ─── Faculties ────────────────────────────────────────────────────────────────

func (s *Service) ListFaculties(ctx context.Context) ([]domain.Faculty, error) {
	return s.repo.ListFaculties(ctx)
}

func (s *Service) GetFaculty(ctx context.Context, id string) (*domain.Faculty, error) {
	f, err := s.repo.GetFaculty(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("faculty")
	}
	return f, nil
}

func (s *Service) CreateFaculty(ctx context.Context, name, code, dean string) (*domain.Faculty, error) {
	if name == "" || code == "" {
		return nil, apperror.BadRequest("name and code are required")
	}
	f := &domain.Faculty{
		ID:   uuid.New().String(),
		Name: name,
		Code: code,
		Dean: dean,
	}
	if err := s.repo.CreateFaculty(ctx, f); err != nil {
		return nil, fmt.Errorf("creating faculty: %w", err)
	}
	return f, nil
}

func (s *Service) UpdateFaculty(ctx context.Context, id, name, code, dean string) (*domain.Faculty, error) {
	f := &domain.Faculty{ID: id, Name: name, Code: code, Dean: dean}
	if err := s.repo.UpdateFaculty(ctx, f); err != nil {
		return nil, fmt.Errorf("updating faculty: %w", err)
	}
	return f, nil
}

func (s *Service) DeleteFaculty(ctx context.Context, id string) error {
	return s.repo.DeleteFaculty(ctx, id)
}

// ─── Promotions ───────────────────────────────────────────────────────────────

func (s *Service) ListPromotions(ctx context.Context, facultyID string) ([]domain.Promotion, error) {
	return s.repo.ListPromotions(ctx, facultyID)
}

func (s *Service) CreatePromotion(ctx context.Context, name, facultyID, level string) (*domain.Promotion, error) {
	if name == "" || facultyID == "" || level == "" {
		return nil, apperror.BadRequest("name, facultyId, and level are required")
	}
	p := &domain.Promotion{ID: uuid.New().String(), Name: name, FacultyID: facultyID, Level: level}
	if err := s.repo.CreatePromotion(ctx, p); err != nil {
		return nil, fmt.Errorf("creating promotion: %w", err)
	}
	return p, nil
}

func (s *Service) UpdatePromotion(ctx context.Context, id, name, facultyID, level string) (*domain.Promotion, error) {
	p := &domain.Promotion{ID: id, Name: name, FacultyID: facultyID, Level: level}
	if err := s.repo.UpdatePromotion(ctx, p); err != nil {
		return nil, fmt.Errorf("updating promotion: %w", err)
	}
	return p, nil
}

func (s *Service) DeletePromotion(ctx context.Context, id string) error {
	return s.repo.DeletePromotion(ctx, id)
}

// ─── Courses ──────────────────────────────────────────────────────────────────

func (s *Service) ListCourses(ctx context.Context, facultyID, promotionID, teacherID string) ([]domain.Course, error) {
	return s.repo.ListCourses(ctx, facultyID, promotionID, teacherID)
}

func (s *Service) GetCourse(ctx context.Context, id string) (*domain.Course, error) {
	c, err := s.repo.GetCourse(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("course")
	}
	return c, nil
}

func (s *Service) CreateCourse(ctx context.Context, code, name, facultyID, promotionID, teacherID, roomID string, credits, hours int) (*domain.Course, error) {
	if name == "" || code == "" || facultyID == "" || promotionID == "" {
		return nil, apperror.BadRequest("code, name, facultyId, and promotionId are required")
	}
	c := &domain.Course{
		ID:          uuid.New().String(),
		Code:        code,
		Name:        name,
		FacultyID:   facultyID,
		PromotionID: promotionID,
		TeacherID:   teacherID,
		RoomID:      roomID,
		Credits:     credits,
		Hours:       hours,
	}
	if err := s.repo.CreateCourse(ctx, c); err != nil {
		return nil, fmt.Errorf("creating course: %w", err)
	}
	return c, nil
}

func (s *Service) UpdateCourse(ctx context.Context, c *domain.Course) (*domain.Course, error) {
	if err := s.repo.UpdateCourse(ctx, c); err != nil {
		return nil, fmt.Errorf("updating course: %w", err)
	}
	return c, nil
}

func (s *Service) AssignTeacher(ctx context.Context, courseID, teacherID string) error {
	if courseID == "" || teacherID == "" {
		return apperror.BadRequest("courseId and teacherId are required")
	}
	return s.repo.AssignTeacher(ctx, courseID, teacherID)
}

func (s *Service) DeleteCourse(ctx context.Context, id string) error {
	return s.repo.DeleteCourse(ctx, id)
}

// ─── Schedules ────────────────────────────────────────────────────────────────

func (s *Service) ListSchedules(ctx context.Context, promotionID, teacherID string) ([]domain.ScheduleSlot, error) {
	return s.repo.ListSchedules(ctx, promotionID, teacherID)
}

func (s *Service) CreateScheduleSlot(ctx context.Context, slot *domain.ScheduleSlot) (*domain.ScheduleSlot, error) {
	conflict, err := s.repo.CheckConflict(ctx, slot.Room, string(slot.Day), slot.Start, slot.End, "")
	if err != nil {
		return nil, fmt.Errorf("checking conflict: %w", err)
	}
	if conflict != nil {
		return nil, apperror.Conflict(fmt.Sprintf(
			"La salle \"%s\" est déjà occupée le %s de %s à %s",
			slot.Room, slot.Day, conflict.Start, conflict.End,
		))
	}
	slot.ID = uuid.New().String()
	if err := s.repo.CreateScheduleSlot(ctx, slot); err != nil {
		return nil, fmt.Errorf("creating schedule slot: %w", err)
	}
	return slot, nil
}

func (s *Service) DeleteScheduleSlot(ctx context.Context, id string) error {
	return s.repo.DeleteScheduleSlot(ctx, id)
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

func (s *Service) ListRooms(ctx context.Context) ([]domain.Room, error) {
	return s.repo.ListRooms(ctx)
}

func (s *Service) CreateRoom(ctx context.Context, name string, capacity int, description string, category domain.RoomCategory) (*domain.Room, error) {
	room := &domain.Room{
		ID:          uuid.New().String(),
		Name:        name,
		Capacity:    capacity,
		Description: description,
		Category:    category,
	}
	if err := s.repo.CreateRoom(ctx, room); err != nil {
		return nil, fmt.Errorf("creating room: %w", err)
	}
	return room, nil
}

func (s *Service) DeleteRoom(ctx context.Context, id string) error {
	return s.repo.DeleteRoom(ctx, id)
}
