// Package grades manages academic grades, submissions, resources, and appeals.
package grades

import (
	"context"
	"fmt"

	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for grades, appeals, assignments, submissions and resources.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new grades repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ─── Grades ───────────────────────────────────────────────────────────────────

func (r *Repository) ListGrades(ctx context.Context, studentID, courseID, promotionID string) ([]domain.Grade, error) {
	q := `SELECT id, student_id, course_id, promotion_id, score, status, session,
	             type, COALESCE(assessment_title,''), created_at, updated_at
	        FROM grades WHERE 1=1`
	args := []any{}
	i := 1
	if studentID != "" {
		q += fmt.Sprintf(` AND student_id = $%d`, i); args = append(args, studentID); i++
	}
	if courseID != "" {
		q += fmt.Sprintf(` AND course_id = $%d`, i); args = append(args, courseID); i++
	}
	if promotionID != "" {
		q += fmt.Sprintf(` AND promotion_id = $%d`, i); args = append(args, promotionID); i++
	}
	q += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing grades: %w", err)
	}
	defer rows.Close()

	var grades []domain.Grade
	for rows.Next() {
		var g domain.Grade
		if err := rows.Scan(&g.ID, &g.StudentID, &g.CourseID, &g.PromotionID,
			&g.Score, &g.Status, &g.Session, &g.Type, &g.AssessmentTitle,
			&g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, nil
}

func (r *Repository) UpsertGrade(ctx context.Context, g *domain.Grade) (*domain.Grade, error) {
	const q = `
		INSERT INTO grades (id, student_id, course_id, promotion_id, score, status, session, type, assessment_title)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,''))
		ON CONFLICT (student_id, course_id, type, assessment_title)
		DO UPDATE SET score=EXCLUDED.score, session=EXCLUDED.session, updated_at=NOW()
		RETURNING id, student_id, course_id, promotion_id, score, status, session, type,
		          COALESCE(assessment_title,''), created_at, updated_at`
	err := r.db.QueryRow(ctx, q,
		g.ID, g.StudentID, g.CourseID, g.PromotionID, g.Score, g.Status,
		g.Session, g.Type, g.AssessmentTitle,
	).Scan(&g.ID, &g.StudentID, &g.CourseID, &g.PromotionID, &g.Score, &g.Status,
		&g.Session, &g.Type, &g.AssessmentTitle, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("upserting grade: %w", err)
	}
	return g, nil
}

func (r *Repository) UpdateGradeStatus(ctx context.Context, id string, status domain.GradeStatus) error {
	const q = `UPDATE grades SET status=$2, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, id, status)
	return err
}

// ─── Appeals ──────────────────────────────────────────────────────────────────

func (r *Repository) ListAppeals(ctx context.Context, studentID, status string) ([]domain.GradeAppeal, error) {
	q := `SELECT id, student_id, course_id, grade_id, reason, status,
	             COALESCE(response,''), estimated_grade, COALESCE(proof_url,''),
	             COALESCE(status_message,''), created_at, updated_at
	        FROM grade_appeals WHERE 1=1`
	args := []any{}
	i := 1
	if studentID != "" {
		q += fmt.Sprintf(` AND student_id = $%d`, i); args = append(args, studentID); i++
	}
	if status != "" {
		q += fmt.Sprintf(` AND status = $%d`, i); args = append(args, status); i++
	}
	q += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing appeals: %w", err)
	}
	defer rows.Close()

	var appeals []domain.GradeAppeal
	for rows.Next() {
		var a domain.GradeAppeal
		if err := rows.Scan(&a.ID, &a.StudentID, &a.CourseID, &a.GradeID, &a.Reason, &a.Status,
			&a.Response, &a.EstimatedGrade, &a.ProofURL, &a.StatusMessage,
			&a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		appeals = append(appeals, a)
	}
	return appeals, nil
}

func (r *Repository) CreateAppeal(ctx context.Context, a *domain.GradeAppeal) error {
	const q = `INSERT INTO grade_appeals (id, student_id, course_id, grade_id, reason, status, estimated_grade, proof_url)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,NULLIF($8,''))`
	_, err := r.db.Exec(ctx, q, a.ID, a.StudentID, a.CourseID, a.GradeID, a.Reason, a.Status, a.EstimatedGrade, a.ProofURL)
	return err
}

func (r *Repository) ResolveAppeal(ctx context.Context, id, status, responseText string) error {
	const q = `UPDATE grade_appeals SET status=$2, response=$3, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, id, status, responseText)
	return err
}

// ─── Assignments ──────────────────────────────────────────────────────────────

func (r *Repository) ListAssignments(ctx context.Context, courseID, teacherID string) ([]domain.Assignment, error) {
	q := `SELECT id, course_id, teacher_id, title, description, due_date,
	             COALESCE(deadline_time,''), COALESCE(duration_minutes,0), type, created_at, updated_at
	        FROM assignments WHERE 1=1`
	args := []any{}
	i := 1
	if courseID != "" {
		q += fmt.Sprintf(` AND course_id = $%d`, i); args = append(args, courseID); i++
	}
	if teacherID != "" {
		q += fmt.Sprintf(` AND teacher_id = $%d`, i); args = append(args, teacherID); i++
	}
	q += ` ORDER BY due_date DESC`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing assignments: %w", err)
	}
	defer rows.Close()

	var assignments []domain.Assignment
	for rows.Next() {
		var a domain.Assignment
		if err := rows.Scan(&a.ID, &a.CourseID, &a.TeacherID, &a.Title, &a.Description,
			&a.DueDate, &a.DeadlineTime, &a.DurationMinutes, &a.Type, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (r *Repository) CreateAssignment(ctx context.Context, a *domain.Assignment) error {
	const q = `INSERT INTO assignments (id, course_id, teacher_id, title, description, due_date, deadline_time, duration_minutes, type)
	           VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,''),NULLIF($8,0),$9)`
	_, err := r.db.Exec(ctx, q, a.ID, a.CourseID, a.TeacherID, a.Title, a.Description,
		a.DueDate, a.DeadlineTime, a.DurationMinutes, a.Type)
	return err
}

func (r *Repository) DeleteAssignment(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM assignments WHERE id = $1`, id)
	return err
}

// ─── Submissions ──────────────────────────────────────────────────────────────

func (r *Repository) ListSubmissions(ctx context.Context, assignmentID, studentID string) ([]domain.Submission, error) {
	q := `SELECT id, assignment_id, student_id, content, submitted_at,
	             grade, COALESCE(feedback,''), created_at, updated_at
	        FROM submissions WHERE 1=1`
	args := []any{}
	i := 1
	if assignmentID != "" {
		q += fmt.Sprintf(` AND assignment_id = $%d`, i); args = append(args, assignmentID); i++
	}
	if studentID != "" {
		q += fmt.Sprintf(` AND student_id = $%d`, i); args = append(args, studentID); i++
	}
	q += ` ORDER BY submitted_at DESC`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing submissions: %w", err)
	}
	defer rows.Close()

	var subs []domain.Submission
	for rows.Next() {
		var s domain.Submission
		if err := rows.Scan(&s.ID, &s.AssignmentID, &s.StudentID, &s.Content,
			&s.SubmittedAt, &s.Grade, &s.Feedback, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func (r *Repository) CreateSubmission(ctx context.Context, s *domain.Submission) error {
	const q = `INSERT INTO submissions (id, assignment_id, student_id, content, submitted_at)
	           VALUES ($1,$2,$3,$4,NOW())`
	_, err := r.db.Exec(ctx, q, s.ID, s.AssignmentID, s.StudentID, s.Content)
	return err
}

func (r *Repository) GradeSubmission(ctx context.Context, id string, grade float64, feedback string) error {
	const q = `UPDATE submissions SET grade=$2, feedback=$3, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, id, grade, feedback)
	return err
}

// ─── Course Resources ─────────────────────────────────────────────────────────

func (r *Repository) ListResources(ctx context.Context, courseID, teacherID string) ([]domain.CourseResource, error) {
	q := `SELECT id, course_id, teacher_id, title, type, url, created_at
	        FROM course_resources WHERE 1=1`
	args := []any{}
	i := 1
	if courseID != "" {
		q += fmt.Sprintf(` AND course_id = $%d`, i); args = append(args, courseID); i++
	}
	if teacherID != "" {
		q += fmt.Sprintf(` AND teacher_id = $%d`, i); args = append(args, teacherID); i++
	}
	q += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing resources: %w", err)
	}
	defer rows.Close()

	var resources []domain.CourseResource
	for rows.Next() {
		var res domain.CourseResource
		if err := rows.Scan(&res.ID, &res.CourseID, &res.TeacherID, &res.Title, &res.Type, &res.URL, &res.CreatedAt); err != nil {
			return nil, err
		}
		resources = append(resources, res)
	}
	return resources, nil
}

func (r *Repository) CreateResource(ctx context.Context, res *domain.CourseResource) error {
	const q = `INSERT INTO course_resources (id, course_id, teacher_id, title, type, url) VALUES ($1,$2,$3,$4,$5,$6)`
	_, err := r.db.Exec(ctx, q, res.ID, res.CourseID, res.TeacherID, res.Title, res.Type, res.URL)
	return err
}

func (r *Repository) DeleteResource(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM course_resources WHERE id = $1`, id)
	return err
}
