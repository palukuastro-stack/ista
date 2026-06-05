// Package teachers manages teaching staff profiles.
package teachers

import (
	"context"
	"fmt"

	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for teachers.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new teachers repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, facultyID, status string) ([]domain.Teacher, error) {
	q := `SELECT id, matricule, first_name, last_name, middle_name, email, phone,
	             faculty_id, title, status, COALESCE(description,''), created_at, updated_at
	        FROM teachers WHERE 1=1`
	args := []any{}
	i := 1
	if facultyID != "" {
		q += fmt.Sprintf(` AND faculty_id = $%d`, i); args = append(args, facultyID); i++
	}
	if status != "" {
		q += fmt.Sprintf(` AND status = $%d`, i); args = append(args, status); i++
	}
	q += ` ORDER BY last_name, first_name`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing teachers: %w", err)
	}
	defer rows.Close()

	var teachers []domain.Teacher
	for rows.Next() {
		var t domain.Teacher
		if err := rows.Scan(&t.ID, &t.Matricule, &t.FirstName, &t.LastName, &t.MiddleName,
			&t.Email, &t.Phone, &t.FacultyID, &t.Title, &t.Status, &t.Description,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning teacher: %w", err)
		}
		// Load associated course IDs
		courseIDs, err := r.listCourseIDs(ctx, t.ID)
		if err != nil {
			return nil, err
		}
		t.CourseIDs = courseIDs
		teachers = append(teachers, t)
	}
	return teachers, nil
}

func (r *Repository) Get(ctx context.Context, id string) (*domain.Teacher, error) {
	const q = `SELECT id, matricule, first_name, last_name, middle_name, email, phone,
	                  faculty_id, title, status, COALESCE(description,''), created_at, updated_at
	             FROM teachers WHERE id = $1`
	var t domain.Teacher
	err := r.db.QueryRow(ctx, q, id).Scan(&t.ID, &t.Matricule, &t.FirstName, &t.LastName, &t.MiddleName,
		&t.Email, &t.Phone, &t.FacultyID, &t.Title, &t.Status, &t.Description,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting teacher: %w", err)
	}
	courseIDs, err := r.listCourseIDs(ctx, t.ID)
	if err != nil {
		return nil, err
	}
	t.CourseIDs = courseIDs
	return &t, nil
}

func (r *Repository) listCourseIDs(ctx context.Context, teacherID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `SELECT id FROM courses WHERE teacher_id = $1`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (r *Repository) Create(ctx context.Context, t *domain.Teacher) error {
	const q = `INSERT INTO teachers
	           (id, matricule, first_name, last_name, middle_name, email, phone, faculty_id, title, status, description)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
	_, err := r.db.Exec(ctx, q,
		t.ID, t.Matricule, t.FirstName, t.LastName, t.MiddleName,
		t.Email, t.Phone, t.FacultyID, t.Title, t.Status, t.Description)
	return err
}

func (r *Repository) Update(ctx context.Context, t *domain.Teacher) error {
	const q = `UPDATE teachers
	              SET first_name=$2, last_name=$3, middle_name=$4, email=$5, phone=$6,
	                  faculty_id=$7, title=$8, status=$9, description=$10, updated_at=NOW()
	            WHERE id=$1`
	_, err := r.db.Exec(ctx, q,
		t.ID, t.FirstName, t.LastName, t.MiddleName, t.Email, t.Phone,
		t.FacultyID, t.Title, t.Status, t.Description)
	return err
}

// NextMatricule generates the next ENS-XXX matricule.
func (r *Repository) NextMatricule(ctx context.Context) (string, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) + 1 FROM teachers`).Scan(&count)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ENS-%03d", count), nil
}
