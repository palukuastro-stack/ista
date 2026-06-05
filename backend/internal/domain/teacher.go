package domain

import "time"

// TeacherStatus represents the employment state of a teacher.
type TeacherStatus string

const (
	TeacherStatusActive  TeacherStatus = "active"
	TeacherStatusPending TeacherStatus = "pending"
)

// Teacher contains the professional profile of a teaching staff member.
// It is linked 1-to-1 with a User record.
type Teacher struct {
	ID          string        `json:"id"`
	Matricule   string        `json:"matricule"`
	FirstName   string        `json:"firstName"`
	LastName    string        `json:"lastName"`
	MiddleName  string        `json:"middleName"`
	Email       string        `json:"email"`
	Phone       string        `json:"phone"`
	FacultyID   string        `json:"facultyId"`
	Title       string        `json:"title"` // e.g. "Professeur", "Assistant"
	CourseIDs   []string      `json:"courseIds"`
	Status      TeacherStatus `json:"status"`
	Description string        `json:"description,omitempty"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}

// TeacherTitle is a valid academic title for a teacher.
var TeacherTitles = []string{
	"Professeur",
	"Professeure",
	"Assistant",
	"Assistante",
	"Chef de Travaux",
	"Maître de Conférences",
}
