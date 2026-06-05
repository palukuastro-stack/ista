package domain

import "time"

// Faculty represents a university faculty (e.g. "Sciences Informatiques").
type Faculty struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"`
	Dean         string    `json:"dean"`
	StudentCount int       `json:"studentCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Promotion is a cohort of students within a faculty at a given academic level
// (e.g. "L1 Informatique").
type Promotion struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	FacultyID    string    `json:"facultyId"`
	Level        string    `json:"level"` // "L1", "L2", "L3" …
	StudentCount int       `json:"studentCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Course is a teaching unit assigned to a promotion and a teacher.
type Course struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Credits     int       `json:"credits"`
	FacultyID   string    `json:"facultyId"`
	PromotionID string    `json:"promotionId"`
	TeacherID   string    `json:"teacherId"`
	RoomID      string    `json:"roomId,omitempty"`
	Hours       int       `json:"hours"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// WeekDay enumerates valid French weekday names used in schedules.
type WeekDay string

const (
	WeekDayMonday    WeekDay = "Lundi"
	WeekDayTuesday   WeekDay = "Mardi"
	WeekDayWednesday WeekDay = "Mercredi"
	WeekDayThursday  WeekDay = "Jeudi"
	WeekDayFriday    WeekDay = "Vendredi"
	WeekDaySaturday  WeekDay = "Samedi"
)

// ScheduleSlot represents a recurring weekly time slot for a course.
type ScheduleSlot struct {
	ID          string    `json:"id"`
	CourseID    string    `json:"courseId"`
	PromotionID string    `json:"promotionId"`
	TeacherID   string    `json:"teacherId"`
	Day         WeekDay   `json:"day"`
	Start       string    `json:"start"` // "HH:MM"
	End         string    `json:"end"`   // "HH:MM"
	Room        string    `json:"room"`
	StartDate   string    `json:"startDate,omitempty"` // ISO date
	EndDate     string    `json:"endDate,omitempty"`   // ISO date
	CreatedAt   time.Time `json:"createdAt"`
}

// RoomCategory classifies a physical room.
type RoomCategory string

const (
	RoomCategoryLab        RoomCategory = "Laboratoire"
	RoomCategoryClassroom  RoomCategory = "Salle de cours"
	RoomCategoryAuditorium RoomCategory = "Auditoire"
)

// Room is a physical space that can be assigned to course sessions.
type Room struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Capacity    int          `json:"capacity"`
	Description string       `json:"description"`
	Category    RoomCategory `json:"category"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}
