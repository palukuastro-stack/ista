// Package notifications manages in-app notifications and announcements.
package notifications

import (
	"context"
	"fmt"

	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles database operations for notifications and announcements.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new notifications repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ─── Notifications ────────────────────────────────────────────────────────────

func (r *Repository) ListNotifications(ctx context.Context, targetRole string) ([]domain.Notification, error) {
	const q = `SELECT id, type, message, target_role, read, metadata, created_at
	             FROM notifications
	            WHERE target_role = $1
	            ORDER BY created_at DESC
	            LIMIT 100`
	rows, err := r.db.Query(ctx, q, targetRole)
	if err != nil {
		return nil, fmt.Errorf("listing notifications: %w", err)
	}
	defer rows.Close()

	var notifs []domain.Notification
	for rows.Next() {
		var n domain.Notification
		if err := rows.Scan(&n.ID, &n.Type, &n.Message, &n.TargetRole, &n.Read, &n.Metadata, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifs = append(notifs, n)
	}
	return notifs, nil
}

func (r *Repository) CreateNotification(ctx context.Context, n *domain.Notification) error {
	const q = `INSERT INTO notifications (id, type, message, target_role, read, metadata)
	           VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := r.db.Exec(ctx, q, n.ID, n.Type, n.Message, n.TargetRole, n.Read, n.Metadata)
	return err
}

func (r *Repository) MarkRead(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `UPDATE notifications SET read=true WHERE id=$1`, id)
	return err
}

func (r *Repository) MarkAllRead(ctx context.Context, targetRole string) error {
	_, err := r.db.Exec(ctx, `UPDATE notifications SET read=true WHERE target_role=$1`, targetRole)
	return err
}

// ─── Announcements ────────────────────────────────────────────────────────────

func (r *Repository) ListAnnouncements(ctx context.Context, audience, scope string) ([]domain.Announcement, error) {
	q := `SELECT id, title, body, author, date, audience, priority, scope,
	             COALESCE(target_id,''), created_at
	        FROM announcements WHERE 1=1`
	args := []any{}
	i := 1
	if audience != "" {
		q += fmt.Sprintf(` AND (audience = 'all' OR audience = $%d)`, i)
		args = append(args, audience); i++
	}
	if scope != "" {
		q += fmt.Sprintf(` AND scope = $%d`, i); args = append(args, scope); i++
	}
	q += ` ORDER BY date DESC, created_at DESC LIMIT 50`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing announcements: %w", err)
	}
	defer rows.Close()

	var announcements []domain.Announcement
	for rows.Next() {
		var a domain.Announcement
		if err := rows.Scan(&a.ID, &a.Title, &a.Body, &a.Author, &a.Date, &a.Audience,
			&a.Priority, &a.Scope, &a.TargetID, &a.CreatedAt); err != nil {
			return nil, err
		}
		announcements = append(announcements, a)
	}
	return announcements, nil
}

func (r *Repository) CreateAnnouncement(ctx context.Context, a *domain.Announcement) error {
	const q = `INSERT INTO announcements (id, title, body, author, date, audience, priority, scope, target_id)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,''))`
	_, err := r.db.Exec(ctx, q,
		a.ID, a.Title, a.Body, a.Author, a.Date, a.Audience, a.Priority, a.Scope, a.TargetID)
	return err
}
