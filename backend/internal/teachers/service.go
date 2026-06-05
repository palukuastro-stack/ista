package teachers

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
)

// Service contains the business logic for teacher management.
type Service struct {
	repo *Repository
}

// NewService creates a new teachers service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, facultyID, status string) ([]domain.Teacher, error) {
	return s.repo.List(ctx, facultyID, status)
}

func (s *Service) Get(ctx context.Context, id string) (*domain.Teacher, error) {
	t, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("teacher")
	}
	return t, nil
}

func (s *Service) Titles() []string {
	return domain.TeacherTitles
}

func (s *Service) Create(ctx context.Context, t *domain.Teacher) (*domain.Teacher, error) {
	if t.FirstName == "" || t.LastName == "" || t.FacultyID == "" || t.Title == "" {
		return nil, apperror.BadRequest("firstName, lastName, facultyId, and title are required")
	}
	t.ID = uuid.New().String()
	t.Status = domain.TeacherStatusPending

	matricule, err := s.repo.NextMatricule(ctx)
	if err != nil {
		return nil, fmt.Errorf("generating matricule: %w", err)
	}
	t.Matricule = matricule

	if err := s.repo.Create(ctx, t); err != nil {
		return nil, fmt.Errorf("creating teacher: %w", err)
	}
	return t, nil
}

func (s *Service) Update(ctx context.Context, t *domain.Teacher) (*domain.Teacher, error) {
	if err := s.repo.Update(ctx, t); err != nil {
		return nil, fmt.Errorf("updating teacher: %w", err)
	}
	return t, nil
}
