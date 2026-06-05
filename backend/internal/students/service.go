package students

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
)

// Service contains the business logic for student management.
type Service struct {
	repo *Repository
}

// NewService creates a new students service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, facultyID, promotionID, status string) ([]domain.Student, error) {
	return s.repo.List(ctx, facultyID, promotionID, status)
}

func (s *Service) Get(ctx context.Context, id string) (*domain.Student, error) {
	st, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("student")
	}
	return st, nil
}

func (s *Service) Create(ctx context.Context, st *domain.Student) (*domain.Student, error) {
	if st.FirstName == "" || st.LastName == "" || st.FacultyID == "" || st.PromotionID == "" {
		return nil, apperror.BadRequest("firstName, lastName, facultyId, and promotionId are required")
	}
	st.ID = uuid.New().String()
	st.Status = domain.StudentStatusPending
	st.EnrollmentDate = time.Now().Format("2006-01-02")
	st.Average = 0

	year := time.Now().Year()
	matricule, err := s.repo.NextMatricule(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("generating matricule: %w", err)
	}
	st.Matricule = matricule

	if err := s.repo.Create(ctx, st); err != nil {
		return nil, fmt.Errorf("creating student: %w", err)
	}
	return st, nil
}

func (s *Service) Update(ctx context.Context, st *domain.Student) (*domain.Student, error) {
	if err := s.repo.Update(ctx, st); err != nil {
		return nil, fmt.Errorf("updating student: %w", err)
	}
	return st, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id, status string) error {
	validStatuses := map[string]domain.StudentStatus{
		"active":    domain.StudentStatusActive,
		"pending":   domain.StudentStatusPending,
		"suspended": domain.StudentStatusSuspended,
		"excluded":  domain.StudentStatusExcluded,
	}
	st, ok := validStatuses[status]
	if !ok {
		return apperror.BadRequest("invalid status value")
	}
	return s.repo.UpdateStatus(ctx, id, st)
}
