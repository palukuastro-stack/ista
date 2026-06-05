// Package academic handles the academic entities: faculties, promotions,
// courses, schedule slots, and rooms.
package academic

import (
	"context"
	"fmt"

	"github.com/ista-goma/platform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for academic entities.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new academic repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ─── Faculties ────────────────────────────────────────────────────────────────

func (r *Repository) ListFaculties(ctx context.Context) ([]domain.Faculty, error) {
	const q = `
		SELECT f.id, f.name, f.code, f.dean,
		       COUNT(s.id) AS student_count,
		       f.created_at, f.updated_at
		  FROM faculties f
		  LEFT JOIN students s ON s.faculty_id = f.id
		 GROUP BY f.id
		 ORDER BY f.name`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("listing faculties: %w", err)
	}
	defer rows.Close()

	var faculties []domain.Faculty
	for rows.Next() {
		var f domain.Faculty
		if err := rows.Scan(&f.ID, &f.Name, &f.Code, &f.Dean, &f.StudentCount, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning faculty: %w", err)
		}
		faculties = append(faculties, f)
	}
	return faculties, nil
}

func (r *Repository) GetFaculty(ctx context.Context, id string) (*domain.Faculty, error) {
	const q = `SELECT id, name, code, dean, created_at, updated_at FROM faculties WHERE id = $1`
	var f domain.Faculty
	err := r.db.QueryRow(ctx, q, id).Scan(&f.ID, &f.Name, &f.Code, &f.Dean, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting faculty: %w", err)
	}
	return &f, nil
}

func (r *Repository) CreateFaculty(ctx context.Context, f *domain.Faculty) error {
	const q = `
		INSERT INTO faculties (id, name, code, dean)
		     VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, q, f.ID, f.Name, f.Code, f.Dean)
	return err
}

func (r *Repository) UpdateFaculty(ctx context.Context, f *domain.Faculty) error {
	const q = `UPDATE faculties SET name=$2, code=$3, dean=$4, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, f.ID, f.Name, f.Code, f.Dean)
	return err
}

func (r *Repository) DeleteFaculty(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM faculties WHERE id = $1`, id)
	return err
}

// ─── Promotions ───────────────────────────────────────────────────────────────

func (r *Repository) ListPromotions(ctx context.Context, facultyID string) ([]domain.Promotion, error) {
	q := `
		SELECT p.id, p.name, p.faculty_id, p.level,
		       COUNT(s.id) AS student_count,
		       p.created_at, p.updated_at
		  FROM promotions p
		  LEFT JOIN students s ON s.promotion_id = p.id`
	args := []any{}
	if facultyID != "" {
		q += ` WHERE p.faculty_id = $1`
		args = append(args, facultyID)
	}
	q += ` GROUP BY p.id ORDER BY p.name`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing promotions: %w", err)
	}
	defer rows.Close()

	var promotions []domain.Promotion
	for rows.Next() {
		var p domain.Promotion
		if err := rows.Scan(&p.ID, &p.Name, &p.FacultyID, &p.Level, &p.StudentCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		promotions = append(promotions, p)
	}
	return promotions, nil
}

func (r *Repository) CreatePromotion(ctx context.Context, p *domain.Promotion) error {
	const q = `INSERT INTO promotions (id, name, faculty_id, level) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, q, p.ID, p.Name, p.FacultyID, p.Level)
	return err
}

func (r *Repository) UpdatePromotion(ctx context.Context, p *domain.Promotion) error {
	const q = `UPDATE promotions SET name=$2, faculty_id=$3, level=$4, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, p.ID, p.Name, p.FacultyID, p.Level)
	return err
}

func (r *Repository) DeletePromotion(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM promotions WHERE id = $1`, id)
	return err
}

// ─── Courses ──────────────────────────────────────────────────────────────────

func (r *Repository) ListCourses(ctx context.Context, facultyID, promotionID, teacherID string) ([]domain.Course, error) {
	q := `SELECT id, code, name, credits, faculty_id, promotion_id, teacher_id,
	             COALESCE(room_id,''), hours, created_at, updated_at
	        FROM courses WHERE 1=1`
	args := []any{}
	i := 1
	if facultyID != "" {
		q += fmt.Sprintf(` AND faculty_id = $%d`, i); args = append(args, facultyID); i++
	}
	if promotionID != "" {
		q += fmt.Sprintf(` AND promotion_id = $%d`, i); args = append(args, promotionID); i++
	}
	if teacherID != "" {
		q += fmt.Sprintf(` AND teacher_id = $%d`, i); args = append(args, teacherID); i++
	}
	q += ` ORDER BY name`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing courses: %w", err)
	}
	defer rows.Close()

	var courses []domain.Course
	for rows.Next() {
		var c domain.Course
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Credits, &c.FacultyID,
			&c.PromotionID, &c.TeacherID, &c.RoomID, &c.Hours, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}
	return courses, nil
}

func (r *Repository) GetCourse(ctx context.Context, id string) (*domain.Course, error) {
	const q = `SELECT id, code, name, credits, faculty_id, promotion_id, teacher_id,
	                  COALESCE(room_id,''), hours, created_at, updated_at
	             FROM courses WHERE id = $1`
	var c domain.Course
	err := r.db.QueryRow(ctx, q, id).Scan(&c.ID, &c.Code, &c.Name, &c.Credits, &c.FacultyID,
		&c.PromotionID, &c.TeacherID, &c.RoomID, &c.Hours, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting course: %w", err)
	}
	return &c, nil
}

func (r *Repository) CreateCourse(ctx context.Context, c *domain.Course) error {
	const q = `INSERT INTO courses (id, code, name, credits, faculty_id, promotion_id, teacher_id, room_id, hours)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,NULLIF($8,''),$9)`
	_, err := r.db.Exec(ctx, q, c.ID, c.Code, c.Name, c.Credits, c.FacultyID, c.PromotionID, c.TeacherID, c.RoomID, c.Hours)
	return err
}

func (r *Repository) UpdateCourse(ctx context.Context, c *domain.Course) error {
	const q = `UPDATE courses SET code=$2, name=$3, credits=$4, faculty_id=$5, promotion_id=$6,
	           teacher_id=$7, room_id=NULLIF($8,''), hours=$9, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, c.ID, c.Code, c.Name, c.Credits, c.FacultyID, c.PromotionID, c.TeacherID, c.RoomID, c.Hours)
	return err
}

func (r *Repository) AssignTeacher(ctx context.Context, courseID, teacherID string) error {
	const q = `UPDATE courses SET teacher_id=$2, updated_at=NOW() WHERE id=$1`
	_, err := r.db.Exec(ctx, q, courseID, teacherID)
	return err
}

func (r *Repository) DeleteCourse(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM courses WHERE id = $1`, id)
	return err
}

// ─── Schedules ────────────────────────────────────────────────────────────────

func (r *Repository) ListSchedules(ctx context.Context, promotionID, teacherID string) ([]domain.ScheduleSlot, error) {
	q := `SELECT id, course_id, promotion_id, teacher_id, day, start_time, end_time, room,
	             COALESCE(start_date,''), COALESCE(end_date,''), created_at
	        FROM schedules WHERE 1=1`
	args := []any{}
	i := 1
	if promotionID != "" {
		q += fmt.Sprintf(` AND promotion_id = $%d`, i); args = append(args, promotionID); i++
	}
	if teacherID != "" {
		q += fmt.Sprintf(` AND teacher_id = $%d`, i); args = append(args, teacherID); i++
	}
	q += ` ORDER BY day, start_time`

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("listing schedules: %w", err)
	}
	defer rows.Close()

	var slots []domain.ScheduleSlot
	for rows.Next() {
		var s domain.ScheduleSlot
		if err := rows.Scan(&s.ID, &s.CourseID, &s.PromotionID, &s.TeacherID, &s.Day,
			&s.Start, &s.End, &s.Room, &s.StartDate, &s.EndDate, &s.CreatedAt); err != nil {
			return nil, err
		}
		slots = append(slots, s)
	}
	return slots, nil
}

func (r *Repository) CreateScheduleSlot(ctx context.Context, s *domain.ScheduleSlot) error {
	const q = `INSERT INTO schedules (id, course_id, promotion_id, teacher_id, day, start_time, end_time, room, start_date, end_date)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,''),NULLIF($10,''))`
	_, err := r.db.Exec(ctx, q, s.ID, s.CourseID, s.PromotionID, s.TeacherID, s.Day, s.Start, s.End, s.Room, s.StartDate, s.EndDate)
	return err
}

func (r *Repository) DeleteScheduleSlot(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM schedules WHERE id = $1`, id)
	return err
}

// CheckConflict returns any existing schedule slot that conflicts with the given parameters.
func (r *Repository) CheckConflict(ctx context.Context, room, day, start, end, excludeID string) (*domain.ScheduleSlot, error) {
	const q = `
		SELECT id, course_id, promotion_id, teacher_id, day, start_time, end_time, room,
		       COALESCE(start_date,''), COALESCE(end_date,''), created_at
		  FROM schedules
		 WHERE room = $1 AND day = $2
		   AND start_time < $4 AND end_time > $3
		   AND ($5 = '' OR id != $5)
		 LIMIT 1`
	var s domain.ScheduleSlot
	err := r.db.QueryRow(ctx, q, room, day, start, end, excludeID).Scan(
		&s.ID, &s.CourseID, &s.PromotionID, &s.TeacherID, &s.Day,
		&s.Start, &s.End, &s.Room, &s.StartDate, &s.EndDate, &s.CreatedAt,
	)
	if err != nil {
		return nil, nil // no conflict found
	}
	return &s, nil
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

func (r *Repository) ListRooms(ctx context.Context) ([]domain.Room, error) {
	const q = `SELECT id, name, capacity, description, category, created_at, updated_at FROM rooms ORDER BY name`
	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("listing rooms: %w", err)
	}
	defer rows.Close()

	var rooms []domain.Room
	for rows.Next() {
		var room domain.Room
		if err := rows.Scan(&room.ID, &room.Name, &room.Capacity, &room.Description,
			&room.Category, &room.CreatedAt, &room.UpdatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, room)
	}
	return rooms, nil
}

func (r *Repository) CreateRoom(ctx context.Context, room *domain.Room) error {
	const q = `INSERT INTO rooms (id, name, capacity, description, category) VALUES ($1,$2,$3,$4,$5)`
	_, err := r.db.Exec(ctx, q, room.ID, room.Name, room.Capacity, room.Description, room.Category)
	return err
}

func (r *Repository) DeleteRoom(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM rooms WHERE id = $1`, id)
	return err
}
