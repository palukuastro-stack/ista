// Package students manages student profiles and enrollment.
package students

import (
	"context"
	"fmt"

	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for students.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new students repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, facultyID, promotionID, status string) ([]domain.Student, error) {
	q := `SELECT id, matricule, first_name, last_name, middle_name, birth_date,
	             email, phone, gender, promotion_id, faculty_id, status,
	             enrollment_date, average, created_at, updated_at
	        FROM students WHERE 1=1`
	args := []any{}
	i := 1
	if facultyID != "" {
		q += fmt.Sprintf(` AND faculty_id = $%d`, i); args = append(args, facultyID); i++
	}
	if promotionID != "" {
		q += fmt.Sprintf(` AND promotion_id = $%d`, i); args = append(args, promotionID); i++
	}
	if status != "" {
		q += fmt.Sprintf(` AND status = $%d`, i); args = append(args, status); i++
	}
	q += ` ORDER BY last_name, first_name`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing students: %w", err)
	}
	defer rows.Close()

	var students []domain.Student
	for rows.Next() {
		var s domain.Student
		if err := rows.Scan(&s.ID, &s.Matricule, &s.FirstName, &s.LastName, &s.MiddleName,
			&s.BirthDate, &s.Email, &s.Phone, &s.Gender, &s.PromotionID, &s.FacultyID,
			&s.Status, &s.EnrollmentDate, &s.Average, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning student: %w", err)
		}
		students = append(students, s)
	}
	return students, nil
}

func (r *Repository) Get(ctx context.Context, id string) (*domain.Student, error) {
	const q = `SELECT id, matricule, first_name, last_name, middle_name, birth_date,
	                  email, phone, gender, promotion_id, faculty_id, status,
	                  enrollment_date, average, created_at, updated_at
	             FROM students WHERE id = $1`
	var s domain.Student
	err := r.db.QueryRow(ctx, q, id).Scan(&s.ID, &s.Matricule, &s.FirstName, &s.LastName, &s.MiddleName,
		&s.BirthDate, &s.Email, &s.Phone, &s.Gender, &s.PromotionID, &s.FacultyID,
		&s.Status, &s.EnrollmentDate, &s.Average, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting student: %w", err)
	}
	return &s, nil
}

func (r *Repository) Create(ctx context.Context, s *domain.Student) error {
	const q = `INSERT INTO students
	           (id, matricule, first_name, last_name, middle_name, birth_date,
	            email, phone, gender, promotion_id, faculty_id, status, enrollment_date, average)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
	_, err := r.db.Exec(ctx, q,
		s.ID, s.Matricule, s.FirstName, s.LastName, s.MiddleName, s.BirthDate,
		s.Email, s.Phone, s.Gender, s.PromotionID, s.FacultyID,
		s.Status, s.EnrollmentDate, s.Average)
	return err
}

func (r *Repository) Update(ctx context.Context, s *domain.Student) error {
	const q = `UPDATE students
	              SET first_name=$2, last_name=$3, middle_name=$4, birth_date=$5,
	                  email=$6, phone=$7, gender=$8, promotion_id=$9, faculty_id=$10,
	                  status=$11, enrollment_date=$12, updated_at=NOW()
	            WHERE id=$1`
	_, err := r.db.Exec(ctx, q,
		s.ID, s.FirstName, s.LastName, s.MiddleName, s.BirthDate,
		s.Email, s.Phone, s.Gender, s.PromotionID, s.FacultyID,
		s.Status, s.EnrollmentDate)
	return err
}

func (r *Repository) UpdateStatus(ctx context.Context, id string, status domain.StudentStatus) error {
	const q = `UPDATE students SET status=$2, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, id, status)
	return err
}

// NextMatricule generates the next available student matricule.
func (r *Repository) NextMatricule(ctx context.Context, year int) (string, error) {
	const q = `SELECT COUNT(*) + 1 FROM students WHERE matricule LIKE $1`
	pattern := fmt.Sprintf("ISTA-%d-%%", year)
	var next int
	err := r.db.QueryRow(ctx, q, pattern).Scan(&next)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ISTA-%d-%03d", year, next), nil
}
