package notifications

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ista-goma/platform/internal/domain"
	"github.com/ista-goma/platform/pkg/apperror"
)

// Service contains the business logic for notifications and announcements.
type Service struct {
	repo *Repository
}

// NewService creates a new notifications service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ListNotifications returns in-app notifications for the given role.
func (s *Service) ListNotifications(ctx context.Context, targetRole string) ([]domain.Notification, error) {
	return s.repo.ListNotifications(ctx, targetRole)
}

// Create creates a new notification. Called internally by other services.
func (s *Service) Create(ctx context.Context, n *domain.Notification) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	n.CreatedAt = time.Now()
	return s.repo.CreateNotification(ctx, n)
}

// MarkRead marks a single notification as read.
func (s *Service) MarkRead(ctx context.Context, id string) error {
	return s.repo.MarkRead(ctx, id)
}

// MarkAllRead marks all notifications for a role as read.
func (s *Service) MarkAllRead(ctx context.Context, targetRole string) error {
	return s.repo.MarkAllRead(ctx, targetRole)
}

// ListAnnouncements returns announcements filtered by audience/scope.
func (s *Service) ListAnnouncements(ctx context.Context, audience, scope string) ([]domain.Announcement, error) {
	return s.repo.ListAnnouncements(ctx, audience, scope)
}

// CreateAnnouncement publishes a new announcement.
func (s *Service) CreateAnnouncement(ctx context.Context, a *domain.Announcement) (*domain.Announcement, error) {
	if a.Title == "" || a.Body == "" {
		return nil, apperror.BadRequest("title and body are required")
	}
	a.ID = uuid.New().String()
	if a.Date == "" {
		a.Date = time.Now().Format("2006-01-02")
	}
	if a.Scope == "" {
		a.Scope = domain.AnnouncementScopeGlobal
	}
	if a.Priority == "" {
		a.Priority = domain.AnnouncementPriorityInfo
	}
	if err := s.repo.CreateAnnouncement(ctx, a); err != nil {
		return nil, fmt.Errorf("creating announcement: %w", err)
	}
	return a, nil
}
