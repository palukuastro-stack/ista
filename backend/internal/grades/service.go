package grades

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/internal/notifications"
	"github.com/ista-goma/platform/pkg/apperror"
)

// Service contains the business logic for grades, appeals, assignments, submissions and resources.
type Service struct {
	repo      *Repository
	notifSvc  *notifications.Service
}

// NewService creates a new grades service.
func NewService(repo *Repository, notifSvc *notifications.Service) *Service {
	return &Service{repo: repo, notifSvc: notifSvc}
}

// ─── Grades ───────────────────────────────────────────────────────────────────

func (s *Service) ListGrades(ctx context.Context, studentID, courseID, promotionID string) ([]domain.Grade, error) {
	return s.repo.ListGrades(ctx, studentID, courseID, promotionID)
}

func (s *Service) UpsertGrade(ctx context.Context, g *domain.Grade) (*domain.Grade, error) {
	if g.StudentID == "" || g.CourseID == "" || g.Score < 0 || g.Score > 20 {
		return nil, apperror.BadRequest("studentId, courseId, and a score between 0-20 are required")
	}
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	if g.Status == "" {
		g.Status = domain.GradeStatusPending
	}
	result, err := s.repo.UpsertGrade(ctx, g)
	if err != nil {
		return nil, fmt.Errorf("upserting grade: %w", err)
	}

	// Emit notification to secretariat_general
	_ = s.notifSvc.Create(ctx, &domain.Notification{
		ID:         uuid.New().String(),
		Type:       domain.NotifGradeModified,
		Message:    fmt.Sprintf("Note mise à jour — étudiant %s · cours %s : %.1f/20", g.StudentID, g.CourseID, g.Score),
		TargetRole: domain.RoleSecretariatGeneral,
		Read:       false,
		Metadata:   map[string]string{"gradeId": result.ID, "studentId": g.StudentID, "courseId": g.CourseID},
	})

	return result, nil
}

func (s *Service) UpdateGradeStatus(ctx context.Context, id, status string) error {
	validStatuses := map[string]domain.GradeStatus{
		"pending":   domain.GradeStatusPending,
		"validated": domain.GradeStatusValidated,
		"rejected":  domain.GradeStatusRejected,
	}
	st, ok := validStatuses[status]
	if !ok {
		return apperror.BadRequest("invalid status")
	}
	return s.repo.UpdateGradeStatus(ctx, id, st)
}

// ─── Appeals ──────────────────────────────────────────────────────────────────

func (s *Service) ListAppeals(ctx context.Context, studentID, status string) ([]domain.GradeAppeal, error) {
	return s.repo.ListAppeals(ctx, studentID, status)
}

func (s *Service) CreateAppeal(ctx context.Context, a *domain.GradeAppeal) (*domain.GradeAppeal, error) {
	if a.StudentID == "" || a.CourseID == "" || a.GradeID == "" || a.Reason == "" {
		return nil, apperror.BadRequest("studentId, courseId, gradeId, and reason are required")
	}
	a.ID = uuid.New().String()
	a.Status = domain.AppealStatusPending
	if err := s.repo.CreateAppeal(ctx, a); err != nil {
		return nil, fmt.Errorf("creating appeal: %w", err)
	}

	_ = s.notifSvc.Create(ctx, &domain.Notification{
		ID:         uuid.New().String(),
		Type:       domain.NotifNewAppeal,
		Message:    fmt.Sprintf("Nouveau recours soumis — étudiant %s pour le cours %s", a.StudentID, a.CourseID),
		TargetRole: domain.RoleSecretariatGeneral,
		Read:       false,
		Metadata:   map[string]string{"appealId": a.ID, "gradeId": a.GradeID},
	})

	return a, nil
}

func (s *Service) ResolveAppeal(ctx context.Context, id, status, responseText string) error {
	if status != "approved" && status != "rejected" {
		return apperror.BadRequest("status must be 'approved' or 'rejected'")
	}
	return s.repo.ResolveAppeal(ctx, id, status, responseText)
}

// ─── Assignments ──────────────────────────────────────────────────────────────

func (s *Service) ListAssignments(ctx context.Context, courseID, teacherID string) ([]domain.Assignment, error) {
	return s.repo.ListAssignments(ctx, courseID, teacherID)
}

func (s *Service) CreateAssignment(ctx context.Context, a *domain.Assignment) (*domain.Assignment, error) {
	if a.CourseID == "" || a.TeacherID == "" || a.Title == "" || a.DueDate == "" {
		return nil, apperror.BadRequest("courseId, teacherId, title, and dueDate are required")
	}
	a.ID = uuid.New().String()
	if err := s.repo.CreateAssignment(ctx, a); err != nil {
		return nil, fmt.Errorf("creating assignment: %w", err)
	}
	return a, nil
}

func (s *Service) DeleteAssignment(ctx context.Context, id string) error {
	return s.repo.DeleteAssignment(ctx, id)
}

// ─── Submissions ──────────────────────────────────────────────────────────────

func (s *Service) ListSubmissions(ctx context.Context, assignmentID, studentID string) ([]domain.Submission, error) {
	return s.repo.ListSubmissions(ctx, assignmentID, studentID)
}

func (s *Service) CreateSubmission(ctx context.Context, sub *domain.Submission) (*domain.Submission, error) {
	if sub.AssignmentID == "" || sub.StudentID == "" || sub.Content == "" {
		return nil, apperror.BadRequest("assignmentId, studentId, and content are required")
	}
	sub.ID = uuid.New().String()
	if err := s.repo.CreateSubmission(ctx, sub); err != nil {
		return nil, fmt.Errorf("creating submission: %w", err)
	}
	return sub, nil
}

func (s *Service) GradeSubmission(ctx context.Context, id string, grade float64, feedback string) error {
	if grade < 0 || grade > 20 {
		return apperror.BadRequest("grade must be between 0 and 20")
	}
	return s.repo.GradeSubmission(ctx, id, grade, feedback)
}

// ─── Course Resources ─────────────────────────────────────────────────────────

func (s *Service) ListResources(ctx context.Context, courseID, teacherID string) ([]domain.CourseResource, error) {
	return s.repo.ListResources(ctx, courseID, teacherID)
}

func (s *Service) CreateResource(ctx context.Context, res *domain.CourseResource) (*domain.CourseResource, error) {
	if res.CourseID == "" || res.TeacherID == "" || res.Title == "" || res.URL == "" {
		return nil, apperror.BadRequest("courseId, teacherId, title, and url are required")
	}
	res.ID = uuid.New().String()
	if err := s.repo.CreateResource(ctx, res); err != nil {
		return nil, fmt.Errorf("creating resource: %w", err)
	}
	return res, nil
}

func (s *Service) DeleteResource(ctx context.Context, id string) error {
	return s.repo.DeleteResource(ctx, id)
}
